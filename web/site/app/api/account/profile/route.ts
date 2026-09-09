import { NextResponse } from "next/server";
import { requireActiveRequestActor } from "@/lib/current-user";
import { webMvpErrorResponse } from "@/lib/web-mvp-route";
import { SupabaseWebProfileService, WebMvpError } from "@/services/supabase/web-mvp.supabase";

function text(value: unknown) { return String(value || "").trim(); }

export async function GET(request: Request) {
    try {
        const actor = await requireActiveRequestActor(request);
        return NextResponse.json({ user: await SupabaseWebProfileService.get(actor) });
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}

export async function PATCH(request: Request) {
    try {
        const actor = await requireActiveRequestActor(request);
        const body = await request.json();
        const input = {
            name: text(body.name), studentCode: text(body.studentCode).toUpperCase(),
            phone: text(body.phone), department: text(body.department), cohort: text(body.cohort),
            bio: text(body.bio), avatar: text(body.avatar),
        };
        if (input.name.length < 2) throw new WebMvpError("Tên phải có ít nhất 2 ký tự", 400);
        return NextResponse.json({ message: "Cập nhật hồ sơ thành công", user: await SupabaseWebProfileService.update(actor, input) });
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}
