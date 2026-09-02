import { successResponse, errorResponse } from "@/lib/api-response";
import { getActorIdFromRequest } from "@/lib/current-user";
import { gradingService } from "@/services/grading.service";
import { connectDB } from "@/lib/mongodb";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

type OverrideSubmissionBody = {
    score?: unknown;
    comment?: unknown;
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

export async function POST(request: Request, context: RouteContext) {
    try {
        await connectDB();

        const actorId = getActorIdFromRequest(request);
        const id = await resolveId(context);

        const body: OverrideSubmissionBody = await request.json().catch(() => ({}));

        const score = Number(body.score);
        const comment = String(body.comment ?? "").trim();

        if (!Number.isFinite(score)) {
            return errorResponse("Điểm override không hợp lệ", 400);
        }

        if (!comment) {
            return errorResponse("Vui lòng nhập ghi chú override", 400);
        }

        const data = await gradingService.overrideSubmissionScore({
            submissionId: id,
            actorId,
            score,
            comment,
        });

        return successResponse(data, "Override điểm thành công");
    } catch (error) {
        const message = getErrorMessage(error);
        const status = message.includes("đăng nhập") ? 401 : 400;

        return errorResponse(message, status);
    }
}