import { gradingFailure, gradingSuccess } from "@/lib/grading-route";
import { SupabaseGradingService } from "@/services/supabase/grading.supabase";

export async function GET() {
    try {
        return gradingSuccess(
            await SupabaseGradingService.listAssignments(),
            "Lấy danh sách bài tập cần chấm thành công"
        );
    } catch (error) {
        return gradingFailure(error, "Không thể tải danh sách bài tập cần chấm.");
    }
}
