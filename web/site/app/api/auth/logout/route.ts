import { NextResponse } from "next/server";
import { SupabaseAuthService } from "@/services/supabase/auth.supabase";

export async function POST() {
    try {
        await SupabaseAuthService.logout();
    } catch {
        // Ignore errors during Supabase signout
    }

    const response = NextResponse.json(
        { message: "Đăng xuất thành công" },
        { status: 200 }
    );

    response.cookies.set("token", "", {
        httpOnly: true,
        expires: new Date(0),
        path: "/",
    });

    return response;
}