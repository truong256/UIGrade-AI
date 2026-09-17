// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { requireActiveRequestActor } from "@/lib/current-user";
import { webMvpErrorResponse } from "@/lib/web-mvp-route";
import { SupabaseWebClassService } from "@/services/supabase/web-mvp.supabase";
import { updateClassroomSchema } from "@/validations/classroom.schema";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function GET(
    req: NextRequest,
    context: RouteContext
) {
    try {
        const actor = await requireActiveRequestActor(req);
        const { id } = await context.params;
        return successResponse(await SupabaseWebClassService.detail(actor, id), "Lấy chi tiết lớp học thành công");
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}

export async function PATCH(
    req: NextRequest,
    context: RouteContext
) {
    try {
        const actor = await requireActiveRequestActor(req);
        const { id } = await context.params;
        const input = updateClassroomSchema.parse(await req.json());
        return successResponse(await SupabaseWebClassService.update(actor, id, input), "Cập nhật lớp học thành công");
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}

export async function DELETE(
    req: NextRequest,
    context: RouteContext
) {
    try {
        const actor = await requireActiveRequestActor(req);
        const { id } = await context.params;
        return successResponse(await SupabaseWebClassService.remove(actor, id), "Xóa lớp học thành công");
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}
