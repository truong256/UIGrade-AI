import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const ALLOWED_SELF_ASSIGN_ROLES = ["student", "lecturer"] as const;
type AllowedRole = (typeof ALLOWED_SELF_ASSIGN_ROLES)[number];

/**
 * POST /api/auth/set-role
 *
 * Allows a newly-registered Google OAuth user to set their role.
 * SECURITY:
 *  - Only "student" or "lecturer" are accepted. "admin" is explicitly rejected.
 *  - The current user is resolved from the Supabase session (cookie-based),
 *    not from any client-provided user ID.
 *  - Role can only be set once (if profile already has a valid role, rejects).
 *    Exception: "pending" role (set during OAuth callback) can be updated.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const requestedRole: unknown = body?.role;

        // Validate role input strictly — admin cannot be self-assigned
        if (
            typeof requestedRole !== "string" ||
            !ALLOWED_SELF_ASSIGN_ROLES.includes(requestedRole as AllowedRole)
        ) {
            return NextResponse.json(
                { message: "Vai trò không hợp lệ. Chỉ chấp nhận 'student' hoặc 'lecturer'." },
                { status: 400 }
            );
        }

        const role = requestedRole as AllowedRole;

        // Get current Supabase user from session cookie (not from client body)
        const supabase = await createSupabaseServerClient();
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json(
                { message: "Bạn chưa đăng nhập hoặc phiên đã hết hạn." },
                { status: 401 }
            );
        }

        const adminClient = createSupabaseAdminClient() as any;

        // Check existing profile to prevent re-assignment of already-set roles
        const { data: existing } = await adminClient
            .from("profiles")
            .select("id, role")
            .eq("id", user.id)
            .maybeSingle();

        const existingRole: string | null = (existing as { id: string; role: string } | null)?.role ?? null;

        // Reject if profile already has a permanent role (student/lecturer/admin)
        if (
            existingRole &&
            existingRole !== "pending" &&
            ["student", "lecturer", "admin"].includes(existingRole)
        ) {
            return NextResponse.json(
                { message: "Vai trò đã được thiết lập. Không thể thay đổi qua trang này." },
                { status: 409 }
            );
        }

        // Build profile from OAuth user metadata
        const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Người dùng";
        const avatarUrl =
            user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

        // Upsert profile (insert or update)
        const { error: upsertError } = await adminClient.from("profiles").upsert({
            id: user.id,
            email: user.email || "",
            full_name: fullName,
            avatar_url: avatarUrl,
            role,
            status: "active",
        });

        if (upsertError) {
            console.error("[set-role] Profile upsert error:", upsertError.message);
            return NextResponse.json(
                { message: "Không thể lưu thông tin. Vui lòng thử lại." },
                { status: 500 }
            );
        }

        // Update app_metadata so middleware Supabase JWT includes the role
        await adminClient.auth.admin.updateUserById(user.id, {
            app_metadata: { role },
        });

        return NextResponse.json(
            { message: "Vai trò đã được cập nhật.", role },
            { status: 200 }
        );
    } catch (err) {
        console.error("[set-role] Unexpected error:", err);
        return NextResponse.json(
            { message: "Lỗi server. Vui lòng thử lại sau." },
            { status: 500 }
        );
    }
}
