
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User.model";
import { authCookieOptions, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json(
                { message: "Vui lòng nhập email và mật khẩu" },
                { status: 400 }
            );
        }

        const normalizedEmail = email.trim().toLowerCase();

        await connectDB();

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return NextResponse.json(
                { message: "Email hoặc mật khẩu không đúng" },
                { status: 401 }
            );
        }

        // chặn user khi bị khóa
        if (user.isActive === false) {
            return NextResponse.json(
                {message : "tài khoản bị tạm khóa"},
                {status : 403}
            )
        }

        const isPasswordMatched = await bcrypt.compare(password, user.password);

        if (!isPasswordMatched) {
            return NextResponse.json(
                { message: "Email hoặc mật khẩu không đúng" },
                { status: 401 }
            );
        }

        user.lastLoginAt = new Date();
        await user.save();

        const token = signToken({
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
        });

        const response = NextResponse.json(
            {
                message: "Đăng nhập thành công",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
            { status: 200 }
        );

        response.cookies.set("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (error) {
        console.error("LOGIN_ERROR:", error);
        return NextResponse.json(
            { message: "Lỗi server khi đăng nhập" },
            { status: 500 }
        );
    }
}