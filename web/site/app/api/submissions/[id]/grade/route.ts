import { successResponse, errorResponse } from "@/lib/api-response";
import { getActorIdFromRequest } from "@/lib/current-user";
import { gradingService } from "@/services/grading.service";
import { connectDB } from "@/lib/mongodb";

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

type GradeSubmissionBody = {
    regenerateAi?: boolean;
    regenerateRunner?: boolean;
    runnerReport?: unknown;
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

        const body: GradeSubmissionBody = await request.json().catch(() => ({}));

        const data = await gradingService.gradeSubmission({
            submissionId: id,
            actorId,
            regenerateAi: Boolean(body.regenerateAi),
            regenerateRunner: Boolean(body.regenerateRunner),
            runnerReport: (body.runnerReport as any) ?? null,
        });

        return successResponse(data, "Chấm tự động thành công");
    } catch (error) {
        const message = getErrorMessage(error);
        const status = message.includes("đăng nhập") ? 401 : 400;

        return errorResponse(message, status);
    }
}
