// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({ success: false, message: "Endpoint cũ đã tắt; hãy dùng /api/grading/submissions/:id/history" }, { status: 410 });
}
