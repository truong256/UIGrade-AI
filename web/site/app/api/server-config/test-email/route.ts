import { connectDB } from "@/lib/mongodb";
import { getCurrentUserFromRequest } from "@/lib/current-user";
import { errorResponse, successResponse } from "@/lib/api-response";
import { emailService } from "@/services/email.service";
import { systemConfigService } from "@/services/system-config.service";
import { requireAdmin, resolveHttpStatus } from "@/lib/authorization";

export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUserFromRequest(request);
        requireAdmin(currentUser);

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
            resolveHttpStatus(error)
        );
    }
}
