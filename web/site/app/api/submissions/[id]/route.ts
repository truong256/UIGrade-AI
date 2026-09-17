// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { successResponse } from "@/lib/api-response";
import { webMvpErrorResponse } from "@/lib/web-mvp-route";
import { SupabaseGradingService } from "@/services/supabase/grading.supabase";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        return successResponse(await SupabaseGradingService.getSubmissionDetail(id), "Lấy chi tiết bài nộp thành công");
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}
