// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { NextResponse } from "next/server";
import { gradingFailure, routeId } from "@/lib/grading-route";
import { SupabaseGradingService } from "@/services/supabase/grading.supabase";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
    try {
        const rawKind = new URL(request.url).searchParams.get("kind");
        if (rawKind !== "source" && rawKind !== "apk" && rawKind !== "file" && rawKind !== "attachment") {
            return NextResponse.json(
                { success: false, message: "Loại tệp không hợp lệ." },
                { status: 400, headers: { "Cache-Control": "no-store" } }
            );
        }
        const target = await SupabaseGradingService.getSubmissionFileUrl(
            await routeId(context),
            rawKind,
            Math.max(0, Number(new URL(request.url).searchParams.get("index") || 0))
        );
        return NextResponse.redirect(new URL(target, request.url), {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        return gradingFailure(error, "Không thể mở tệp bài nộp.");
    }
}
