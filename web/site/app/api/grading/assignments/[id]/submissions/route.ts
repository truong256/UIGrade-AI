// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { gradingFailure, gradingSuccess, routeId } from "@/lib/grading-route";
import { SupabaseGradingService } from "@/services/supabase/grading.supabase";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
    try {
        const id = await routeId(context);
        return gradingSuccess(
            await SupabaseGradingService.getAssignmentWorkspace(id),
            "Lấy danh sách bài nộp thành công"
        );
    } catch (error) {
        return gradingFailure(error, "Không thể tải danh sách bài nộp.");
    }
}
