import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SupabaseAuthService } from "@/services/supabase/auth.supabase";
import { AUTH_ENTRY_COOKIE } from "@/lib/auth-visit";

export async function POST() {
    const cookieStore = await cookies();
    const existingCookies = cookieStore.getAll();
    let remoteSignOutFailed = false;
    try {
        await SupabaseAuthService.logout();
    } catch {
        remoteSignOutFailed = true;
    }

    const response = NextResponse.json(
        { message: remoteSignOutFailed
            ? "Đã đăng xuất trên trình duyệt này. Chưa thể xác nhận thu hồi phiên trên máy chủ."
            : "Đăng xuất thành công", remoteSignOutFailed },
        { status: 200 }
    );

    response.cookies.set("token", "", {
        httpOnly: true,
        expires: new Date(0),
        path: "/",
    });
    response.cookies.set(AUTH_ENTRY_COOKIE, "", { path: "/", maxAge: 0 });
    response.headers.set("Cache-Control", "no-store");

    // Always remove this project's persisted SSR session, including chunked cookies,
    // even when the Auth server is unreachable. Do not touch other projects' cookies.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
        const storageKey = `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`;
        for (const { name } of existingCookies) {
            if (name === storageKey || name.startsWith(`${storageKey}.`) ||
                name === `${storageKey}-code-verifier`) {
                response.cookies.set(name, "", { expires: new Date(0), path: "/" });
            }
        }
    }

    return response;
}
