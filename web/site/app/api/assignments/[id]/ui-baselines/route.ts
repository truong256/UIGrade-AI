// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { requireActiveRequestActor } from "@/lib/current-user";
import { webMvpErrorResponse } from "@/lib/web-mvp-route";
import { SupabaseWebAssignmentService, WebMvpError } from "@/services/supabase/web-mvp.supabase";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const actor = await requireActiveRequestActor(request);
        const { id } = await params;
        await SupabaseWebAssignmentService.detail(actor, id);
        throw new WebMvpError("Cắt ảnh UI baseline là tính năng nâng cao và đang được tạm khóa trong Web MVP", 409);
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}
