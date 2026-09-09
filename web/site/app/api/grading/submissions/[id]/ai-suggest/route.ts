import { gradingFailure, gradingSuccess, routeId } from "@/lib/grading-route";
import { SupabaseGradingService } from "@/services/supabase/grading.supabase";

type Context = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: Context) {
    try {
        return gradingSuccess(
            await SupabaseGradingService.generateAiSuggestion(await routeId(context)),
            "AI đã tạo gợi ý; giảng viên cần kiểm tra và quyết định điểm chính thức"
        );
    } catch (error) {
        return gradingFailure(error, "Không thể tạo gợi ý AI.");
    }
}
