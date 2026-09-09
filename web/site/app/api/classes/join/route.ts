import { NextRequest, NextResponse } from "next/server";
import { requireActiveRequestActor } from "@/lib/current-user";
import { AuthorizationError, ROLES } from "@/lib/authorization";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
    try {
        const actor = await requireActiveRequestActor(request);
        if (actor.role !== ROLES.STUDENT) {
            throw new AuthorizationError("Chỉ sinh viên đang hoạt động mới được tham gia lớp");
        }

        const body = await request.json();
        const code = String(body?.code || body?.joinCode || "").trim().toUpperCase();
        if (!code || code.length > 64) {
            return NextResponse.json(
                { success: false, message: "Mã lớp không hợp lệ" },
                { status: 400 }
            );
        }

        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase.rpc<
            "join_class_by_code",
            { input_code: string }
        >("join_class_by_code", { input_code: code });

        if (error) {
            const forbidden = /active student|not active|not allowed/i.test(error.message);
            const notFound = /not found|inactive/i.test(error.message);
            return NextResponse.json(
                { success: false, message: error.message },
                { status: forbidden ? 403 : notFound ? 404 : 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message:
                data && typeof data === "object" && !Array.isArray(data) && "message" in data
                    ? String(data.message)
                    : "Yêu cầu tham gia lớp đã được ghi nhận",
            data,
        });
    } catch (error) {
        const status = error instanceof AuthorizationError ? error.statusCode : 500;
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Không thể tham gia lớp học",
            },
            { status }
        );
    }
}
