import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { AuthorizationError } from "@/lib/authorization";

const mocks = vi.hoisted(() => ({
    requireActor: vi.fn(),
    rpc: vi.fn(),
}));

vi.mock("@/lib/current-user", () => ({
    requireActiveRequestActor: mocks.requireActor,
}));
vi.mock("@/lib/supabase/server", () => ({
    createSupabaseServerClient: async () => ({ rpc: mocks.rpc }),
}));

import { POST } from "@/app/api/classes/join/route";

function request(code: unknown = "CLASS-01") {
    return new NextRequest("http://localhost/api/classes/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
    });
}

describe("join class route security matrix", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.requireActor.mockResolvedValue({
            userId: "student-a",
            email: "student@example.com",
            role: "student",
        });
        mocks.rpc.mockResolvedValue({
            data: {
                classId: "class-a",
                membershipStatus: "pending",
                message: "Đang chờ duyệt",
            },
            error: null,
        });
    });

    it("calls the RPC with only a normalized code, never a student id or status", async () => {
        const response = await POST(request("  class-01 "));
        expect(response.status).toBe(200);
        expect(mocks.rpc).toHaveBeenCalledWith("join_class_by_code", {
            input_code: "CLASS-01",
        });
    });

    it.each(["", "   ", "x".repeat(65)])("rejects invalid code %j", async (code) => {
        expect((await POST(request(code))).status).toBe(400);
        expect(mocks.rpc).not.toHaveBeenCalled();
    });

    it("denies anonymous access", async () => {
        mocks.requireActor.mockRejectedValue(new AuthorizationError("Bạn chưa đăng nhập", 401));
        expect((await POST(request())).status).toBe(401);
    });

    it("denies pending or inactive accounts", async () => {
        mocks.requireActor.mockRejectedValue(new AuthorizationError("Tài khoản bị khóa", 403));
        expect((await POST(request())).status).toBe(403);
    });

    it.each(["lecturer", "admin"] as const)("denies a %s account", async (role) => {
        mocks.requireActor.mockResolvedValue({
            userId: role,
            email: `${role}@example.com`,
            role,
        });
        expect((await POST(request())).status).toBe(403);
        expect(mocks.rpc).not.toHaveBeenCalled();
    });

    it("returns the RPC's already-active result without creating a client-side duplicate", async () => {
        mocks.rpc.mockResolvedValue({
            data: { membershipStatus: "active", message: "Đã là thành viên" },
            error: null,
        });
        const response = await POST(request());
        expect(response.status).toBe(200);
        expect((await response.json()).data.membershipStatus).toBe("active");
        expect(mocks.rpc).toHaveBeenCalledTimes(1);
    });
});
