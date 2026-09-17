// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { NextResponse } from "next/server";

export async function POST() {
    return NextResponse.json({ success: false, message: "Endpoint cũ đã tắt; hãy dùng /api/grading/submissions/:id/draft hoặc /publish" }, { status: 410 });
}
