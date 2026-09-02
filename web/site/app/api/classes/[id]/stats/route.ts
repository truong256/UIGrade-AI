import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { verifyToken } from "@/lib/auth";

import Classroom from "@/models/Classroom.model";
import { ClassroomMemberModel } from "@/models/Classroom-member.model";
import "@/models/User.model";

const AUTH_COOKIE_NAME = "token";

function toId(value: unknown): string {
    if (!value) return "";
    return String((value as { _id?: unknown })?._id ?? value);
}

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

        if (!token) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        let payload: {
            userId: string;
            email: string;
            role: string;
            studentCode?: string;
        };

        try {
            payload = verifyToken(token);
        } catch {
            return NextResponse.json(
                { message: "Token không hợp lệ hoặc đã hết hạn" },
                { status: 401 }
            );
        }

        await connectDB();

        const { id } = await params;
        const userId = payload.userId;

        const classroom = await Classroom.findById(id)
            .select("_id teacherId")
            .lean();

        if (!classroom) {
            return NextResponse.json(
                { message: "Không tìm thấy lớp học" },
                { status: 404 }
            );
        }

        const isTeacher = toId(classroom.teacherId) === userId;

        const myMember = await ClassroomMemberModel.findOne({
            classroomId: id,
            userId,
            status: { $in: ["active", "pending"] },
        })
            .select("_id roleInClass status")
            .lean();

        const canViewStats = isTeacher || Boolean(myMember);

        if (!canViewStats) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const activeStudentCount = await ClassroomMemberModel.countDocuments({
            classroomId: id,
            roleInClass: "student",
            status: "active",
        });

        return NextResponse.json({
            activeStudentCount,
            canManageMembers: isTeacher,
        });
    } catch (error) {
        console.error("GET /api/classes/[id]/stats error:", error);
        return NextResponse.json({ message: "Lỗi server" }, { status: 500 });
    }
}