/**
 * app/api/settings/users/route.ts
 *
 * GET  /api/settings/users   — List users (Admin only)
 * POST /api/settings/users   — Create user (Admin only)
 *
 * SECURITY:
 *  - Only Admin role can access these endpoints.
 *  - Teacher/Lecturer/Student → 403 Forbidden.
 *  - Unauthenticated → 401 Unauthorized.
 *  - Authorization is enforced server-side via requireAdmin() in the service.
 */

import { getCurrentUserFromRequest } from "@/lib/current-user";
import { connectDB } from "@/lib/mongodb";
import { errorResponse, successResponse } from "@/lib/api-response";
import { userManagementService } from "@/services/user-management.service";
import { requireAdmin, resolveHttpStatus } from "@/lib/authorization";

export const runtime = "nodejs";

export async function GET(request: Request) {
    try {
        const currentUser = await getCurrentUserFromRequest(request);
        requireAdmin(currentUser); // throws 401 if null, 403 if not admin

        await connectDB();

        const { searchParams } = new URL(request.url);
        const data = await userManagementService.listUsers(
            {
                keyword: searchParams.get("keyword") ?? undefined,
                roles: (searchParams.get("role") as any) ?? "all",
                status: (searchParams.get("status") as any) ?? "all",
                page: Number(searchParams.get("page") ?? 1),
                limit: Number(searchParams.get("limit") ?? 10),
            },
            currentUser
        );

        return successResponse(data, "Lấy danh sách người dùng thành công");
    } catch (error) {
        return errorResponse(
            error instanceof Error ? error.message : "Không thể lấy danh sách người dùng",
            resolveHttpStatus(error)
        );
    }
}

export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUserFromRequest(request);
        requireAdmin(currentUser); // throws 401 if null, 403 if not admin

        await connectDB();

        const body = await request.json();
        const data = await userManagementService.createUser(body, currentUser);

        return successResponse(data, "Tạo người dùng thành công", 201);
    } catch (error) {
        return errorResponse(
            error instanceof Error ? error.message : "Không thể tạo người dùng",
            resolveHttpStatus(error)
        );
    }
}