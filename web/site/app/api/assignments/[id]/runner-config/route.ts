// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { NextResponse } from "next/server";
import { requireActiveRequestActor } from "@/lib/current-user";
import { webMvpErrorResponse } from "@/lib/web-mvp-route";
import { SupabaseWebAssignmentService } from "@/services/supabase/web-mvp.supabase";
import { runnerConfigSchema } from "@/validations/assignment.validation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const actor = await requireActiveRequestActor(request);
        const { id } = await params;
        const body = await request.json();
        const runnerConfig = runnerConfigSchema.parse(body.runnerConfig);
        const data = await SupabaseWebAssignmentService.updateRunner(actor, id, runnerConfig);
        return NextResponse.json({ success: true, message: "Đã lưu cấu hình kiểm thử UI.", data: data.runnerConfig });
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}
