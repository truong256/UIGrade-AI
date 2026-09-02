import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User.model";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        const name = String(body.name || "").trim();
        const email = String(body.email || "").trim().toLowerCase();
        const password = String(body.password || "");
        const studentCode = String(body.studentCode || "").trim().toUpperCase();

        if (!name || !email || !password || !studentCode) {
            return NextResponse.json(
                { message: "Vui lòng nhập đầy đủ thông tin" },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { message: "Email không hợp lệ" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { message: "Mật khẩu phải có ít nhất 6 ký tự" },
                { status: 400 }
            );
        }

        await connectDB();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json(
                { message: "Email đã tồn tại" },
                { status: 409 }
            );
        }

        const existingStudentCode = await User.findOne({ studentCode });
        if (existingStudentCode) {
            return NextResponse.json(
                { message: "Mã sinh viên đã tồn tại" },
                { status: 409 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            studentCode,
            role: "User",
        });

        const token = signToken({
            userId: newUser._id.toString(),
            email: newUser.email,
            role: newUser.role,
            studentCode: newUser.studentCode,
        });

        const response = NextResponse.json(
            {
                message: "Đăng ký thành công",
                user: {
                    id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    role: newUser.role,
                    studentCode: newUser.studentCode,
                },
            },
            { status: 201 }
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
        console.error("REGISTER_ERROR:", error);
        return NextResponse.json(
            {
                message:
                    error instanceof Error
                        ? error.message
                        : "Lỗi server khi đăng ký",
            },
            { status: 500 }
        );
    }
}