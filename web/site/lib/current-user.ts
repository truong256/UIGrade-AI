/**
 * lib/current-user.ts
 *
 * Server-side authoritative identity and authorization resolution.
 *
 * SECURITY DESIGN:
 *  1. Tokens / Sessions are cryptographically verified:
 *       a. Supabase: supabase.auth.getUser() -> verifies session & signature with Supabase auth.
 *       b. JWT: verifyToken(token) -> verifies signature & expiration with JWT_SECRET.
 *
 *  2. STALE TOKEN DEFENSE (P0 Hardening):
 *     The role in the JWT token is NEVER treated as the final authorization authority.
 *     After verifying the token signature, the actor's current status and role are
 *     ALWAYS revalidated from the authoritative database:
 *       - MongoDB: User.findById(userId) -> checks existence, isActive status, and current role.
 *       - Supabase: public.profiles.select("role, status") -> checks existence, status, and current role.
 *
 *     If the account was locked (isActive=false / status=locked), demoted, or deleted
 *     after token issuance, the permissions drop IMMEDIATELY on the next request.
 *
 *  3. x-user-* headers (x-user-id, x-user-role, x-user-email, x-student-code)
 *     are NEVER read or trusted.
 *
 *  4. Default state when not authenticated or invalid: null (deny all).
 */

import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeRole, isAccountAccessAllowed, type CanonicalRole, AuthorizationError } from "@/lib/authorization";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User.model";

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

/**
 * Revalidates a verified JWT payload against the authoritative database.
 *
 * Ensures:
 *  1. The user account still exists (if deleted -> null / 401).
 *  2. The account is active (if isActive=false -> null / 403).
 *  3. The current role is loaded from DB (prevents stale admin JWT privilege).
 */
async function resolveAuthoritativeActorFromToken(token?: string | null): Promise<CurrentUserPayload | null> {
    if (!token) return null;

    let payload: ReturnType<typeof verifyToken>;
    try {
        payload = verifyToken(token);
    } catch {
        // Expired, tampered, or malformed token -> reject immediately
        return null;
    }

    if (!payload?.userId) return null;

    try {
        await connectDB();
        const user = await User.findById(payload.userId)
            .select("_id name email role studentCode isActive isVerified")
            .lean();

        if (!user) {
            // User was deleted from DB -> token revoked
            return null;
        }

        if (!isAccountAccessAllowed(undefined, user.isActive)) {
            // Account is locked/suspended -> access revoked immediately
            return null;
        }

        // Authoritative role from database (not stale token claim)
        const authoritativeRole = normalizeRole(user.role);

        return {
            userId: String(user._id),
            email: user.email || payload.email || "",
            role: authoritativeRole,
            studentCode: user.studentCode || undefined,
        };
    } catch {
        // DB error -> fail secure (do not grant unverified access)
        return null;
    }
}

// ---------------------------------------------------------------------------
// Server-component helper (uses Next.js cookies() store)
// ---------------------------------------------------------------------------

/**
 * Get the current authenticated actor in a Server Component or Server Action.
 *
 * Priority:
 *  1. Supabase verified session (profiles.role and profiles.status from DB).
 *  2. MongoDB verified user (User.role and User.isActive from DB).
 *
 * Returns null when unauthenticated, invalid, locked, or deleted.
 */
export async function getCurrentUserFromCookie(): Promise<CurrentUserPayload | null> {
    // 1. Try Supabase session first (DB-backed profile)
    try {
        const supabase = await createSupabaseServerClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (user) {
            const { data: profile } = await (supabase as any)
                .from("profiles")
                .select("role, student_code, status")
                .eq("id", user.id)
                .single();

            if (!profile) return null; // Fail secure if profile does not exist

            if (!isAccountAccessAllowed(profile.status)) {
                return null; // Locked/inactive/banned in Supabase -> revoked
            }

            return {
                userId: user.id,
                email: user.email ?? "",
                role: normalizeRole(profile.role),
                studentCode: profile.student_code ?? undefined,
            };
        }
    } catch {
        // Supabase not configured -> fall through to MongoDB JWT path
    }

    // 2. JWT cookie revalidated against MongoDB
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    return resolveAuthoritativeActorFromToken(token);
}

// ---------------------------------------------------------------------------
// Route handler helper (reads from Request cookies only — NO untrusted headers)
// ---------------------------------------------------------------------------

/**
 * Get the current authenticated actor from an API route's Request object.
 * Revalidates user status and role against the database on every request.
 *
 * SECURITY:
 *  - Only reads the "token" cookie. Untrusted headers (x-user-*) are ignored.
 *  - Queries DB for current status and role — prevents stale JWT privilege escalation.
 *
 * Returns null when unauthenticated, token is invalid, or user is locked/deleted.
 */
export async function getCurrentUserFromRequest(request: Request): Promise<CurrentUserPayload | null> {
    const cookieToken = parseCookieToken(request.headers.get("cookie"));
    return resolveAuthoritativeActorFromToken(cookieToken);
}

/**
 * Explicit semantic alias for getCurrentUserFromRequest.
 */
export const resolveAuthenticatedActor = getCurrentUserFromRequest;

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
 * Get the actor's userId from a request, throwing UnauthorizedError if missing or revoked.
 */
export async function getActorIdFromRequest(request: Request): Promise<string> {
    const currentUser = await getCurrentUserFromRequest(request);

    if (!currentUser?.userId) {
        throw new UnauthorizedError("Bạn chưa đăng nhập hoặc tài khoản đã bị khóa");
    }

    return currentUser.userId;
}