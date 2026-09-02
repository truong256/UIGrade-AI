import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User.model";

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const keyword = (req.nextUrl.searchParams.get("q") || "").trim();

        if (keyword.length < 2) {
            return NextResponse.json({
                success: true,
                data: [],
            });
        }

        const normalized = keyword.toUpperCase();

        const users = await User.find({
            role: "User",
            $or: [
                { name: { $regex: keyword, $options: "i" } },
                { studentCode: { $regex: normalized, $options: "i" } },
            ],
        })
            .select("_id name email studentCode")
            .sort({ createdAt: -1 })
            .limit(10);

        return NextResponse.json({
            success: true,
            data: users,
        });
    } catch (error) {
        console.error("SEARCH_USER_ERROR:", error);

        return NextResponse.json(
            {
                success: false,
                message:
                    error instanceof Error
                        ? error.message
                        : "Không thể tìm người dùng",
            },
            { status: 500 }
        );
    }
}