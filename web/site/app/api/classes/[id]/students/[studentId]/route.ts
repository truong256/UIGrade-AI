// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { NextRequest, NextResponse } from "next/server";
import { requireActiveRequestActor } from "@/lib/current-user";
import { webMvpErrorResponse } from "@/lib/web-mvp-route";
import { SupabaseWebClassService } from "@/services/supabase/web-mvp.supabase";

type Context = { params: Promise<{ id: string; studentId: string }> };

export async function PATCH(request: NextRequest, context: Context) {
    try {
        const actor = await requireActiveRequestActor(request);
        const { id, studentId } = await context.params;
        const body = await request.json();
        return NextResponse.json(await SupabaseWebClassService.updateMember(actor, id, studentId, String(body.action || "")));
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}

export async function DELETE(request: NextRequest, context: Context) {
    try {
        const actor = await requireActiveRequestActor(request);
        const { id, studentId } = await context.params;
        return NextResponse.json(await SupabaseWebClassService.removeMember(actor, id, studentId));
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}
