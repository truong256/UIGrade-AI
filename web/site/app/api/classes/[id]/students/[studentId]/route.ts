import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import {
    deleteStudentController,
    updateStudentController,
} from "@/controllers/classroom-member.controller";

type RouteContext = {
    params: Promise<{ id: string; studentId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
    await connectDB();
    const { id, studentId } = await context.params;
    return updateStudentController(request, id, studentId);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
    await connectDB();
    const { id, studentId } = await context.params;
    return deleteStudentController(request, id, studentId);
}