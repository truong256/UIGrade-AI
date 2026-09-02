import { NextRequest, NextResponse } from "next/server";
import Assignment from "@/models/Assignment.model";
import { connectDB } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    await connectDB();

    const { id } = await context.params;
    const body = await request.json();

    const runnerConfig = body?.runnerConfig || {};

    const updated = await Assignment.findByIdAndUpdate(
        id,
        {
            $set: {
                runnerConfig,
            },
        },
        {
            new: true,
            runValidators: true,
        }
    ).lean();

    if (!updated) {
        return NextResponse.json(
            {
                success: false,
                message: "Không tìm thấy bài tập.",
            },
            { status: 404 }
        );
    }

    return NextResponse.json({
        success: true,
        message: "Đã lưu cấu hình kiểm thử UI.",
        data: updated.runnerConfig || {},
    });
}