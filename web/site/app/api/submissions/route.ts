// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { successResponse } from "@/lib/api-response";
import { requireActiveRequestActor } from "@/lib/current-user";
import { webMvpErrorResponse } from "@/lib/web-mvp-route";
import { SupabaseWebSubmissionService } from "@/services/supabase/web-mvp.supabase";
import { extractSubmissionPayload } from "@/validations/submission.validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
    try {
        const actor = await requireActiveRequestActor(request);
        const params = new URL(request.url).searchParams;
        const data = await SupabaseWebSubmissionService.list(actor, {
            assignmentId: params.get("assignmentId") || undefined,
            studentId: params.get("studentId") || undefined,
            classId: params.get("classroomId") || undefined,
        });
        return successResponse(data, "Lấy danh sách bài nộp thành công");
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}

export async function POST(request: Request) {
    try {
        const actor = await requireActiveRequestActor(request);
        const formData = await request.formData();
        const payload = extractSubmissionPayload(formData);
        const files = formData.getAll("submissionFiles")
            .filter((item): item is File => item instanceof File && item.size > 0);
        const data = await SupabaseWebSubmissionService.save(actor, payload, files);
        return successResponse(data, payload.action === "draft" ? "Đã lưu bản nháp" : "Nộp bài thành công", 201);
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}
