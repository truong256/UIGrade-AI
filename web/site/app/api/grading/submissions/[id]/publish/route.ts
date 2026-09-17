// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { gradingFailure, gradingSuccess, routeId } from "@/lib/grading-route";
import { SupabaseGradingService } from "@/services/supabase/grading.supabase";

type Context = { params: Promise<{ id: string }> };
type Body = {
    criteria?: Array<{ criterionCode: string; awardedPoints: unknown; feedback?: unknown }>;
    manualScore?: unknown;
    lecturerFeedback?: unknown;
};

export async function POST(request: Request, context: Context) {
    try {
        const body = await request.json() as Body;
        const data = await SupabaseGradingService.saveGrade({
            submissionId: await routeId(context),
            criteria: body.criteria,
            manualScore: body.manualScore,
            lecturerFeedback: body.lecturerFeedback,
            publish: true,
        });
        return gradingSuccess(data, "Đã công bố điểm cho sinh viên");
    } catch (error) {
        return gradingFailure(error, "Không thể công bố điểm.");
    }
}
