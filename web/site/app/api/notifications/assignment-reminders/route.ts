import { connectDB } from "@/lib/mongodb";
import { getCurrentUserFromRequest } from "@/lib/current-user";
import { errorResponse, successResponse } from "@/lib/api-response";
import { assignmentNotificationService } from "@/services/assignment-notification.service";

export const runtime = "nodejs";

function hasCronAccess(request: Request) {
    const token = request.headers.get("x-cron-token") || request.headers.get("authorization")?.replace("Bearer ", "");
    const expected = process.env.NOTIFICATION_CRON_TOKEN;
    return Boolean(expected && token && token === expected);
}

export async function POST(request: Request) {
    try {
        const currentUser = getCurrentUserFromRequest(request);
        const canRunAsUser = Boolean(
            currentUser?.userId && ["admin", "teacher"].includes(currentUser.role)
        );

        if (!canRunAsUser && !hasCronAccess(request)) {
            return errorResponse("Bạn không có quyền chạy tác vụ nhắc hạn", 403);
        }

        await connectDB();
        const result = await assignmentNotificationService.runDeadlineReminderJob();

        return successResponse(result, "Chạy tác vụ nhắc hạn thành công");
    } catch (error) {
        return errorResponse(
            error instanceof Error ? error.message : "Không thể chạy tác vụ nhắc hạn",
            500
        );
    }
}
