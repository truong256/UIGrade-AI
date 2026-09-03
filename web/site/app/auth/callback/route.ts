import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    // Handle OAuth provider error (e.g., user cancelled)
    if (errorParam) {
        const errorDesc = searchParams.get("error_description") || "OAuth bị huỷ";
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
            console.error("[auth/callback] Exchange error:", error?.message);
            return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
        }

        const user = data.user;

        const adminClient = createSupabaseAdminClient() as any;

        // Check if profile already exists with a valid role
        const { data: existingProfile } = await adminClient
            .from("profiles")
            .select("id, role, status")
            .eq("id", user.id)
            .maybeSingle();

        const profile = existingProfile as { id: string; role: string; status: string } | null;

        // Profile exists with a real (non-pending) role → go directly to dashboard
        if (profile && profile.role && profile.role !== "pending" &&
            ["student", "lecturer", "admin"].includes(profile.role)) {
            // Sync role to app_metadata for middleware
            await adminClient.auth.admin.updateUserById(user.id, {
                app_metadata: { role: profile.role },
            });

            const dest = profile.role === "admin" ? "/ui/server_config" : "/ui/dashboard";
            return NextResponse.redirect(`${origin}${dest}`);
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
            // Create placeholder profile — role will be set in /auth/select-role
            await adminClient.from("profiles").upsert({
                id: user.id,
                email: user.email || "",
                full_name: fullName,
                avatar_url: avatarUrl,
                role: "pending",
                status: "active",
            });
        }

        // Redirect to role selection onboarding
        return NextResponse.redirect(`${origin}/auth/select-role`);
    } catch (err) {
        console.error("[auth/callback] Unexpected error:", err);
        return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
    }
}
