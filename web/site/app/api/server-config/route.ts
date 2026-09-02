/**
 * app/api/server-config/route.ts
 *
 * GET   /api/server-config   — Get system configuration (Admin only)
 * PATCH /api/server-config   — Update system configuration (Admin only)
 *
 * SECURITY:
 *  - Only Admin role can access these endpoints.
 *  - Teacher/Lecturer/Student → 403 Forbidden.
 *  - Unauthenticated → 401 Unauthorized.
 */

import { connectDB } from "@/lib/mongodb";
import { getCurrentUserFromRequest } from "@/lib/current-user";
import { errorResponse, successResponse } from "@/lib/api-response";
import { systemConfigService } from "@/services/system-config.service";
import { requireAdmin, resolveHttpStatus } from "@/lib/authorization";

export const runtime = "nodejs";

export async function GET(request: Request) {
    try {
        const currentUser = await getCurrentUserFromRequest(request);
        requireAdmin(currentUser); // throws 401 if null, 403 if not admin

        await connectDB();

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
        requireAdmin(currentUser); // throws 401 if null, 403 if not admin

        await connectDB();

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
