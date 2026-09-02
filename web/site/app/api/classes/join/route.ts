import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { joinClassController } from "@/controllers/classroom-member.controller";

export async function POST(request: NextRequest) {
    await connectDB();
    return joinClassController(request);
}