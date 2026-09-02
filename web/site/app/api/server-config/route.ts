import { connectDB } from "@/lib/mongodb";
import { getCurrentUserFromRequest } from "@/lib/current-user";
import { errorResponse, successResponse } from "@/lib/api-response";
import { systemConfigService } from "@/services/system-config.service";

export const runtime = "nodejs";

function ensureCanManage(request: Request) {
    const currentUser = getCurrentUserFromRequest(request);

    if (!currentUser?.userId) {
        throw new Error("Bạn chưa đăng nhập");
    }

    if (!["admin", "teacher"].includes(currentUser.role)) {
        throw new Error("Bạn không có quyền cấu hình hệ thống");
    }

    return currentUser;
}

function resolveStatus(error: unknown) {
    const message = error instanceof Error ? error.message : "Không thể xử lý yêu cầu";

    if (message.includes("chưa đăng nhập")) return 401;
    if (message.includes("không có quyền")) return 403;
    return 400;
}

export async function GET(request: Request) {
    try {
        ensureCanManage(request);
        await connectDB();

        const data = await systemConfigService.getPublicConfig();
        return successResponse(data, "Lấy cấu hình thành công");
    } catch (error) {
        return errorResponse(
            error instanceof Error ? error.message : "Không thể lấy cấu hình",
            resolveStatus(error)
        );
    }
}

export async function PATCH(request: Request) {
    try {
        ensureCanManage(request);
        await connectDB();

        const body = await request.json();
        const data = await systemConfigService.updateConfig(body);
        return successResponse(data, "Lưu cấu hình thành công");
    } catch (error) {
        return errorResponse(
            error instanceof Error ? error.message : "Không thể lưu cấu hình",
            resolveStatus(error)
        );
    }
}
