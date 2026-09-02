import { connectDB } from "@/lib/mongodb";
import { assignmentController } from "@/controllers/assignment.controller";

export async function GET() {
    await connectDB();
    return assignmentController.getAvailable();
}