import { NextResponse } from "next/server";
import { requireActiveRequestActor } from "@/lib/current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { webMvpErrorResponse } from "@/lib/web-mvp-route";
import { WebMvpError } from "@/services/supabase/web-mvp.supabase";
import { mapSupabaseErrorToVietnamese } from "@/lib/supabase/errors";

export async function PATCH(request: Request) {
    try {
        const actor = await requireActiveRequestActor(request);
        const body = await request.json();
        const currentPassword = String(body.currentPassword || "");
        const newPassword = String(body.newPassword || "");
        const confirmPassword = String(body.confirmPassword || "");
        if (!currentPassword || !newPassword || !confirmPassword) throw new WebMvpError("Vui lòng nhập đầy đủ thông tin", 400);
        if (newPassword.length < 8) throw new WebMvpError("Mật khẩu mới phải có ít nhất 8 ký tự", 400);
        if (newPassword !== confirmPassword) throw new WebMvpError("Mật khẩu xác nhận không khớp", 400);
        if (currentPassword === newPassword) throw new WebMvpError("Mật khẩu mới phải khác mật khẩu hiện tại", 400);
        const supabase = await createSupabaseServerClient();
        const { error: verifyError } = await supabase.auth.signInWithPassword({ email: actor.email, password: currentPassword });
        if (verifyError) throw new WebMvpError("Mật khẩu hiện tại không đúng hoặc tài khoản dùng Google", 400);
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw new WebMvpError(mapSupabaseErrorToVietnamese(error), 400);
        return NextResponse.json({ message: "Đổi mật khẩu thành công" });
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}
