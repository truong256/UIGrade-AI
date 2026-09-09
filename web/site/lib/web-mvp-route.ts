import { ZodError } from "zod";
import { AuthorizationError } from "@/lib/authorization";
import { errorResponse } from "@/lib/api-response";
import { WebMvpError } from "@/services/supabase/web-mvp.supabase";

export function webMvpErrorResponse(error: unknown) {
    if (error instanceof AuthorizationError || error instanceof WebMvpError) {
        return errorResponse(error.message, error.statusCode);
    }
    if (error instanceof ZodError) {
        return errorResponse(error.issues[0]?.message || "Dữ liệu không hợp lệ", 400);
    }
    const statusCode = typeof (error as { statusCode?: unknown })?.statusCode === "number"
        ? Number((error as { statusCode: number }).statusCode)
        : 500;
    const message = error instanceof Error ? error.message : "Không thể xử lý yêu cầu";
    return errorResponse(message, statusCode);
}
