// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { gradingFailure, gradingSuccess, routeId } from "@/lib/grading-route";
import { SupabaseGradingService } from "@/services/supabase/grading.supabase";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
    try {
        return gradingSuccess(
            await SupabaseGradingService.getHistory(await routeId(context)),
            "Lấy lịch sử chấm thành công"
        );
    } catch (error) {
        return gradingFailure(error, "Không thể tải lịch sử chấm.");
    }
}
