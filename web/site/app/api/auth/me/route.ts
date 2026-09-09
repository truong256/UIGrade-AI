import { NextResponse } from "next/server";
import { SupabaseAuthService } from "@/services/supabase/auth.supabase";

export async function GET() {
    try {
        // Resolve the same verified Supabase identity used by the navigation guard.
        const supabaseUser = await SupabaseAuthService.getCurrentUser();
        if (supabaseUser) {
            return NextResponse.json(
                {
                    user: {
                        _id: supabaseUser.id,
                        id: supabaseUser.id,
                        name: supabaseUser.full_name,
                        email: supabaseUser.email,
                        role: supabaseUser.role,
                        studentCode: supabaseUser.student_code,
                        department: supabaseUser.department,
                        avatar: supabaseUser.avatar_url,
                        avatarUrl: supabaseUser.avatar_url,
                        phone: supabaseUser.phone,
                    },
                },
                { status: 200, headers: { "Cache-Control": "no-store" } }
            );
        }

        return NextResponse.json(
            { message: "Chưa đăng nhập hoặc tài khoản không hoạt động" },
            { status: 401, headers: { "Cache-Control": "no-store" } }
        );
    } catch (_error) {
        return NextResponse.json(
            { message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn" },
            { status: 401 }
        );
    }
}
