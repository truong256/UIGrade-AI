import { connectDB } from "@/lib/mongodb";
import { getCurrentUserFromRequest } from "@/lib/current-user";
import { errorResponse, successResponse } from "@/lib/api-response";
import { emailService } from "@/services/email.service";
import { systemConfigService } from "@/services/system-config.service";

export const runtime = "nodejs";

function resolveStatus(error: unknown) {
    const message = error instanceof Error ? error.message : "Không thể gửi email thử";

    if (message.includes("chưa đăng nhập")) return 401;
    if (message.includes("không có quyền")) return 403;
    return 400;
}

export async function POST(request: Request) {
    try {
        const currentUser = getCurrentUserFromRequest(request);

        if (!currentUser?.userId) {
            throw new Error("Bạn chưa đăng nhập");
        }

        if (!["admin", "teacher"].includes(currentUser.role)) {
            throw new Error("Bạn không có quyền gửi email thử");
        }

        await connectDB();

        const body = await request.json().catch(() => ({}));
        const config = await systemConfigService.getInternalConfig();
        const to = String(body.to || config.email.testReceiverEmail || currentUser.email || "").trim().toLowerCase();

        if (!to) {
            throw new Error("Bạn cần nhập email nhận thử");
        }

        await emailService.verifyTransport({ allowDisabled: true });
        await emailService.sendTestEmail(to);

        return successResponse({ to }, "Gửi email thử thành công");
    } catch (error) {
        return errorResponse(
            error instanceof Error ? error.message : "Không thể gửi email thử",
            resolveStatus(error)
        );
    }
}
