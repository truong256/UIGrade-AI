// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

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
    // Unknown/provider/database errors may contain SQL, schema or internal path
    // details. Only explicitly classified application errors are safe to return.
    return errorResponse("Không thể xử lý yêu cầu. Vui lòng thử lại sau.", 500);
}
