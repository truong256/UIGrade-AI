// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    requireActor: vi.fn(),
    getProfile: vi.fn(),
    listClasses: vi.fn(),
    listAssignments: vi.fn(),
    listSubmissions: vi.fn(),
}));

vi.mock("@/lib/current-user", () => ({
    requireActiveRequestActor: mocks.requireActor,
}));

vi.mock("@/services/supabase/web-mvp.supabase", () => ({
    SupabaseWebProfileService: { get: mocks.getProfile },
    SupabaseWebClassService: { list: mocks.listClasses },
    SupabaseWebAssignmentService: { list: mocks.listAssignments },
    SupabaseWebSubmissionService: { list: mocks.listSubmissions },
}));

import { GET } from "@/app/api/dashboard/overview/route";
import DashboardError from "@/components/dashboard/DashboardError";

describe("lecturer dashboard", () => {
    beforeEach(() => {
        mocks.requireActor.mockResolvedValue({
            userId: "lecturer-1",
            email: "teacher@uigrade.edu.vn",
            role: "lecturer",
        });
        mocks.getProfile.mockResolvedValue({ name: "Giảng viên mẫu" });
        mocks.listClasses.mockResolvedValue([
            { _id: "class-1", name: "Lớp Android", studentCount: 2 },
        ]);
        mocks.listAssignments.mockResolvedValue([
            {
                _id: "assignment-1",
                title: "Bài Compose",
                classroom: { _id: "class-1", name: "Lớp Android" },
            },
        ]);
        mocks.listSubmissions.mockResolvedValue([
            {
                _id: "submission-1",
                assignmentId: { _id: "assignment-1", title: "Bài Compose" },
                classroomId: { _id: "class-1", name: "Lớp Android" },
                studentId: { _id: "student-1", name: "Sinh viên mẫu" },
                gradeStatus: "overridden",
                finalScore: 8,
                submittedAt: "2026-09-14T10:00:00.000Z",
            },
        ]);
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it("derives class performance and a complete grading link from published work", async () => {
        const response = await GET(
            new Request("http://localhost/api/dashboard/overview?range=7")
        );
        const body = await response.json();

        expect(response.status).toBe(200);
        expect(body.data.charts.averageScoreByClass).toEqual([
            { label: "Lớp Android", value: 8 },
        ]);
        expect(body.data.recentActivities[0]).toMatchObject({
            status: "Đã công bố",
            actionHref:
                "/ui/grading_detail?assignmentId=assignment-1&studentId=student-1&submissionId=submission-1",
        });
    });

    it("falls back to the seven-day range for an invalid query", async () => {
        const response = await GET(
            new Request("http://localhost/api/dashboard/overview?range=invalid")
        );
        const body = await response.json();

        expect(body.data.rangeDays).toBe(7);
        expect(body.data.charts.submissionsByDay).toHaveLength(7);
    });

    it("lets the lecturer retry a failed dashboard request", () => {
        const onRetry = vi.fn();
        render(<DashboardError error="Mất kết nối" onRetry={onRetry} />);

        fireEvent.click(screen.getByRole("button", { name: /thử lại/i }));

        expect(onRetry).toHaveBeenCalledTimes(1);
    });
});
