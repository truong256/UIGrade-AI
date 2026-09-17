// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { NextResponse } from "next/server";
import { requireActiveRequestActor } from "@/lib/current-user";
import { webMvpErrorResponse } from "@/lib/web-mvp-route";
import { SupabaseWebProfileService } from "@/services/supabase/web-mvp.supabase";

export async function PATCH(request: Request) {
    try {
        const actor = await requireActiveRequestActor(request);
        const body = await request.json();
        const notificationSettings = await SupabaseWebProfileService.updatePreferences(actor, {
            emailAssignments: Boolean(body.emailAssignments),
            pushReminders: Boolean(body.pushReminders),
        });
        return NextResponse.json({ message: "Cập nhật cài đặt thông báo thành công", notificationSettings });
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}
