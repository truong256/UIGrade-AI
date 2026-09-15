import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dashboardForRole, authenticatedProfileRole } from "@/lib/auth-routing";
import { allowOAuthArrival } from "@/lib/auth-visit";
import { getCanonicalOrigin } from "@/lib/app-url";
import { isEducationEmail } from "@/lib/education-email";

export async function GET(request: Request) {
    const searchParams = new URL(request.url).searchParams;
    const origin = getCanonicalOrigin(request);
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");
    const isPasswordRecovery = searchParams.get("type") === "recovery";

    // Handle OAuth provider error (e.g., user cancelled)
    if (errorParam) {
        const errorDesc = isPasswordRecovery
            ? "Liên kết khôi phục không hợp lệ hoặc đã hết hạn"
            : errorParam === "access_denied" ? "Đăng nhập Google đã bị hủy" : "Hãy đăng nhập tài khoản Gmail .edu.vn";
        return NextResponse.redirect(
            `${origin}/login?error=${isPasswordRecovery ? "recovery_failed" : "oauth_failed"}&message=${encodeURIComponent(errorDesc)}`
        );
    }

    if (!code) {
        const errorDesc = isPasswordRecovery
            ? "Liên kết khôi phục không hợp lệ hoặc đã hết hạn"
            : "Không nhận được mã xác thực từ Google";
        return NextResponse.redirect(
            `${origin}/login?error=${isPasswordRecovery ? "recovery_failed" : "oauth_failed"}&message=${encodeURIComponent(errorDesc)}`
        );
    }

    try {
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);

        if (error || !data.user) {
            // Log only the error code/status — never the token, code, or session.
            // Common codes:
            //   "otp_expired"      — code already exchanged (browser refresh)
            //   "provider_error"   — Supabase/DB error during OAuth
            //   "check_violation"  — DB trigger rejected signup (e.g. non-.edu.vn email)
            const errCode = error?.code ?? error?.status ?? "no_user";
            const errMsg = typeof error?.message === "string" ? error.message : "";
            console.error(`[auth/callback] Exchange failed: ${errCode}`);

            // If the DB trigger raised a check_violation for the .edu.vn email rule,
            // surface a clear, user-friendly message rather than the generic oauth_failed.
            const isEduViolation =
                errCode === "check_violation" ||
                errMsg.toLowerCase().includes("edu.vn") ||
                errMsg.toLowerCase().includes("education");
            if (isEduViolation) {
                return NextResponse.redirect(
                    `${origin}/login?error=education_email_required&message=${encodeURIComponent(
                        "Vui lòng sử dụng tài khoản email giáo dục (.edu.vn) để đăng nhập."
                    )}`
                );
            }

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

        // Password recovery requires the exchanged session only long enough to
        // set a new password. Do not route this flow into onboarding/dashboard.
        if (isPasswordRecovery) {
            return allowOAuthArrival(
                NextResponse.redirect(`${origin}/reset-password`),
                "/reset-password"
            );
        }

        // Profile exists with a real (non-pending) role → go directly to dashboard
        const existingRole = authenticatedProfileRole(profile?.role);
        if (existingRole) {
            const destination = dashboardForRole(existingRole);
            return allowOAuthArrival(NextResponse.redirect(`${origin}${destination}`), destination);
        }

        // The .edu.vn rule applies only while creating/onboarding a new account.
        // A permanent existing profile (including a legacy Admin) was accepted above.
        if (!isEducationEmail(user.email)) {
            try {
                await supabase.auth.signOut({ scope: "local" });
            } catch {
                // The redirect still closes this signup flow. Do not expose provider details.
            }
            return NextResponse.redirect(`${origin}/login?error=education_email_required`);
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
