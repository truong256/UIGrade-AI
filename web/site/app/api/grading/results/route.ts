// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { gradingFailure, gradingSuccess } from "@/lib/grading-route";
import { SupabaseGradingService } from "@/services/supabase/grading.supabase";

export async function GET() {
    try {
        return gradingSuccess(
            await SupabaseGradingService.getMyPublishedResults(),
            "Lấy kết quả đã công bố thành công"
        );
    } catch (error) {
        return gradingFailure(error, "Không thể tải kết quả đã công bố.");
    }
}
