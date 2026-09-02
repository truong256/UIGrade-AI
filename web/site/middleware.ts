/**
 * middleware.ts
 *
 * Next.js Edge middleware for route-level authentication and authorization.
 *
 * SECURITY DESIGN:
 *  - Public paths bypass authentication (login, register, etc.)
 *  - All /ui/* paths require authentication (valid JWT token).
 *  - Admin-only paths additionally require the "admin" role from the JWT.
 *    This is a defense-in-depth measure. Server components and API routes
 *    independently enforce their own authorization checks.
 *  - Role is read from the verified JWT payload — NOT from query params,
 *    cookies set by the client, or request headers.
 *
 * NOTE: Middleware runs on the Edge runtime. It cannot access the database.
 *  The JWT role value was set at login time from the DB. For DB-level role
 *  enforcement, rely on server components and API route handlers.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/jwt";
import { normalizeRole, ROLES } from "@/lib/authorization";

// Paths accessible without authentication
const PUBLIC_PATHS = [
    "/login",
    "/register",
    "/forgot-password",
    "/contact",
    "/help",
    "/privacy",
    "/terms",
];

// UI paths that require the "admin" role.
// Teachers/Lecturers/Students accessing these paths are redirected.
const ADMIN_ONLY_UI_PATHS = [
    "/ui/server_config",
];

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
    const token = request.cookies.get("token")?.value;

    // --- Already-logged-in users trying to access login/register → redirect ---
    if (pathname === "/login" || pathname === "/register") {
        if (token) {
            const payload = await verifyAuthToken(token);
            if (payload) {
                return NextResponse.redirect(new URL("/ui/dashboard", request.url));
            }
        }
        return NextResponse.next();
    }

    // --- Public paths bypass auth entirely ---
    if (isPublicPath(pathname)) {
        return NextResponse.next();
    }

    // --- Protected paths: require valid token ---
    if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    const payload = await verifyAuthToken(token);

    if (!payload) {
        // Token expired, tampered, or invalid → clear cookie and redirect to login
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.set("token", "", {
            path: "/",
            expires: new Date(0),
            httpOnly: true,
        });
        return response;
    }

    // --- Admin-only paths: require admin role ---
    if (isAdminOnlyPath(pathname)) {
        const role = normalizeRole(payload.role as string);
        if (role !== ROLES.ADMIN) {
            // Non-admin trying to access admin UI → redirect to dashboard with error
            const url = new URL("/ui/dashboard", request.url);
            url.searchParams.set("error", "forbidden");
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/",
        "/login",
        "/register",
        "/forgot-password",
        "/ui/:path*",
    ],
};