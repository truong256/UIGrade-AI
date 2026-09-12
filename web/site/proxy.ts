import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_ENTRY_COOKIE, expireVisitCookies, hasOAuthArrival, isDocumentEntry } from "@/lib/auth-visit";
import {
    dashboardForRole,
    authenticatedProfileRole,
    isAuthenticatedRole,
    isRouteAllowedForRole,
    type AuthenticatedRole,
} from "@/lib/auth-routing";

const PUBLIC_PATHS = [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/contact",
    "/help",
    "/privacy",
    "/terms",
    "/",
];

function isPublicPath(pathname: string): boolean {
    return PUBLIC_PATHS.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
    );
}

function redirectWithCookies(
    request: NextRequest,
    source: NextResponse,
    destination: string
): NextResponse {
    const response = NextResponse.redirect(new URL(destination, request.url));
    response.headers.set("Cache-Control", "no-store");
    source.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    return response;
}

function forbiddenRedirect(
    request: NextRequest,
    source: NextResponse,
    role: AuthenticatedRole
): NextResponse {
    const url = new URL(dashboardForRole(role), request.url);
    url.searchParams.set("error", "forbidden");
    return redirectWithCookies(request, source, `${url.pathname}${url.search}`);
}

async function getSupabaseIdentity(request: NextRequest) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const response = NextResponse.next({ request });

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("placeholder")) {
        return { response, user: null, role: null, status: null };
    }

    try {
        const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options);
                    });
                },
            },
        });

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) return { response, user: null, role: null, status: null };

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("role, status")
            .eq("id", user.id)
            .maybeSingle();

        if (profileError) return { response, user: null, role: null, status: null };

        return {
            response,
            user,
            role: authenticatedProfileRole(profile?.role),
            status: profile?.status ?? null,
        };
    } catch {
        // Keep login available during outages; protected routes remain closed.
        // Preserve cookies refreshed before the failure without logging session data.
        return { response, user: null, role: null, status: null };
    }
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const documentEntry = isDocumentEntry(request);
    // A new document (including reload/new tab) must not silently reuse an old
    // browser session. OAuth's immediate redirect consumes its one-use handoff.
    if (documentEntry && !hasOAuthArrival(request)) {
        return expireVisitCookies(request, isPublicPath(pathname));
    }

    const { response, user, role, status } = await getSupabaseIdentity(request);
    response.headers.set("Cache-Control", "no-store");
    if (documentEntry) {
        response.cookies.set(AUTH_ENTRY_COOKIE, "", { path: "/", maxAge: 0 });
    }

    // A blocked account must be able to see login, not bounce login -> dashboard -> login.
    if (user && status !== null && status !== "active") {
        return isPublicPath(pathname)
            ? response
            : redirectWithCookies(request, response, "/login?error=account_inactive");
    }

    if (pathname === "/auth/select-role") {
        if (!user) return redirectWithCookies(request, response, "/login");
        if (isAuthenticatedRole(role)) {
            return redirectWithCookies(request, response, dashboardForRole(role));
        }
        return response;
    }

    if (isPublicPath(pathname)) {
        if ((pathname === "/login" || pathname === "/register") && user) {
            if (!isAuthenticatedRole(role)) {
                return redirectWithCookies(request, response, "/auth/select-role");
            }
            return redirectWithCookies(request, response, dashboardForRole(role));
        }
        return response;
    }

    if (!user) return redirectWithCookies(request, response, "/login");
    if (!isAuthenticatedRole(role)) {
        return redirectWithCookies(request, response, "/auth/select-role");
    }
    if (status !== "active") {
        return redirectWithCookies(request, response, "/login?error=account_inactive");
    }
    if (!isRouteAllowedForRole(pathname, role)) {
        return forbiddenRedirect(request, response, role);
    }

    return response;
}

export const config = {
    // /auth/callback must exchange the PKCE code before its first protected arrival.
    matcher: ["/", "/login", "/register", "/forgot-password", "/reset-password", "/contact", "/help",
        "/privacy", "/terms", "/auth/select-role", "/ui/:path*"],
};
