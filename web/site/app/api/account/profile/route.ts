import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUserFromRequest } from "@/lib/current-user";
import User from "@/models/User.model";

function normalizeText(value: unknown) {
    return String(value || "").trim();
}

export async function GET(request: Request) {
    try {
        const currentUser = await getCurrentUserFromRequest(request);

        if (!currentUser?.userId) {
            return NextResponse.json({ message: "Bạn chưa đăng nhập" }, { status: 401 });
        }

        await connectDB();

        const user = await User.findById(currentUser.userId).select("-password");

        if (!user) {
            return NextResponse.json({ message: "Không tìm thấy người dùng" }, { status: 404 });
        }

        return NextResponse.json({ user }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Không thể tải hồ sơ" },
            { status: 500 }
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const currentUser = await getCurrentUserFromRequest(request);

        if (!currentUser?.userId) {
            return NextResponse.json({ message: "Bạn chưa đăng nhập" }, { status: 401 });
        }

        const body = await request.json();

        const name = normalizeText(body.name);
        const email = normalizeText(body.email).toLowerCase();
        const studentCode = normalizeText(body.studentCode).toUpperCase();
        const phone = normalizeText(body.phone);
        const department = normalizeText(body.department);
        const cohort = normalizeText(body.cohort);
        const bio = normalizeText(body.bio);
        const avatar = normalizeText(body.avatar);

        if (!name || !email) {
            return NextResponse.json(
                { message: "Tên và email là bắt buộc" },
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

        await connectDB();

        const existingUser = await User.findById(currentUser.userId);
        if (!existingUser) {
            return NextResponse.json(
                { message: "Không tìm thấy người dùng" },
                { status: 404 }
            );
        }

        const duplicatedEmail = await User.findOne({
            email,
            _id: { $ne: currentUser.userId },
        });

        if (duplicatedEmail) {
            return NextResponse.json(
                { message: "Email đã được sử dụng" },
                { status: 409 }
            );
        }

        if (studentCode) {
            const duplicatedStudentCode = await User.findOne({
                studentCode,
                _id: { $ne: currentUser.userId },
            });

            if (duplicatedStudentCode) {
                return NextResponse.json(
                    { message: "Mã người dùng đã tồn tại" },
                    { status: 409 }
                );
            }
        }

        existingUser.name = name;
        existingUser.email = email;
        existingUser.studentCode = studentCode || existingUser.studentCode || undefined;
        existingUser.phone = phone;
        existingUser.department = department;
        existingUser.cohort = cohort;
        existingUser.bio = bio;
        existingUser.avatar = avatar;

        await existingUser.save();

        const user = await User.findById(currentUser.userId).select("-password");

        return NextResponse.json(
            {
                message: "Cập nhật hồ sơ thành công",
                user,
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Không thể cập nhật hồ sơ" },
            { status: 500 }
        );
    }
}