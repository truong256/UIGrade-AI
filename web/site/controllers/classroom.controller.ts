import { NextRequest } from "next/server";
import { classroomService } from "@/services/classroom.service";
import {
    createClassroomSchema,
    updateClassroomSchema,
} from "@/validations/classroom.schema";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getCurrentUserFromCookie } from "@/lib/current-user";

function resolveStatus(error: unknown) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("chưa đăng nhập")) return 401;
    if (message.includes("không có quyền")) return 403;
    if (message.includes("chỉ có thể thao tác")) return 403;
    if (message.includes("Không tìm thấy")) return 404;
    if (message.includes("đã tồn tại")) return 400;

    return 500;
}

export const classroomController = {
    async getAll(_req: NextRequest) {
        try {
            const currentUser = await getCurrentUserFromCookie();

            if (!currentUser) {
                return errorResponse("Bạn chưa đăng nhập", 401);
            }

            const data = await classroomService.getAllClasses(currentUser);
            return successResponse(data, "Lấy danh sách lớp học thành công");
        } catch (error) {
            return errorResponse(
                error instanceof Error
                    ? error.message
                    : "Không thể lấy danh sách lớp học",
                resolveStatus(error)
            );
        }
    },

    async getById(id: string) {
        try {
            const data = await classroomService.getClassById(id);
            return successResponse(data, "Lấy chi tiết lớp học thành công");
        } catch (error) {
            return errorResponse(
                error instanceof Error
                    ? error.message
                    : "Không thể lấy chi tiết lớp học",
                resolveStatus(error)
            );
        }
    },

    async create(req: NextRequest) {
        try {
            const currentUser = await getCurrentUserFromCookie();

            if (!currentUser) {
                return errorResponse("Bạn chưa đăng nhập", 401);
            }

            const body = await req.json();
            const parsed = createClassroomSchema.safeParse(body);

            if (!parsed.success) {
                return errorResponse(
                    parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ",
                    400
                );
            }

            const data = await classroomService.createClass(parsed.data, currentUser);

            return successResponse(data, "Tạo lớp học thành công", 201);
        } catch (error) {
            return errorResponse(
                error instanceof Error ? error.message : "Không thể tạo lớp học",
                resolveStatus(error)
            );
        }
    },

    async update(req: NextRequest, id: string) {
        try {
            const currentUser = await getCurrentUserFromCookie();

            if (!currentUser) {
                return errorResponse("Bạn chưa đăng nhập", 401);
            }

            const body = await req.json();
            const parsed = updateClassroomSchema.safeParse(body);

            if (!parsed.success) {
                return errorResponse(
                    parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ",
                    400
                );
            }

            const data = await classroomService.updateClass(id, parsed.data, currentUser);

            return successResponse(data, "Cập nhật lớp học thành công");
        } catch (error) {
            return errorResponse(
                error instanceof Error ? error.message : "Không thể cập nhật lớp học",
                resolveStatus(error)
            );
        }
    },

    async remove(id: string) {
        try {
            const currentUser = await getCurrentUserFromCookie();

            if (!currentUser) {
                return errorResponse("Bạn chưa đăng nhập", 401);
            }

            await classroomService.deleteClass(id, currentUser);

            return successResponse(null, "Xóa lớp học thành công");
        } catch (error) {
            return errorResponse(
                error instanceof Error ? error.message : "Không thể xóa lớp học",
                resolveStatus(error)
            );
        }
    },
};