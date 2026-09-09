import { successResponse } from "@/lib/api-response";
import { requireActiveRequestActor } from "@/lib/current-user";
import { webMvpErrorResponse } from "@/lib/web-mvp-route";
import { SupabaseWebAssignmentService, WebMvpError } from "@/services/supabase/web-mvp.supabase";

export async function GET(request: Request) {
    try {
        const actor = await requireActiveRequestActor(request);
        if (actor.role !== "student") throw new WebMvpError("Chỉ sinh viên xem danh sách bài có thể nộp", 403);
        return successResponse(await SupabaseWebAssignmentService.list(actor), "Lấy danh sách bài tập có thể nộp thành công");
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}
