import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { AuthorizationError } from "@/lib/authorization";

const mocks = vi.hoisted(() => ({
    requireActor: vi.fn(),
    connectDB: vi.fn(),
    getClassById: vi.fn(),
}));

vi.mock("@/lib/current-user", () => ({
    getCurrentUserFromCookie: vi.fn(),
    requireActiveRequestActor: mocks.requireActor,
}));
vi.mock("@/lib/mongodb", () => ({ connectDB: mocks.connectDB }));
vi.mock("@/services/classroom.service", () => ({
    classroomService: {
        getClassById: mocks.getClassById,
    },
}));

import { classroomController } from "@/controllers/classroom.controller";

const request = new NextRequest("http://localhost/api/classes/class-a");

describe("class detail route authentication", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.connectDB.mockResolvedValue(undefined);
        mocks.getClassById.mockResolvedValue({ _id: "class-a", name: "Class A" });
    });

    it("denies an anonymous request before opening MongoDB", async () => {
        mocks.requireActor.mockRejectedValue(new AuthorizationError("Bạn chưa đăng nhập", 401));
        const response = await classroomController.getById(request, "class-a");
        expect(response.status).toBe(401);
        expect(mocks.connectDB).not.toHaveBeenCalled();
    });

    it("denies pending, inactive, and banned profiles", async () => {
        mocks.requireActor.mockRejectedValue(new AuthorizationError("Tài khoản bị khóa", 403));
        const response = await classroomController.getById(request, "class-a");
        expect(response.status).toBe(403);
        expect(mocks.getClassById).not.toHaveBeenCalled();
    });

    it("passes only the server-verified actor to the authorization service", async () => {
        const actor = {
            userId: "student-a",
            email: "student@example.com",
            role: "student" as const,
        };
        mocks.requireActor.mockResolvedValue(actor);
        const response = await classroomController.getById(request, "class-a");
        expect(response.status).toBe(200);
        expect(mocks.getClassById).toHaveBeenCalledWith("class-a", actor);
    });
});
