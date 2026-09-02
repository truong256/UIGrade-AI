import { NextRequest, NextResponse } from "next/server";
import { verifyAuthToken } from "@/lib/jwt";

const publicPaths = ["/login", "/register", "/forgot-password"];

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("token")?.value;

    const isPublicPath = publicPaths.some(
        (path) => pathname === path || pathname.startsWith(`${path}/`)
    );

    // Nếu đã đăng nhập rồi mà vẫn vào login/register thì đá về dashboard
    if (pathname === "/login" || pathname === "/register") {
        if (token) {
            const payload = await verifyAuthToken(token);

            if (payload) {
                return NextResponse.redirect(new URL("/ui/dashboard", request.url));
            }
        }

        return NextResponse.next();
    }

    // Cho phép các trang public đi qua
    if (isPublicPath) {
        return NextResponse.next();
    }

    // Chưa có token => bắt về login
    if (!token) {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // Có token nhưng token lỗi/hết hạn => xóa cookie và bắt về login
    const payload = await verifyAuthToken(token);

    if (!payload) {
        const response = NextResponse.redirect(new URL("/login", request.url));

        response.cookies.set("token", "", {
            path: "/",
            expires: new Date(0),
        });

        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/",
        "/login",
        "/register",
        "/forgot-password",
        "/ui/:path*",
    ],
};