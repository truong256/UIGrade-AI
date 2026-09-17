// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { dashboardForRole } from "@/lib/auth-routing";

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

        // Check existing profile to prevent re-assignment of already-set roles
        const { data: existing, error: readError } = await supabase
            .from("profiles")
            .select("id, role, status")
            .eq("id", user.id)
            .maybeSingle();

        if (readError) {
            console.error("[set-role] Profile read failed");
            return NextResponse.json(
                { message: "Không thể đọc hồ sơ. Vui lòng thử lại." },
                { status: 500 }
            );
        }

        const profile = existing as { id: string; role: string; status: string } | null;
        if (profile && profile.status !== "active") {
            return NextResponse.json({ message: "Tài khoản hiện không hoạt động." }, { status: 403 });
        }

        // Reject if profile already has a permanent role (student/lecturer/admin)
        if (
            profile && profile.role !== "pending"
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

        const profileValues = {
            email: user.email || "",
            full_name: fullName,
            avatar_url: avatarUrl,
            role,
            status: "active" as const,
        };

        // Do not use service_role here. RLS + the migration's trigger allow only the
        // one-time pending -> student/lecturer onboarding transition for this user.
        // The hand-maintained Database type predates generated Relationships metadata,
        // so mutations use the same narrow compatibility cast as existing services.
        const profiles = (supabase as any).from("profiles");
        const mutation = existing
            ? profiles.update({ role }).eq("id", user.id).eq("role", "pending").eq("status", "active")
            : profiles.insert({ id: user.id, ...profileValues });
        const { data: saved, error: saveError } = await mutation.select("id, role, status").single();

        if (saveError || !saved || saved.id !== user.id || saved.status !== "active" ||
            !ALLOWED_SELF_ASSIGN_ROLES.includes(saved.role)) {
            return NextResponse.json(
                { message: "Không thể lưu thông tin. Vui lòng thử lại." },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                message: "Vai trò đã được cập nhật.",
                role: saved.role,
                redirectTo: dashboardForRole(saved.role),
            },
            { status: 200 }
        );
    } catch {
        console.error("[set-role] Unexpected failure");
        return NextResponse.json(
            { message: "Lỗi server. Vui lòng thử lại sau." },
            { status: 500 }
        );
    }
}
