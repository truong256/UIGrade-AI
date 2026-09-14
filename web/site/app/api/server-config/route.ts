/**
 * GET/PATCH /api/server-config — Supabase-backed system configuration.
 */

import { getCurrentUserFromRequest } from "@/lib/current-user";
import { errorResponse, successResponse } from "@/lib/api-response";
import { systemConfigService } from "@/services/system-config.service";
import { requireAdmin, resolveHttpStatus } from "@/lib/authorization";

export const runtime = "nodejs";

export async function GET(request: Request) {
    try {
        const currentUser = await getCurrentUserFromRequest(request);
        requireAdmin(currentUser);
        const data = await systemConfigService.getPublicConfig();
        return successResponse(data, "Lấy cấu hình thành công");
    } catch (error) {
        return errorResponse(
            error instanceof Error ? error.message : "Không thể lấy cấu hình",
            resolveHttpStatus(error)
        );
    }
}

export async function PATCH(request: Request) {
    try {
        const currentUser = await getCurrentUserFromRequest(request);
        requireAdmin(currentUser);
        const body = await request.json();
        const data = await systemConfigService.updateConfig(body);
        return successResponse(data, "Lưu cấu hình thành công");
    } catch (error) {
        return errorResponse(
            error instanceof Error ? error.message : "Không thể lưu cấu hình",
            resolveHttpStatus(error)
        );
    }
}
