/**
 * middleware.ts
 *
 * Next.js Edge middleware — authentication & authorization.
 *
 * AUTHENTICATION STRATEGY (dual-track):
 *  1. Supabase Session (preferred): detected via Supabase SSR cookie tokens.
 *     Used by Google OAuth users and any user who signs in through Supabase.
 *  2. Custom JWT cookie ("token"): used by MongoDB email/password users.
 *
 * Both tracks are accepted. This allows Google OAuth and Email/Password to
 * coexist while Supabase Auth is being adopted as the primary auth system.
 *
 * AUTHORIZATION:
 *  - /ui/server_config/* → admin-only (checked via JWT payload or Supabase profile)
 *  - /auth/select-role   → public (needed for Google first-login onboarding)
 *  - /auth/callback      → public (OAuth redirect)
 *  - /ui/*               → any authenticated user
 *
 * NOTE: Middleware runs on Edge runtime. Role on Supabase track is read from
 *       the JWT sub-token injected by Supabase SSR — not the DB. DB-level
 *       role enforcement happens in server components and API route handlers.
 */

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { verifyAuthToken } from "@/lib/jwt";
import { normalizeRole, ROLES } from "@/lib/authorization";

// Paths that bypass authentication entirely
const PUBLIC_PATHS = [
    "/login",
    "/register",
    "/forgot-password",
    "/contact",
    "/help",
    "/privacy",
    "/terms",
    "/auth/callback",
    "/auth/select-role",
    "/",
];

// Paths restricted to admin role only
const ADMIN_ONLY_UI_PATHS = ["/ui/server_config"];

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
}

function isAdminOnlyPath(pathname: string): boolean {
    return ADMIN_ONLY_UI_PATHS.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // ── Public paths ───────────────────────────────────────────────────────
    if (isPublicPath(pathname)) {
        // Already-logged-in users trying /login or /register → redirect dashboard
        if (pathname === "/login" || pathname === "/register") {
            const token = request.cookies.get("token")?.value;
            if (token) {
                const payload = await verifyAuthToken(token);
                if (payload) {
                    return NextResponse.redirect(new URL("/ui/dashboard", request.url));
                }
            }
            // Also check Supabase session
            const supabaseSession = await getSupabaseUserFromRequest(request);
            if (supabaseSession) {
                return NextResponse.redirect(new URL("/ui/dashboard", request.url));
            }
        }
        return NextResponse.next();
    }

    // ── Protected paths ────────────────────────────────────────────────────
    // Track 1: Custom JWT cookie
    const token = request.cookies.get("token")?.value;
    if (token) {
        const payload = await verifyAuthToken(token);
        if (payload) {
            // Enforce admin-only paths
            if (isAdminOnlyPath(pathname)) {
                const role = normalizeRole(payload.role as string);
                if (role !== ROLES.ADMIN) {
                    const url = new URL("/ui/dashboard", request.url);
                    url.searchParams.set("error", "forbidden");
                    return NextResponse.redirect(url);
                }
            }
            return NextResponse.next();
        }
        // Token expired/invalid → clear it and fall through to Supabase check
        const response = await checkSupabaseOrRedirect(request, pathname);
        response.cookies.set("token", "", { path: "/", expires: new Date(0), httpOnly: true });
        return response;
    }

    // Track 2: Supabase session
    return checkSupabaseOrRedirect(request, pathname);
}

/**
 * Checks Supabase session. If authenticated, allows access (with admin guard).
 * If not authenticated, redirects to /login.
 * Supabase SSR refreshes session cookies as needed.
 */
async function checkSupabaseOrRedirect(
    request: NextRequest,
    pathname: string
): Promise<NextResponse> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // If Supabase is not configured, redirect to login (no session possible)
    if (!supabaseUrl || !supabaseAnonKey ||
        supabaseUrl === "https://placeholder-project.supabase.co") {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    const response = NextResponse.next({ request });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value, options }) => {
                    response.cookies.set(name, value, options);
                });
            },
        },
    });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // For admin-only paths: read role from Supabase user metadata or profile
    // Note: Full DB check happens in server components; here we do best-effort
    if (isAdminOnlyPath(pathname)) {
        // We can't query DB in Edge middleware — we'll rely on server component guard
        // But we can check app_metadata set by service role if available
        const role = user.app_metadata?.role || user.user_metadata?.role;
        if (role && normalizeRole(role) !== ROLES.ADMIN) {
            const url = new URL("/ui/dashboard", request.url);
            url.searchParams.set("error", "forbidden");
            return NextResponse.redirect(url);
        }
        // If role not in metadata, let server component do the final check
    }

    return response;
}

/**
 * Attempts to get Supabase user from request cookies without mutating response.
 * Used only for the login/register redirect check.
 */
async function getSupabaseUserFromRequest(request: NextRequest): Promise<boolean> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey ||
        supabaseUrl === "https://placeholder-project.supabase.co") {
        return false;
    }

    try {
        const tempResponse = NextResponse.next();
        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
                getAll() { return request.cookies.getAll(); },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        tempResponse.cookies.set(name, value, options);
                    });
                },
            },
        });
        const { data: { user } } = await supabase.auth.getUser();
        return !!user;
    } catch {
        return false;
    }
}

export const config = {
    matcher: [
        "/login",
        "/register",
        "/ui/:path*",
    ],
};