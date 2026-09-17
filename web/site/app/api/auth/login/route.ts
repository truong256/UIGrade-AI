// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { NextRequest, NextResponse } from "next/server";
import { dashboardForRole, isAuthenticatedRole } from "@/lib/auth-routing";
import { AuthProfileUnavailableError, SupabaseAuthService } from "@/services/supabase/auth.supabase";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const email = String(body?.email || "").trim().toLowerCase();
        const password = String(body?.password || "");

        if (!email || !password) {
            return NextResponse.json(
                { message: "Vui lòng nhập email và mật khẩu." },
                { status: 400 }
            );
        }

        const { user } = await SupabaseAuthService.login({ email, password });

        if (user && user.status !== "active") {
            return NextResponse.json({ message: "Tài khoản hiện không hoạt động." }, { status: 403 });
        }

        if (!user || !isAuthenticatedRole(user.role)) {
            return NextResponse.json(
                { message: "Vui lòng hoàn tất chọn vai trò.", redirectTo: "/auth/select-role" },
                { status: 200 }
            );
        }

        return NextResponse.json(
            {
                message: "Đăng nhập thành công.",
                user,
                redirectTo: dashboardForRole(user.role),
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            {
                message: error instanceof Error
                    ? error.message
                    : "Đăng nhập thất bại. Vui lòng thử lại.",
            },
            { status: error instanceof AuthProfileUnavailableError ? 503 : 401 }
        );
    }
}
