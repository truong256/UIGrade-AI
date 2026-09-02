/**
 * lib/current-user.ts
 *
 * Server-side identity resolution.
 *
 * SECURITY RULES:
 *  1. Role MUST come from a server-verified source:
 *       a. JWT signed with JWT_SECRET (cookie "token") — trusted.
 *       b. Supabase session verified by supabase.auth.getUser() — trusted.
 *     Supabase profiles.role (DB) is preferred over user_metadata.role (client-writable).
 *
 *  2. x-user-id / x-user-role / x-user-email / x-student-code headers from
 *     incoming requests are NEVER trusted for identity or authorization.
 *     These headers are NOT read anywhere in this module.
 *
 *  3. Default role when no valid session exists: null (deny).
 *     There is NO default escalation to any privileged role.
 */

import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeRole, type CanonicalRole, AuthorizationError } from "@/lib/authorization";

export type CurrentUserPayload = {
    userId: string;
    email: string;
    role: CanonicalRole;
    studentCode?: string;
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function parseCookieToken(cookieHeader?: string | null): string | null {
    if (!cookieHeader) return null;

    const tokenPair = cookieHeader
        .split(";")
        .map((item) => item.trim())
        .find((item) => item.startsWith("token="));

    if (!tokenPair) return null;

    return decodeURIComponent(tokenPair.slice("token=".length)) || null;
}

function verifyTokenSafe(token?: string | null): CurrentUserPayload | null {
    if (!token) return null;

    try {
        const payload = verifyToken(token);
        return {
            userId: payload.userId,
            email: payload.email,
            // Role in JWT was set at login time from the DB — normalize it.
            role: normalizeRole(payload.role),
            studentCode: payload.studentCode,
        };
    } catch {
        // Expired, tampered, or malformed token → treat as unauthenticated.
        return null;
    }
}

// ---------------------------------------------------------------------------
// Server-component helper (uses Next.js cookies() store)
// ---------------------------------------------------------------------------

/**
 * Get the current authenticated user in a server component or server action.
 *
 * Priority:
 *  1. Supabase verified session (profiles.role from DB is authoritative).
 *  2. JWT cookie "token" (signed by server at login time).
 *
 * Returns null when the user is not authenticated or the session is invalid.
 */
export async function getCurrentUserFromCookie(): Promise<CurrentUserPayload | null> {
    // 1. Try Supabase session first (most current, DB-backed role)
    try {
        const supabase = await createSupabaseServerClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (user) {
            // Prefer DB profile role over user_metadata.role
            // user_metadata is client-writable and must NOT be used as the
            // authoritative role source.
            const { data: profile } = await (supabase as any)
                .from("profiles")
                .select("role, student_code, status")
                .eq("id", user.id)
                .single();

            const rawRole = profile?.role ?? null; // null if profile not found
            const role = normalizeRole(rawRole); // safe default: "student"

            // If the account is locked in Supabase profiles, deny access.
            if (profile?.status === "locked" || profile?.status === "inactive") {
                return null;
            }

            return {
                userId: user.id,
                email: user.email ?? "",
                role,
                studentCode: profile?.student_code ?? undefined,
            };
        }
    } catch {
        // Supabase not configured / network error → fall through to JWT.
    }

    // 2. Fall back to JWT cookie (used by the MongoDB auth path)
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    return verifyTokenSafe(token);
}

// ---------------------------------------------------------------------------
// Route handler helper (reads from Request cookies only — NO untrusted headers)
// ---------------------------------------------------------------------------

/**
 * Get the current authenticated user from an API route's Request object.
 *
 * SECURITY: This function ONLY reads the "token" cookie from the request.
 * It does NOT read x-user-id, x-user-role, x-user-email, or any other
 * client-controlled header. Those headers are completely ignored.
 *
 * Returns null when the request has no valid authentication.
 */
export function getCurrentUserFromRequest(request: Request): CurrentUserPayload | null {
    // Extract only the cookie header — no other headers are trusted.
    const cookieToken = parseCookieToken(request.headers.get("cookie"));
    return verifyTokenSafe(cookieToken);
}

// ---------------------------------------------------------------------------
// Convenience error classes
// ---------------------------------------------------------------------------

export class UnauthorizedError extends Error {
    statusCode = 401;

    constructor(message = "Bạn chưa đăng nhập") {
        super(message);
        this.name = "UnauthorizedError";
    }
}

export { AuthorizationError };

// ---------------------------------------------------------------------------
// Route helper
// ---------------------------------------------------------------------------

/**
 * Get the actor's userId from a request, throwing UnauthorizedError if missing.
 * @deprecated Prefer getCurrentUserFromRequest() with explicit role checks.
 */
export function getActorIdFromRequest(request: Request): string {
    const currentUser = getCurrentUserFromRequest(request);

    if (!currentUser?.userId) {
        throw new UnauthorizedError("Bạn chưa đăng nhập");
    }

    return currentUser.userId;
}