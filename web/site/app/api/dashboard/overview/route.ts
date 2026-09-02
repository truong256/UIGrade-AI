import { connectDB } from "@/lib/mongodb";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getCurrentUserFromCookie } from "@/lib/current-user";
import { dashboardService } from "@/services/dashboard.service";

export const runtime = "nodejs";

export async function GET(request: Request) {
    try {
        await connectDB();

        const currentUser = await getCurrentUserFromCookie();
        const { searchParams } = new URL(request.url);
        const rangeDays = Number(searchParams.get("range") || "7");

        const data = await dashboardService.getOverview(currentUser, {
            rangeDays,
        });

        return successResponse(data, "Lấy dữ liệu dashboard thành công");
    } catch (error) {
        const message = error instanceof Error ? error.message : "Không thể tải dashboard";

        if (message.includes("chưa đăng nhập")) {
            return errorResponse(message, 401);
        }

        return errorResponse(message, 500);
    }
}
