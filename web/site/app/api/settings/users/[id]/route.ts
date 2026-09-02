/**
 * app/api/settings/users/[id]/route.ts
 *
 * PATCH  /api/settings/users/:id   — Update user (Admin only)
 * DELETE /api/settings/users/:id   — Delete user (Admin only)
 *
 * SECURITY:
 *  - Only Admin role can access these endpoints.
 *  - Teacher/Lecturer/Student → 403 Forbidden.
 *  - Unauthenticated → 401 Unauthorized.
 *  - Target user is loaded from DB inside the service — the role in the
 *    request body is NEVER used to determine authorization.
 *  - Last-admin protection is enforced in the service layer.
 */

import { getCurrentUserFromRequest } from "@/lib/current-user";
import { connectDB } from "@/lib/mongodb";
import { errorResponse, successResponse } from "@/lib/api-response";
import { userManagementService } from "@/services/user-management.service";
import { requireAdmin, resolveHttpStatus } from "@/lib/authorization";

export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
    try {
        const currentUser = await getCurrentUserFromRequest(request);
        requireAdmin(currentUser); // throws 401 / 403

        await connectDB();

        const { id } = await context.params;
        const body = await request.json();

        const data = await userManagementService.updateUser(id, body, currentUser);

        return successResponse(data, "Cập nhật thông tin người dùng thành công");
    } catch (error) {
        return errorResponse(
            error instanceof Error ? error.message : "Không thể cập nhật người dùng",
            resolveHttpStatus(error)
        );
    }
}

export async function DELETE(request: Request, context: RouteContext) {
    try {
        const currentUser = await getCurrentUserFromRequest(request);
        requireAdmin(currentUser); // throws 401 / 403

        await connectDB();

        const { id } = await context.params;
        const data = await userManagementService.deleteUser(id, currentUser);

        return successResponse(data, "Xóa người dùng thành công");
    } catch (error) {
        return errorResponse(
            error instanceof Error ? error.message : "Không thể xóa người dùng",
            resolveHttpStatus(error)
        );
    }
}