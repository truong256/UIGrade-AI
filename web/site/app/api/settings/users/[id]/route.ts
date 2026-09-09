import { NextResponse } from "next/server";

function deferred() {
    return NextResponse.json({ success: false, message: "Quản trị người dùng nâng cao được tạm khóa trong Web MVP" }, { status: 410 });
}

export const PATCH = deferred;
export const DELETE = deferred;
