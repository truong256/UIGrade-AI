import { NextRequest, NextResponse } from "next/server";
import { dashboardForRole } from "@/lib/auth-routing";
import { mapSupabaseErrorToVietnamese } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const SELF_REGISTER_ROLES = ["student", "lecturer"] as const;
type SelfRegisterRole = (typeof SELF_REGISTER_ROLES)[number];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const fullName = String(body?.name || "").trim();
        const email = String(body?.email || "").trim().toLowerCase();
        const password = String(body?.password || "");
        const studentCode = String(body?.studentCode || "").trim().toUpperCase();
        const role = body?.role as SelfRegisterRole;

        if (!fullName || !email || !password) {
            return NextResponse.json(
                { message: "Vui lòng nhập đầy đủ thông tin bắt buộc." },
                { status: 400 }
            );
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json({ message: "Email không hợp lệ." }, { status: 400 });
        }
        if (password.length < 6) {
            return NextResponse.json(
                { message: "Mật khẩu phải có ít nhất 6 ký tự." },
                { status: 400 }
            );
        }
        if (!SELF_REGISTER_ROLES.includes(role)) {
            return NextResponse.json(
                { message: "Chỉ có thể đăng ký với vai trò student hoặc lecturer." },
                { status: 400 }
            );
        }

        const supabase = await createSupabaseServerClient();
        const emailRedirectTo = new URL("/auth/callback", request.nextUrl.origin).toString();
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo,
                data: {
                    full_name: fullName,
                    role,
                    student_code: role === "student" ? studentCode || null : null,
                },
            },
        });

        if (error || !data.user) {
            return NextResponse.json(
                { message: mapSupabaseErrorToVietnamese(error) },
                { status: 400 }
            );
        }

        const requiresEmailConfirmation = !data.session;
        return NextResponse.json(
            {
                message: requiresEmailConfirmation
                    ? "Tài khoản đã được tạo. Vui lòng kiểm tra email để xác nhận."
                    : "Đăng ký thành công.",
                requiresEmailConfirmation,
                redirectTo: requiresEmailConfirmation ? null : dashboardForRole(role),
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("[auth/register] Unexpected error:", error);
        return NextResponse.json(
            { message: "Không thể tạo tài khoản. Vui lòng thử lại." },
            { status: 500 }
        );
    }
}
