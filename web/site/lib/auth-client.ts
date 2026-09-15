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

import {
    authenticatedProfileRole,
    type AuthenticatedRole,
} from "@/lib/auth-routing";

export type AuthUser = {
    id?: string;
    _id?: string;
    name?: string;
    full_name?: string;
    email?: string;
    role?: AuthenticatedRole;
    studentCode?: string;
    department?: string;
    avatarUrl?: string;
};

let userPromise: Promise<AuthUser | null> | null = null;
let cachedUser: AuthUser | null = null;
let cacheGeneration = 0;

export async function fetchCurrentUserClient(forceRefresh = false): Promise<AuthUser | null> {
    if (!forceRefresh && cachedUser) {
        return cachedUser;
    }
    if (!forceRefresh && userPromise) {
        return userPromise;
    }

    const generation = ++cacheGeneration;
    userPromise = (async () => {
        try {
            const res = await fetch("/api/auth/me", { cache: "no-store" });
            if (!res.ok) {
                if (generation === cacheGeneration) cachedUser = null;
                return null;
            }
            const json = await res.json();
            if (generation !== cacheGeneration) return null;
            const rawUser = (json.user || json.data || null) as
                | (Omit<AuthUser, "role"> & { role?: unknown })
                | null;
            if (!rawUser) {
                cachedUser = null;
                return null;
            }
            const role = authenticatedProfileRole(rawUser.role);
            cachedUser = {
                ...rawUser,
                role: role || undefined,
            };
            return cachedUser;
        } catch {
            return null;
        } finally {
            if (generation === cacheGeneration) userPromise = null;
        }
    })();

    return userPromise;
}

export function clearCurrentUserCache() {
    cacheGeneration++;
    cachedUser = null;
    userPromise = null;
}
