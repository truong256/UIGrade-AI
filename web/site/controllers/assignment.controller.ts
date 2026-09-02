import { ZodError } from "zod";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getCurrentUserFromCookie } from "@/lib/current-user";
import { deleteLocalFilesByUrls, saveFilesToLocal } from "@/lib/upload-local";
import { assignmentService } from "@/services/assignment.service";
import {
    extractAssignmentPayload,
    extractAssignmentUpdatePayload,
} from "@/validations/assignment.validation";

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

export const assignmentController = {
    async getAll() {
        try {
            const currentUser = await getCurrentUserFromCookie();

            if (!currentUser) {
                return errorResponse("Bạn chưa đăng nhập", 401);
            }

            const data = await assignmentService.getAssignments(currentUser);
            return successResponse(data, "Lấy danh sách bài tập thành công");
        } catch (error) {
            const resolved = resolveError(error);
            return errorResponse(resolved.message, resolved.status);
        }
    },

    async getOne(id: string) {
        try {
            const currentUser = await getCurrentUserFromCookie();

            if (!currentUser) {
                return errorResponse("Bạn chưa đăng nhập", 401);
            }

            const data = await assignmentService.getAssignmentById(id, currentUser);
            return successResponse(data, "Lấy chi tiết bài tập thành công");
        } catch (error) {
            const resolved = resolveError(error);
            return errorResponse(resolved.message, resolved.status);
        }
    },

    async getAvailable() {
        try {
            const currentUser = await getCurrentUserFromCookie();

            if (!currentUser) {
                return errorResponse("Bạn chưa đăng nhập", 401);
            }

            const data = await assignmentService.getAvailableAssignments(currentUser);
            return successResponse(data, "Lấy danh sách bài tập có thể nộp thành công");
        } catch (error) {
            const resolved = resolveError(error);
            return errorResponse(resolved.message, resolved.status);
        }
    },

    async create(request: Request) {
        try {
            const currentUser = await getCurrentUserFromCookie();

            if (!currentUser) {
                return errorResponse("Bạn chưa đăng nhập", 401);
            }

            const formData = await request.formData();
            const payload = extractAssignmentPayload(formData);

            const resourceFiles = extractFiles(formData, "resourceFiles");
            const rubricFiles = extractFiles(formData, "rubricFiles");
            const templateFiles = extractFiles(formData, "templateFiles");

            const [savedResources, savedRubrics, savedTemplates] = await Promise.all([
                saveFilesToLocal(resourceFiles, "assignments/resources"),
                saveFilesToLocal(rubricFiles, "assignments/rubrics"),
                saveFilesToLocal(templateFiles, "assignments/templates"),
            ]);

            const attachments = [
                ...savedResources.map((file) => ({ ...file, kind: "resource" as const })),
                ...savedRubrics.map((file) => ({ ...file, kind: "rubric" as const })),
                ...savedTemplates.map((file) => ({ ...file, kind: "template" as const })),
            ];

            const created = await assignmentService.createAssignment(
                payload,
                attachments,
                currentUser
            );

            return successResponse(created, "Tạo bài tập thành công", 201);
        } catch (error) {
            const resolved = resolveError(error);
            return errorResponse(resolved.message, resolved.status);
        }
    },

    async update(id: string, request: Request) {
        try {
            const currentUser = await getCurrentUserFromCookie();

            if (!currentUser) {
                return errorResponse("Bạn chưa đăng nhập", 401);
            }

            const formData = await request.formData();
            const payload = extractAssignmentUpdatePayload(formData);

            const keepExistingAttachmentUrls = formData
                .getAll("keepExistingAttachmentUrls")
                .map((item) => String(item))
                .filter(Boolean);

            const resourceFiles = extractFiles(formData, "resourceFiles");
            const rubricFiles = extractFiles(formData, "rubricFiles");
            const templateFiles = extractFiles(formData, "templateFiles");

            const [savedResources, savedRubrics, savedTemplates] = await Promise.all([
                saveFilesToLocal(resourceFiles, "assignments/resources"),
                saveFilesToLocal(rubricFiles, "assignments/rubrics"),
                saveFilesToLocal(templateFiles, "assignments/templates"),
            ]);

            const newAttachments = [
                ...savedResources.map((file) => ({ ...file, kind: "resource" as const })),
                ...savedRubrics.map((file) => ({ ...file, kind: "rubric" as const })),
                ...savedTemplates.map((file) => ({ ...file, kind: "template" as const })),
            ];

            const updated = await assignmentService.updateAssignment(
                id,
                payload,
                {
                    keepExistingAttachmentUrls,
                    newAttachments,
                },
                currentUser
            );

            if (updated.removedAttachmentUrls.length) {
                await deleteLocalFilesByUrls(updated.removedAttachmentUrls);
            }

            return successResponse(updated.assignment, "Cập nhật bài tập thành công");
        } catch (error) {
            const resolved = resolveError(error);
            return errorResponse(resolved.message, resolved.status);
        }
    },

    async remove(id: string) {
        try {
            const currentUser = await getCurrentUserFromCookie();

            if (!currentUser) {
                return errorResponse("Bạn chưa đăng nhập", 401);
            }

            const deleted = await assignmentService.deleteAssignment(id, currentUser);
            return successResponse(deleted, "Xóa bài tập thành công");
        } catch (error) {
            const resolved = resolveError(error);
            return errorResponse(resolved.message, resolved.status);
        }
    },
};