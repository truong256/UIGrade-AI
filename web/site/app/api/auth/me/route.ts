import { NextRequest, NextResponse } from "next/server";
import { SupabaseAuthService } from "@/services/supabase/auth.supabase";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User.model";

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
                        role: supabaseUser.role,
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

        try {
            await connectDB();
            const user = await User.findById(decoded.userId).select("-password");
            if (user) {
                return NextResponse.json(
                    { user },
                    { status: 200 }
                );
            }
        } catch {
            // DB connection or find error
        }

        return NextResponse.json(
            {
                user: {
                    _id: decoded.userId,
                    id: decoded.userId,
                    email: decoded.email,
                    role: decoded.role,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("ME_ERROR:", error);
        return NextResponse.json(
            { message: "Phiên đăng nhập không hợp lệ hoặc đã hết hạn" },
            { status: 401 }
        );
    }
}