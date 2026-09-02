import {CurrentUserPayload, getCurrentUserFromRequest} from "@/lib/current-user";
import {connectDB} from "@/lib/mongodb";
import {errorResponse, successResponse} from "@/lib/api-response";
import {userManagementService} from "@/services/user-management.service";

export const runtime = "nodejs";

function ensureCanManage(request: Request) {
    const curentUsert = getCurrentUserFromRequest(request);

    if (!curentUsert?.userId) {
        throw new Error("bạn chưa đăng nhập");
    }

    if (!["admin","teacher"].includes(curentUsert.role)) {
        throw new Error("bạn không có quyền người dùng")
    }

    return curentUsert;
}

function resolveStatus(error: unknown){
    const message = error instanceof Error ? error.message : "không thể xử lý yêu cầu";

    if (message.includes("chưa đăng nhập")) return 401;
    if (message.includes("không có quyền")) return 403;
    if (message.includes("Không tìm thấy")) return 404;
    return 400;
}

export async function GET(request: Request){
    try {
        ensureCanManage(request);
        await connectDB();

        const {searchParams} = new URL(request.url);
        const data = await userManagementService.listUsers({
            keyword: searchParams.get("keyword") || undefined,
            roles:(searchParams.get("role") as "all" | "admin" | "teacher" | "User" | null) || "all",
            status: (searchParams.get("status") as "all" | "active" | "locked" | null) || "all",
            page: Number(searchParams.get("page") || 1),
            limit: Number(searchParams.get("limit") || 1),
        });
        return successResponse(data, "lấy danh sách người dùng thành công");
    }catch (error){
        return errorResponse(
            error instanceof Error ? error.message : "không tìm thấy danh sách người dùng",
            resolveStatus(error)
        );
    }
}
export async function POST( request: Request){
    try {
        ensureCanManage(request);
        await connectDB();

        const body = await request.json();
        const data = await userManagementService.createUser(body)

        return successResponse(data, "tạo người dùng thành công", 201);
    }catch (error){
        return errorResponse(
            error instanceof Error ? error.message : "không thể tạo người dùng",
            resolveStatus(error)
        )
    }
}