// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { NextRequest, NextResponse } from "next/server";
import { requireActiveRequestActor } from "@/lib/current-user";
import { webMvpErrorResponse } from "@/lib/web-mvp-route";
import { SupabaseWebClassService } from "@/services/supabase/web-mvp.supabase";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const actor = await requireActiveRequestActor(request);
        const { id } = await params;
        return NextResponse.json(await SupabaseWebClassService.stats(actor, id));
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}
