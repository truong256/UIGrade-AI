import { ZodError } from "zod";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getCurrentUserFromCookie } from "@/lib/current-user";
import { saveFileToLocal, saveFilesToLocal } from "@/lib/upload-local";
import { submissionService}  from "@/services/submission.service";
import { extractSubmissionPayload } from "@/validations/submission.validation";

function extractFiles(formData: FormData, fieldName: string) {
    return formData
        .getAll(fieldName)
        .filter((item): item is File => item instanceof File && item.size > 0);
}

function resolveError(error: unknown) {
    if (error instanceof ZodError) {
        return {
            status: 400,
            message: error.issues[0]?.message || "Dữ liệu không hợp lệ",
        };
    }

    const message = error instanceof Error ? error.message : "Không thể xử lý yêu cầu";

    if (message.includes("chưa đăng nhập")) return { status: 401, message };
    if (message.includes("không có quyền")) return { status: 403, message };
    if (message.includes("Không tìm thấy")) return { status: 404, message };

    return { status: 400, message };
}

export const submissionController = {
    async create(request: Request) {
        try {
            const currentUser = await getCurrentUserFromCookie();

            if (!currentUser) {
                return errorResponse("Bạn chưa đăng nhập", 401);
            }

            const formData = await request.formData();
            const payload = extractSubmissionPayload(formData);

            const explicitSourceArchive = formData.get("sourceArchive");
            const sourceArchiveFile =
                explicitSourceArchive instanceof File && explicitSourceArchive.size > 0
                    ? explicitSourceArchive
                    : null;

            const legacySubmissionFiles = extractFiles(formData, "submissionFiles");
            const screenshotsInput = extractFiles(formData, "screenshots");

            const fallbackSourceArchive =
                !sourceArchiveFile && legacySubmissionFiles.length ? legacySubmissionFiles[0] : null;

            const screenshots = screenshotsInput.length
                ? screenshotsInput
                : legacySubmissionFiles.slice(sourceArchiveFile ? 0 : 1);

            const [savedSourceArchive, savedScreenshots] = await Promise.all([
                saveFileToLocal(sourceArchiveFile || fallbackSourceArchive, "submissions/source"),
                saveFilesToLocal(screenshots, "submissions/screenshots"),
            ]);

            const created = await submissionService.createSubmission(
                payload,
                {
                    sourceArchive: savedSourceArchive,
                    screenshots: savedScreenshots,
                    files: [
                        ...(savedSourceArchive ? [savedSourceArchive] : []),
                        ...savedScreenshots,
                    ],
                },
                currentUser
            );

            return successResponse(created, "Nộp bài thành công", 201);
        } catch (error) {
            const resolved = resolveError(error);
            return errorResponse(resolved.message, resolved.status);
        }
    },
};