import { connectDB } from "@/lib/mongodb";
import { classroomController } from "@/controllers/classroom.controller";
import { NextRequest } from "next/server";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function GET(
    req: NextRequest,
    context: RouteContext
) {
    await connectDB();
    const { id } = await context.params;
    return classroomController.getById(id);
}

export async function PATCH(
    req: NextRequest,
    context: RouteContext
) {
    await connectDB();
    const { id } = await context.params;
    return classroomController.update(req, id);
}

export async function DELETE(
    req: NextRequest,
    context: RouteContext
) {
    await connectDB();
    const { id } = await context.params;
    return classroomController.remove(id);
}