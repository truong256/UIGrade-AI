import { NextRequest, NextResponse } from "next/server";
import { SupabaseAuthService } from "@/services/supabase/auth.supabase";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User.model";
import { normalizeRole } from "@/lib/authorization";

export async function GET(req: NextRequest) {
    try {
        // 1. Try Supabase Auth
        const supabaseUser = await SupabaseAuthService.getCurrentUser();
        if (supabaseUser) {
            return NextResponse.json(
                {
                    user: {
                        _id: supabaseUser.id,
                        id: supabaseUser.id,
                        name: supabaseUser.full_name,
                        email: supabaseUser.email,
                        role: normalizeRole(supabaseUser.role),
                        studentCode: supabaseUser.student_code,
                        department: supabaseUser.department,
                        avatar: supabaseUser.avatar_url,
                        phone: supabaseUser.phone,
                    },
                },
                { status: 200 }
            );
        }

        // 2. Try JWT Cookie Token
        const token = req.cookies.get("token")?.value;

        if (!token) {
            return NextResponse.json(
                { message: "Chưa đăng nhập" },
                { status: 401 }
            );
        }

        const decoded = verifyToken(token);

        if (!decoded?.userId) {
            return NextResponse.json(
                { message: "Token không hợp lệ" },
                { status: 401 }
            );
        }

        await connectDB();
        const user = await User.findById(decoded.userId).select("-password").lean();

        if (!user) {
            // User was deleted -> 401
            return NextResponse.json(
                { message: "Tài khoản không tồn tại hoặc đã bị xóa" },
                { status: 401 }
            );
        }

        if (user.isActive === false) {
            // User account was deactivated/locked -> 401
            return NextResponse.json(
                { message: "Tài khoản đã bị tạm khóa" },
                { status: 401 }
            );
        }

        return NextResponse.json(
            {
                user: {
                    ...user,
                    role: normalizeRole(user.role),
                },
            },
            { status: 200 }
        );
    } catch (_error) {
        return NextResponse.json(
            { message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn" },
            { status: 401 }
        );
    }
}