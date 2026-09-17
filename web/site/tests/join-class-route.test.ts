// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

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
                message: "Yêu cầu tham gia lớp đã được gửi và đang chờ giảng viên phê duyệt.",
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

    it("rejects an RPC result that does not confirm a pending membership", async () => {
        mocks.rpc.mockResolvedValue({
            data: { membershipStatus: "active", message: "Đã là thành viên" },
            error: null,
        });
        const response = await POST(request());
        expect(response.status).toBe(502);
        expect(await response.json()).toMatchObject({
            success: false,
            message: "Máy chủ chưa xác nhận yêu cầu đang chờ giảng viên duyệt.",
        });
        expect(mocks.rpc).toHaveBeenCalledTimes(1);
    });

    it("rejects a malformed array-valued pending status", async () => {
        mocks.rpc.mockResolvedValue({
            data: { membershipStatus: ["pending"] },
            error: null,
        });

        const response = await POST(request());

        expect(response.status).toBe(502);
        expect(await response.json()).toMatchObject({ success: false });
    });

    it("returns exact Vietnamese error 'Mã lớp không tồn tại.' when class code does not exist", async () => {
        mocks.rpc.mockResolvedValue({
            data: null,
            error: { message: "Mã lớp không tồn tại." },
        });
        const response = await POST(request("NOTFOUND-01"));
        expect(response.status).toBe(404);
        expect(await response.json()).toMatchObject({
            success: false,
            message: "Mã lớp không tồn tại.",
        });
    });

    it("returns exact Vietnamese error 'Bạn đã tham gia lớp học này.' when already active member", async () => {
        mocks.rpc.mockResolvedValue({
            data: null,
            error: { message: "Bạn đã tham gia lớp học này." },
        });
        const response = await POST(request("CLASS-01"));
        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({
            success: false,
            message: "Bạn đã tham gia lớp học này.",
        });
    });

    it("returns exact Vietnamese error 'Yêu cầu tham gia lớp đang chờ giảng viên duyệt.' when already pending", async () => {
        mocks.rpc.mockResolvedValue({
            data: null,
            error: { message: "Yêu cầu tham gia lớp đang chờ giảng viên duyệt." },
        });
        const response = await POST(request("CLASS-01"));
        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({
            success: false,
            message: "Yêu cầu tham gia lớp đang chờ giảng viên duyệt.",
        });
    });

    it("returns exact Vietnamese error 'Lớp học đã đạt số lượng thành viên tối đa.' when capacity (50) is reached", async () => {
        mocks.rpc.mockResolvedValue({
            data: null,
            error: { message: "Lớp học đã đạt số lượng thành viên tối đa." },
        });
        const response = await POST(request("CLASS-01"));
        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({
            success: false,
            message: "Lớp học đã đạt số lượng thành viên tối đa.",
        });
    });

    it("returns exact Vietnamese error 'Lớp học hiện không nhận thêm sinh viên.' when class is inactive or closed", async () => {
        mocks.rpc.mockResolvedValue({
            data: null,
            error: { message: "Lớp học hiện không nhận thêm sinh viên." },
        });
        const response = await POST(request("CLASS-01"));
        expect(response.status).toBe(400);
        expect(await response.json()).toMatchObject({
            success: false,
            message: "Lớp học hiện không nhận thêm sinh viên.",
        });
    });
});
