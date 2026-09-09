import { NextResponse } from "next/server";

function deferred() {
    return NextResponse.json({ success: false, message: "Quản trị người dùng nâng cao được tạm khóa trong Web MVP" }, { status: 410 });
}

export const GET = deferred;
export const POST = deferred;
