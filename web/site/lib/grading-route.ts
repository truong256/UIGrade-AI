// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { NextResponse } from "next/server";
import { resolveGradingHttpStatus } from "@/services/supabase/grading.supabase";

export function gradingSuccess(data: unknown, message: string, status = 200) {
    return NextResponse.json(
        { success: true, message, data },
        { status, headers: { "Cache-Control": "no-store" } }
    );
}

export function gradingFailure(error: unknown, fallback: string) {
    const message = error instanceof Error && error.message ? error.message : fallback;
    return NextResponse.json(
        { success: false, message },
        {
            status: resolveGradingHttpStatus(error),
            headers: { "Cache-Control": "no-store" },
        }
    );
}

export async function routeId(context: { params: Promise<{ id: string }> }) {
    const { id } = await context.params;
    if (!id) throw new Error("Thiếu mã dữ liệu cần xử lý.");
    return id;
}
