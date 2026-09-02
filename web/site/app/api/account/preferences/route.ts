import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCurrentUserFromRequest } from "@/lib/current-user";
import User from "@/models/User.model";

export async function PATCH(request: Request) {
    try {
        const currentUser = await getCurrentUserFromRequest(request);

        if (!currentUser?.userId) {
            return NextResponse.json({ message: "Bạn chưa đăng nhập" }, { status: 401 });
        }

        const body = await request.json();
        const emailAssignments = Boolean(body.emailAssignments);
        const pushReminders = Boolean(body.pushReminders);

        await connectDB();

        const user = await User.findById(currentUser.userId);
        if (!user) {
            return NextResponse.json({ message: "Không tìm thấy người dùng" }, { status: 404 });
        }

        user.notificationSettings = {
            emailAssignments,
            pushReminders,
        };

        await user.save();

        return NextResponse.json(
            {
                message: "Cập nhật cài đặt thông báo thành công",
                notificationSettings: user.notificationSettings,
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Không thể cập nhật thông báo" },
            { status: 500 }
        );
    }
}
