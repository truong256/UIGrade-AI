// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { getCurrentUserFromRequest } from "@/lib/current-user";
import { errorResponse, successResponse } from "@/lib/api-response";
import { assignmentNotificationService } from "@/services/assignment-notification.service";
import { requireAdmin, resolveHttpStatus } from "@/lib/authorization";

export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUserFromRequest(request);
        requireAdmin(currentUser);
        const result = await assignmentNotificationService.runDeadlineReminderJob();
        return successResponse(result, "Chạy tác vụ nhắc hạn thành công");
    } catch (error) {
        return errorResponse(
            error instanceof Error ? error.message : "Không thể chạy tác vụ nhắc hạn",
            resolveHttpStatus(error)
        );
    }
}
