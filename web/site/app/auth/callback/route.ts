import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dashboardForRole, authenticatedProfileRole } from "@/lib/auth-routing";
import { allowOAuthArrival } from "@/lib/auth-visit";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    // Handle OAuth provider error (e.g., user cancelled)
    if (errorParam) {
        const errorDesc = errorParam === "access_denied" ? "Đăng nhập Google đã bị hủy" : "Không thể đăng nhập Google";
        return NextResponse.redirect(
            `${origin}/login?error=oauth_failed&message=${encodeURIComponent(errorDesc)}`
        );
    }

    if (!code) {
        return NextResponse.redirect(
            `${origin}/login?error=oauth_failed&message=${encodeURIComponent("Không nhận được mã xác thực từ Google")}`
        );
    }

    try {
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error || !data.user) {
            console.error("[auth/callback] Exchange failed");
            return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
        }

        const user = data.user;

        // The authenticated client can read its own profile through RLS.
        const { data: existingProfile, error: profileReadError } = await supabase
            .from("profiles")
            .select("id, role, status")
            .eq("id", user.id)
            .maybeSingle();

        if (profileReadError) {
            console.error("[auth/callback] Profile read failed");
            return NextResponse.redirect(`${origin}/login?error=profile_unavailable`);
        }

        const profile = existingProfile as { id: string; role: string; status: string } | null;

        if (profile && profile.status !== "active") {
            return NextResponse.redirect(`${origin}/login?error=account_inactive`);
        }

        // Profile exists with a real (non-pending) role → go directly to dashboard
        const existingRole = authenticatedProfileRole(profile?.role);
        if (existingRole) {
            const destination = dashboardForRole(existingRole);
            return allowOAuthArrival(NextResponse.redirect(`${origin}${destination}`), destination);
        }

        // Profile doesn't exist or has pending role → create/keep partial profile and redirect to role selection
        const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Người dùng";
        const avatarUrl =
            user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

        if (!profile) {
            // The auth trigger normally creates this row. This insert is a safe fallback;
            // profiles.id remains exactly auth.users.id and the PK prevents duplicates.
            const { error: insertError } = await (supabase as any).from("profiles").insert({
                id: user.id,
                email: user.email || "",
                full_name: fullName,
                avatar_url: avatarUrl,
                role: "pending",
                status: "active",
            });

            if (insertError) {
                // The auth trigger or another callback may have inserted the same PK.
                // Never upsert a pending role over an existing permanent role.
                const { data: concurrent, error: retryError } = await supabase
                    .from("profiles").select("id, role, status").eq("id", user.id).maybeSingle();
                const resolved = concurrent as { id: string; role: string; status: string } | null;
                if (retryError || !resolved) {
                    return NextResponse.redirect(`${origin}/login?error=profile_creation_failed`);
                }
                if (resolved.status !== "active") {
                    return NextResponse.redirect(`${origin}/login?error=account_inactive`);
                }
                const resolvedRole = authenticatedProfileRole(resolved.role);
                if (resolvedRole) {
                    const destination = dashboardForRole(resolvedRole);
                    return allowOAuthArrival(NextResponse.redirect(`${origin}${destination}`), destination);
                }
            }
        }

        // Redirect to role selection onboarding
        return allowOAuthArrival(NextResponse.redirect(`${origin}/auth/select-role`), "/auth/select-role");
    } catch {
        console.error("[auth/callback] Unexpected failure");
        return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
    }
}
