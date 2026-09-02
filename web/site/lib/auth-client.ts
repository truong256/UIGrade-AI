/**
 * lib/auth-client.ts
 *
 * Client-side cached helper for current authenticated user info.
 * Deduplicates concurrent `/api/auth/me` requests across components in the same page tree.
 *
 * NOTE: This is for UI rendering optimization only.
 * Server-side RBAC and authorization in API routes and server actions
 * MUST independently verify JWT/session cookies on every request.
 */

export type AuthUser = {
    id?: string;
    _id?: string;
    name?: string;
    full_name?: string;
    email?: string;
    role?: "admin" | "teacher" | "lecturer" | "student" | "User";
    studentCode?: string;
    department?: string;
    avatarUrl?: string;
};

let userPromise: Promise<AuthUser | null> | null = null;
let cachedUser: AuthUser | null = null;

export async function fetchCurrentUserClient(forceRefresh = false): Promise<AuthUser | null> {
    if (!forceRefresh && cachedUser) {
        return cachedUser;
    }
    if (!forceRefresh && userPromise) {
        return userPromise;
    }

    userPromise = (async () => {
        try {
            const res = await fetch("/api/auth/me", { cache: "no-store" });
            if (!res.ok) {
                cachedUser = null;
                return null;
            }
            const json = await res.json();
            cachedUser = json.user || json.data || null;
            return cachedUser;
        } catch {
            return null;
        } finally {
            userPromise = null;
        }
    })();

    return userPromise;
}

export function clearCurrentUserCache() {
    cachedUser = null;
    userPromise = null;
}
