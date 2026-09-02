import { connectDB } from "@/lib/mongodb";
import { assignmentController } from "@/controllers/assignment.controller";

export const runtime = "nodejs";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await connectDB();
    const { id } = await params;
    return assignmentController.getOne(id);
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await connectDB();
    const { id } = await params;
    return assignmentController.update(id, request);
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await connectDB();
    const { id } = await params;
    return assignmentController.remove(id);
}