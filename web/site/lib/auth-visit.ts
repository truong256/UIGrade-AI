import { NextRequest, NextResponse } from "next/server";

// A short navigation handoff, never an authentication credential. The normal
// Supabase identity, profile and role checks still run before granting access.
export const AUTH_ENTRY_COOKIE = "uigrade-auth-entry";
const HANDOFF_MS = 30_000;
const AUTH_DESTINATIONS = new Set([
    "/ui/dashboard",
    "/ui/server_config",
    "/auth/select-role",
    "/reset-password",
]);

export function isDocumentEntry(request: NextRequest): boolean {
    if (request.headers.get("sec-fetch-dest") === "document") return true;
    return request.headers.get("rsc") !== "1" &&
        (request.headers.get("accept") ?? "").includes("text/html");
}

export function allowOAuthArrival(response: NextResponse, destination: string): NextResponse {
    if (!AUTH_DESTINATIONS.has(destination)) throw new Error("Invalid auth destination");
    response.cookies.set(AUTH_ENTRY_COOKIE, JSON.stringify({
        path: destination, expires: Date.now() + HANDOFF_MS,
    }), {
        httpOnly: true, secure: process.env.NODE_ENV === "production",
        sameSite: "lax", path: "/", maxAge: HANDOFF_MS / 1000,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
}

export function hasOAuthArrival(request: NextRequest): boolean {
    try {
        const value = JSON.parse(request.cookies.get(AUTH_ENTRY_COOKIE)?.value ?? "null");
        const remaining = value?.expires - Date.now();
        return AUTH_DESTINATIONS.has(value?.path) && value.path === request.nextUrl.pathname &&
            Number.isFinite(remaining) && remaining > 0 && remaining <= HANDOFF_MS;
    } catch {
        return false;
    }
}

export function isProjectAuthCookie(name: string): boolean {
    if (name === "token" || name === AUTH_ENTRY_COOKIE) return true;
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) return false;
    const key = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
    return name === key || name.startsWith(`${key}.`) ||
        name === `${key}-code-verifier` || name.startsWith(`${key}-code-verifier.`);
}

export function expireVisitCookies(request: NextRequest, publicPath: boolean): NextResponse {
    const names = request.cookies.getAll().map(({ name }) => name).filter(isProjectAuthCookie);
    for (const name of names) request.cookies.delete(name);
    // Strip upstream cookies too: a public Server Component must not see the old identity.
    const response = publicPath
        ? NextResponse.next({ request: { headers: request.headers } })
        : NextResponse.redirect(new URL("/login", request.url));
    for (const name of names) {
        response.cookies.set(name, "", { path: "/", expires: new Date(0), maxAge: 0 });
    }
    response.headers.set("Cache-Control", "no-store");
    return response;
}
