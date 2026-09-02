import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import {
    addStudentController,
    getStudentsController,
} from "@/controllers/classroom-member.controller";

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
    await connectDB();
    const { id } = await context.params;
    return getStudentsController(request, id);
}

export async function POST(request: NextRequest, context: RouteContext) {
    await connectDB();
    const { id } = await context.params;
    return addStudentController(request, id);
}