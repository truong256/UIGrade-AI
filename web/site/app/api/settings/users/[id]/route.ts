import { errorResponse, successResponse } from "@/lib/api-response";
import { getCurrentUserFromRequest } from "@/lib/current-user";
import { resolveHttpStatus } from "@/lib/authorization";
import { userManagementService } from "@/services/user-management.service";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
    try {
        const actor = await getCurrentUserFromRequest(request);
        const { id } = await context.params;
        const body = await request.json();
        const data = await userManagementService.updateUser(actor, id, body);
        return successResponse(data, "Cập nhật người dùng thành công");
    } catch (error) {
        return errorResponse(
            error instanceof Error ? error.message : "Không thể cập nhật người dùng",
            resolveHttpStatus(error)
        );
    }
}

export async function DELETE(request: Request, context: Context) {
    try {
        const actor = await getCurrentUserFromRequest(request);
        const { id } = await context.params;
        const data = await userManagementService.deleteUser(actor, id);
        return successResponse(data, "Xóa người dùng thành công");
    } catch (error) {
        return errorResponse(
            error instanceof Error ? error.message : "Không thể xóa người dùng",
            resolveHttpStatus(error)
        );
    }
}
