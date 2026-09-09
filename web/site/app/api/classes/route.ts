import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { requireActiveRequestActor } from "@/lib/current-user";
import { webMvpErrorResponse } from "@/lib/web-mvp-route";
import { SupabaseWebClassService } from "@/services/supabase/web-mvp.supabase";
import { createClassroomSchema } from "@/validations/classroom.schema";

export async function GET(req: NextRequest) {
    try {
        const actor = await requireActiveRequestActor(req);
        return successResponse(await SupabaseWebClassService.list(actor), "Lấy danh sách lớp học thành công");
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}

export async function POST(req: NextRequest) {
    try {
        const actor = await requireActiveRequestActor(req);
        const input = createClassroomSchema.parse(await req.json());
        return successResponse(await SupabaseWebClassService.create(actor, input), "Tạo lớp học thành công", 201);
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}
