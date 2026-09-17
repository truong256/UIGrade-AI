// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { NextRequest, NextResponse } from "next/server";
import { requireActiveRequestActor } from "@/lib/current-user";
import { webMvpErrorResponse } from "@/lib/web-mvp-route";
import { SupabaseWebClassService, WebMvpError } from "@/services/supabase/web-mvp.supabase";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const actor = await requireActiveRequestActor(request);
        const { id } = await params;
        const rawStatus = new URL(request.url).searchParams.get("status");
        const status = rawStatus === "pending" ? "pending" : "active";
        return NextResponse.json({ items: await SupabaseWebClassService.members(actor, id, status) });
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}

export async function POST() {
    return webMvpErrorResponse(new WebMvpError("Hãy yêu cầu sinh viên tham gia bằng mã lớp; thêm trực tiếp đã bị tắt", 409));
}
