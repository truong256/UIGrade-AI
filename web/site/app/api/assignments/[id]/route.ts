// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { successResponse } from "@/lib/api-response";
import { requireActiveRequestActor } from "@/lib/current-user";
import { webMvpErrorResponse } from "@/lib/web-mvp-route";
import { SupabaseWebAssignmentService } from "@/services/supabase/web-mvp.supabase";
import { extractAssignmentUpdatePayload } from "@/validations/assignment.validation";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

function files(formData: FormData, name: string) {
    return formData.getAll(name).filter((item): item is File => item instanceof File && item.size > 0);
}

export async function GET(request: Request, context: Context) {
    try {
        const actor = await requireActiveRequestActor(request);
        const { id } = await context.params;
        return successResponse(await SupabaseWebAssignmentService.detail(actor, id), "Lấy chi tiết bài tập thành công");
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}

export async function PUT(request: Request, context: Context) {
    try {
        const actor = await requireActiveRequestActor(request);
        const { id } = await context.params;
        const formData = await request.formData();
        const payload = extractAssignmentUpdatePayload(formData);
        const kept = formData.getAll("keepExistingAttachmentUrls").map(String).filter(Boolean);
        const data = await SupabaseWebAssignmentService.update(actor, id, payload, kept, [
            { files: files(formData, "resourceFiles"), kind: "resource" },
            { files: files(formData, "rubricFiles"), kind: "rubric" },
            { files: files(formData, "templateFiles"), kind: "template" },
        ]);
        return successResponse(data, "Cập nhật bài tập thành công");
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}

export async function DELETE(request: Request, context: Context) {
    try {
        const actor = await requireActiveRequestActor(request);
        const { id } = await context.params;
        return successResponse(await SupabaseWebAssignmentService.remove(actor, id), "Xóa bài tập thành công");
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}
