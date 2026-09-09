import { NextResponse } from "next/server";
import { requireActiveRequestActor } from "@/lib/current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { webMvpErrorResponse } from "@/lib/web-mvp-route";

export async function GET(request: Request) {
    try {
        const actor = await requireActiveRequestActor(request);
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase.from("notifications")
            .select("id,title,message,type,is_read,link,created_at")
            .eq("user_id", actor.userId)
            .order("created_at", { ascending: false })
            .limit(20);
        if (error) throw error;
        return NextResponse.json({ notifications: data || [] }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}
