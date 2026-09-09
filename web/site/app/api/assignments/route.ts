import { successResponse } from "@/lib/api-response";
import { requireActiveRequestActor } from "@/lib/current-user";
import { webMvpErrorResponse } from "@/lib/web-mvp-route";
import { SupabaseWebAssignmentService } from "@/services/supabase/web-mvp.supabase";
import { extractAssignmentPayload } from "@/validations/assignment.validation";

export const runtime = "nodejs";

function files(formData: FormData, name: string) {
    return formData.getAll(name).filter((item): item is File => item instanceof File && item.size > 0);
}

export async function GET(request: Request) {
    try {
        const actor = await requireActiveRequestActor(request);
        return successResponse(await SupabaseWebAssignmentService.list(actor), "Lấy danh sách bài tập thành công");
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}

export async function POST(request: Request) {
    try {
        const actor = await requireActiveRequestActor(request);
        const formData = await request.formData();
        const payload = extractAssignmentPayload(formData);
        const data = await SupabaseWebAssignmentService.create(actor, payload, [
            { files: files(formData, "resourceFiles"), kind: "resource" },
            { files: files(formData, "rubricFiles"), kind: "rubric" },
            { files: files(formData, "templateFiles"), kind: "template" },
        ]);
        return successResponse(data, "Tạo bài tập thành công", 201);
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}
