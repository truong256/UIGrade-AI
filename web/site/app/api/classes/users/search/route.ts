// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({ success: false, message: "Tìm và thêm trực tiếp sinh viên đã tắt; sinh viên phải dùng mã lớp" }, { status: 410 });
}
