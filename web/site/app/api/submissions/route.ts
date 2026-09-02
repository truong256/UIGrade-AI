import Submission from "@/models/Submission.model";
import { submissionController } from "@/controllers/submission.controller";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getCurrentUserFromRequest } from "@/lib/current-user";
import { connectDB } from "@/lib/mongodb";

export async function GET(request: Request) {
    try {
        await connectDB();

        const currentUser = getCurrentUserFromRequest(request);

        if (!currentUser?.userId) {
            return errorResponse("Bạn chưa đăng nhập", 401);
        }

        const { searchParams } = new URL(request.url);
        const assignmentId = searchParams.get("assignmentId");
        const studentIdParam = searchParams.get("studentId");
        const classroomId = searchParams.get("classroomId");

        const filter: Record<string, unknown> = {};

        if (assignmentId) {
            filter.assignmentId = assignmentId;
        }

        if (classroomId) {
            filter.classroomId = classroomId;
        }

        if (currentUser.role === "student") {
            filter.studentId = currentUser.userId;
        } else if (studentIdParam) {
            filter.studentId = studentIdParam;
        }

        const data = await Submission.find(filter)
            .populate("assignmentId", "title maxScore dueAt startAt status")
            .populate("classroomId", "name code semester academicYear")
            .populate("studentId", "name email studentCode")
            .sort({ submittedAt: -1 });

        return successResponse(data, "Lấy danh sách bài nộp thành công");
    } catch (error) {
        return errorResponse(
            error instanceof Error ? error.message : "Không thể lấy danh sách bài nộp",
            400
        );
    }
}

export async function POST(request: Request) {
    await connectDB();
    return submissionController.create(request);
}