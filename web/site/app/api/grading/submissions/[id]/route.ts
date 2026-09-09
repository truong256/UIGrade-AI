import { gradingFailure, gradingSuccess, routeId } from "@/lib/grading-route";
import { SupabaseGradingService } from "@/services/supabase/grading.supabase";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
    try {
        return gradingSuccess(
            await SupabaseGradingService.getSubmissionDetail(await routeId(context)),
            "Lấy chi tiết bài nộp thành công"
        );
    } catch (error) {
        return gradingFailure(error, "Không thể tải chi tiết bài nộp.");
    }
}
