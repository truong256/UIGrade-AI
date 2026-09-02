import { connectDB } from "@/lib/mongodb";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getCurrentUserFromCookie } from "@/lib/current-user";
import { learningReportService } from "@/services/learning-report.service";
import { reportAiService } from "@/services/report-ai.service";

export const runtime = "nodejs";

export async function GET(request: Request) {
    try {
        await connectDB();

        const currentUser = await getCurrentUserFromCookie();
        const { searchParams } = new URL(request.url);

        const classroomId = searchParams.get("classroomId") || undefined;
        const assignmentId = searchParams.get("assignmentId") || undefined;

        const reportData = await learningReportService.getOverview(currentUser, {
            classroomId,
            assignmentId,
        });

        const aiInsight = await reportAiService.generateLearningReportInsight(reportData);

        return successResponse(aiInsight, "Lấy nhận định AI thành công");
    } catch (error) {
        const message = error instanceof Error ? error.message : "Không thể phân tích báo cáo bằng AI";

        if (message.includes("chưa đăng nhập")) {
            return errorResponse(message, 401);
        }

        if (message.includes("chỉ dành cho giáo viên") || message.includes("không có quyền")) {
            return errorResponse(message, 403);
        }

        return errorResponse(message, 500);
    }
}
