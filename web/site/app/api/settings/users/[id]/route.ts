import {getCurrentUserFromRequest} from "@/lib/current-user";
import {connectDB} from "@/lib/mongodb";
import {errorResponse, successResponse} from "@/lib/api-response";
import {userManagementService} from "@/services/user-management.service";

export const runtime = "nodejs"

type RouteContext = {
    params: Promise<{
        id: string;
    }>;
};

async function resolveId(context: RouteContext){
    const {id} = await context.params;
    return id;
}

function  ensureCanmanage(request: Request){
    const currentUser = getCurrentUserFromRequest(request);

    if (!currentUser?.userId) {
        throw Error("bạn chưa đăng nhập hặc tài khoản đã bị tạm khóa")
    }

    if (!["admin", "teacher"].includes(currentUser.role)) {
        throw new Error("Bạn không có quyền quản lý người dùng");
    }

    return currentUser;
}

function resolveStatus(error: unknown){
    const message = error instanceof Error ? error.message : "Không thể xử lý yêu cầu";

    if (message.includes("chưa đăng nhập")) return 401;
    if (message.includes("không có quyền")) return 403;
    if (message.includes("không tìm thấy")) return 404;
    return 400;

}

export async function PATCH(request: Request, context:RouteContext){
    try {
        const currentUser = ensureCanmanage(request)
        await connectDB();

        const id = await resolveId(context);
        const body = await  request.json();
        const data = await userManagementService.updateUser(id, body,currentUser.userId);

        return successResponse(data, "cập nhập trạng thái người dùng thành công");
    }catch (error){
        return  errorResponse(
            error instanceof  Error ? error.message : "không thể cập nhập người dùng",
            resolveStatus(error)
        );
    }
}

export async function DELETE(request: Request,context: RouteContext){
    try {
        const  curentUser = ensureCanmanage(request)
        await connectDB();

        const id = await resolveId(context);
        const data = await  userManagementService.deleteUser(id, curentUser.userId);

        return successResponse(data, "xóa người dùng thành công")
    }catch (error){
        return  errorResponse(
            error instanceof Error ? error.message: "không thể xóa người dùng",
            resolveStatus(error)
        );
    }
}