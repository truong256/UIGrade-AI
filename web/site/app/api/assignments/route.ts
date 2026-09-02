import { connectDB } from "@/lib/mongodb";
import { assignmentController } from "@/controllers/assignment.controller";

export const runtime = "nodejs";

export async function GET() {
    await connectDB();
    return assignmentController.getAll();
}

export async function POST(request: Request) {
    await connectDB();
    return assignmentController.create(request);
}