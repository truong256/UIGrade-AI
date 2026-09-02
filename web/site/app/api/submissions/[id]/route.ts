import { successResponse, errorResponse } from "@/lib/api-response";
import { getActorIdFromRequest } from "@/lib/current-user";
import { gradingService } from "@/services/grading.service";
import { connectDB } from "@/lib/mongodb";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        return error.message;
    }

    return "Lỗi không xác định";
}

async function resolveId(context: RouteContext): Promise<string> {
    const { id } = await context.params;
    return id;
}

export async function GET(request: Request, context: RouteContext) {
    try {
        await connectDB();

        getActorIdFromRequest(request);

        const id = await resolveId(context);
        const data = await gradingService.getSubmissionDetail(id);

        return successResponse(data, "Lấy chi tiết bài nộp thành công");
    } catch (error) {
        const message = getErrorMessage(error);
        const status = message.includes("đăng nhập") ? 401 : 400;

        return errorResponse(message, status);
    }
}