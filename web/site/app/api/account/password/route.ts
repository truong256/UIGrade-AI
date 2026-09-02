import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUserFromRequest } from "@/lib/current-user";
import User from "@/models/User.model";

export async function PATCH(request: Request) {
    try {
        const currentUser = getCurrentUserFromRequest(request);

        if (!currentUser?.userId) {
            return NextResponse.json({ message: "Bạn chưa đăng nhập" }, { status: 401 });
        }

        const body = await request.json();
        const currentPassword = String(body.currentPassword || "");
        const newPassword = String(body.newPassword || "");
        const confirmPassword = String(body.confirmPassword || "");

        if (!currentPassword || !newPassword || !confirmPassword) {
            return NextResponse.json({ message: "Vui lòng nhập đầy đủ thông tin" }, { status: 400 });
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { message: "Mật khẩu mới phải có ít nhất 6 ký tự" },
                { status: 400 }
            );
        }

        if (newPassword !== confirmPassword) {
            return NextResponse.json(
                { message: "Mật khẩu xác nhận không khớp" },
                { status: 400 }
            );
        }

        if (currentPassword === newPassword) {
            return NextResponse.json(
                { message: "Mật khẩu mới phải khác mật khẩu hiện tại" },
                { status: 400 }
            );
        }

        await connectDB();

        const user = await User.findById(currentUser.userId);
        if (!user) {
            return NextResponse.json({ message: "Không tìm thấy người dùng" }, { status: 404 });
        }

        const matched = await bcrypt.compare(currentPassword, user.password);
        if (!matched) {
            return NextResponse.json(
                { message: "Mật khẩu hiện tại không đúng" },
                { status: 400 }
            );
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        return NextResponse.json({ message: "Đổi mật khẩu thành công" }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Không thể đổi mật khẩu" },
            { status: 500 }
        );
    }
}
