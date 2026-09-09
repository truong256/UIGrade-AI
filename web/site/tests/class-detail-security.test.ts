import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    findById: vi.fn(),
    findMember: vi.fn(),
    countActive: vi.fn(),
}));

vi.mock("@/repositories/classroom.repository", () => ({
    classroomRepository: {
        findById: mocks.findById,
    },
}));
vi.mock("@/repositories/classroom-member.repository", () => ({
    findMember: mocks.findMember,
    countActiveStudentsByClassroomId: mocks.countActive,
}));

import { classroomService } from "@/services/classroom.service";

const classroom = {
    _id: "507f1f77bcf86cd799439011",
    name: "Android UI",
    code: "ANDROID-01",
    description: "MVP class",
    semester: "HK1",
    academicYear: "2026-2027",
    status: "active",
    teacherId: {
        _id: "507f191e810c19729de860ea",
        name: "Owner",
        email: "private-owner@example.com",
        studentCode: "PRIVATE",
    },
    studentIds: [
        {
            _id: "507f191e810c19729de860eb",
            name: "Student",
            email: "private-student@example.com",
            studentCode: "SV001",
        },
    ],
};

describe("class detail authorization matrix and DTO", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.findById.mockResolvedValue(classroom);
        mocks.countActive.mockResolvedValue(1);
    });

    it("allows the owner lecturer and removes populated PII", async () => {
        const result = await classroomService.getClassById(classroom._id, {
            userId: "507f191e810c19729de860ea",
            role: "lecturer",
        });
        expect(result?.teacher).toEqual({
            _id: "507f191e810c19729de860ea",
            name: "Owner",
        });
        expect(result).not.toHaveProperty("studentIds");
        expect(result?.teacher).not.toHaveProperty("email");
        expect(result?.teacher).not.toHaveProperty("studentCode");
    });

    it("denies another lecturer", async () => {
        await expect(
            classroomService.getClassById(classroom._id, {
                userId: "507f191e810c19729de860ff",
                role: "lecturer",
            })
        ).rejects.toThrow("không có quyền");
    });

    it("allows an active student member", async () => {
        mocks.findMember.mockResolvedValue({ status: "active" });
        await expect(
            classroomService.getClassById(classroom._id, {
                userId: "507f191e810c19729de860eb",
                role: "student",
            })
        ).resolves.toMatchObject({ _id: classroom._id, name: classroom.name });
    });

    it.each([null, { status: "pending" }, { status: "dropped" }])(
        "denies a non-active student membership %j",
        async (membership) => {
            mocks.findMember.mockResolvedValue(membership);
            await expect(
                classroomService.getClassById(classroom._id, {
                    userId: "507f191e810c19729de860ff",
                    role: "student",
                })
            ).rejects.toThrow("không có quyền");
        }
    );

    it("allows active admin read-only oversight", async () => {
        await expect(
            classroomService.getClassById(classroom._id, {
                userId: "507f191e810c19729de860cc",
                role: "admin",
            })
        ).resolves.toMatchObject({ _id: classroom._id });
    });
});
