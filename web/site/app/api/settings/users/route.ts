import { errorResponse, successResponse } from "@/lib/api-response";
import { getCurrentUserFromRequest } from "@/lib/current-user";
import { resolveHttpStatus } from "@/lib/authorization";
import { userManagementService } from "@/services/user-management.service";

export const runtime = "nodejs";

export async function GET(request: Request) {
    try {
        const actor = await getCurrentUserFromRequest(request);
        const url = new URL(request.url);
        const data = await userManagementService.listUsers(actor, {
            keyword: url.searchParams.get("keyword") || undefined,
            role: url.searchParams.get("role") || undefined,
            status: url.searchParams.get("status") || undefined,
            page: Number(url.searchParams.get("page") || 1),
            limit: Number(url.searchParams.get("limit") || 10),
        });
        return successResponse(data, "Lấy danh sách người dùng thành công");
    } catch (error) {
        return errorResponse(
            error instanceof Error ? error.message : "Không thể tải danh sách người dùng",
            resolveHttpStatus(error)
        );
    }
}

export async function POST(request: Request) {
    try {
        const actor = await getCurrentUserFromRequest(request);
        const body = await request.json();
        const data = await userManagementService.createUser(actor, body);
        return successResponse(data, "Tạo người dùng thành công", 201);
    } catch (error) {
        return errorResponse(
            error instanceof Error ? error.message : "Không thể tạo người dùng",
            resolveHttpStatus(error)
        );
    }
}
