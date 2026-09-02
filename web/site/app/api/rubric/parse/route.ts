import { errorResponse, successResponse } from "@/lib/api-response";
import { getCurrentUserFromCookie } from "@/lib/current-user";
import { parseRubricTextWithAI } from "@/services/rubric-parser.service";

export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUserFromCookie();

        if (!currentUser) {
            return errorResponse("Bạn chưa đăng nhập", 401);
        }

        if (currentUser.role !== "lecturer" && currentUser.role !== "admin") {
            return errorResponse("Bạn không có quyền phân tích rubric", 403);
        }

        const body = await request.json();

        const rubricText = String(body?.rubricText || "").trim();
        const maxScore = Number(body?.maxScore || 10);
        const assignmentTitle = String(body?.assignmentTitle || "Bài tập");
        const language = String(body?.language || "vi");

        if (!rubricText) {
            return errorResponse("Rubric text không được để trống", 400);
        }

        const parsed = await parseRubricTextWithAI({
            rubricText,
            maxScore: Number.isFinite(maxScore) && maxScore > 0 ? maxScore : 10,
            assignmentTitle,
            language,
        });

        return successResponse(parsed, "Phân tích rubric thành công");
    } catch (error) {
        return errorResponse(
            error instanceof Error ? error.message : "Không thể phân tích rubric",
            400
        );
    }
}