import { NextResponse } from "next/server";

export function successResponse(data: unknown, message = "Thành công", status = 200) {
    return NextResponse.json(
        {
            success: true,
            message,
            data,
        },
        { status }
    );
}

export function errorResponse(message = "Lỗi server", status = 500) {
    return NextResponse.json(
        {
            success: false,
            message,
        },
        { status }
    );
}