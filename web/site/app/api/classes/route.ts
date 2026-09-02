import { connectDB } from "@/lib/mongodb";
import { classroomController } from "@/controllers/classroom.controller";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
    await connectDB();
    return classroomController.getAll(req);
}

export async function POST(req: NextRequest) {
    await connectDB();
    return classroomController.create(req);
}