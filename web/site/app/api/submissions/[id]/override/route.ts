import { NextResponse } from "next/server";

export async function POST() {
    return NextResponse.json({ success: false, message: "Endpoint cũ đã tắt; hãy dùng quy trình grading Supabase" }, { status: 410 });
}
