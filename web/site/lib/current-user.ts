/**
 * Server-side authoritative identity and authorization resolution.
 *
 * Supabase Auth is the only accepted Web identity source. Every authenticated
 * request is revalidated with auth.getUser(), then the canonical role/status is
 * loaded from public.profiles so stale client metadata can never grant access.
 */

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
    normalizeRole,
    isAccountAccessAllowed,
    type CanonicalRole,
    AuthorizationError,
} from "@/lib/authorization";
import { isAuthenticatedRole } from "@/lib/auth-routing";

export type CurrentUserPayload = {
    userId: string;
    email: string;
    role: CanonicalRole;
    studentCode?: string;
};

export type RequestActorResolution =
    | { state: "authenticated"; actor: CurrentUserPayload }
    | { state: "anonymous" }
    | { state: "forbidden" };

type SupabaseActorResult =
    | { state: "authenticated"; actor: CurrentUserPayload }
    | { state: "anonymous" }
    | { state: "forbidden" };

async function resolveSupabaseActor(): Promise<SupabaseActorResult> {
    let supabase;
    try {
        supabase = await createSupabaseServerClient();
    } catch {
        return { state: "anonymous" };
    }

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return { state: "anonymous" };
    }

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, student_code, status")
        .eq("id", user.id)
        .maybeSingle();

    if (
        profileError ||
        !profile ||
        !isAuthenticatedRole(profile.role) ||
        !isAccountAccessAllowed(profile.status)
    ) {
        return { state: "forbidden" };
    }

    return {
        state: "authenticated",
        actor: {
            userId: user.id,
            email: user.email ?? "",
            role: normalizeRole(profile.role),
            studentCode: profile.student_code ?? undefined,
        },
    };
}

/** Get the current authenticated actor in a Server Component or Server Action. */
export async function getCurrentUserFromCookie(): Promise<CurrentUserPayload | null> {
    const result = await resolveSupabaseActor();
    return result.state === "authenticated" ? result.actor : null;
}

/** Get the current authenticated actor for a route handler. */
export async function getCurrentUserFromRequest(_request: Request): Promise<CurrentUserPayload | null> {
    const result = await resolveSupabaseActor();
    return result.state === "authenticated" ? result.actor : null;
}

/**
 * Preserve the distinction between no Supabase session (401) and a verified
 * identity whose profile is pending/disabled/invalid (403).
 */
export async function resolveRequestActorAuthorization(
    _request: Request
): Promise<RequestActorResolution> {
    return resolveSupabaseActor();
}

export async function requireActiveRequestActor(
    _request: Request
): Promise<CurrentUserPayload> {
    let supabase;
    try {
        supabase = await createSupabaseServerClient();
    } catch {
        throw new AuthorizationError("Dịch vụ xác thực chưa được cấu hình", 503);
    }

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new AuthorizationError("Bạn chưa đăng nhập", 401);
    }

    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, student_code, status")
        .eq("id", user.id)
        .maybeSingle();

    if (
        profileError ||
        !profile ||
        !isAuthenticatedRole(profile.role) ||
        !isAccountAccessAllowed(profile.status)
    ) {
        throw new AuthorizationError(
            "Tài khoản chưa được kích hoạt hoặc đã bị vô hiệu hóa",
            403
        );
    }

    return {
        userId: user.id,
        email: user.email ?? "",
        role: normalizeRole(profile.role),
        studentCode: profile.student_code ?? undefined,
    };
}

/** Explicit semantic alias for getCurrentUserFromRequest. */
export const resolveAuthenticatedActor = getCurrentUserFromRequest;

export class UnauthorizedError extends Error {
    statusCode = 401;

    constructor(message = "Bạn chưa đăng nhập") {
        super(message);
        this.name = "UnauthorizedError";
    }
}

export { AuthorizationError };

export async function getActorIdFromRequest(request: Request): Promise<string> {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser?.userId) {
        throw new UnauthorizedError("Bạn chưa đăng nhập hoặc tài khoản đã bị khóa");
    }
    return currentUser.userId;
}
