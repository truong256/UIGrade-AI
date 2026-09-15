// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    fetchCurrentUserClient: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
    fetchCurrentUserClient: mocks.fetchCurrentUserClient,
}));

import MyResultsPage from "@/app/ui/my_results/page";
import AssignmentDetailDialog from "@/components/assignment_list/AssignmentDetailDialog";
import type { AssignmentItem } from "@/app/ui/assignment_list/type/assignment_list.type";

function assignment(gradeStatus: string): AssignmentItem {
    return {
        _id: "assignment-1",
        title: "Bài Compose",
        description: "Xây dựng giao diện đăng nhập",
        status: "published",
        displayStatus: "published",
        maxScore: 10,
        allowLateSubmit: false,
        allowResubmit: false,
        latePenaltyPercent: 0,
        language: "kotlin",
        classroom: { _id: "class-1", name: "Android", code: "AND-01" },
        teacher: { _id: "lecturer-1", name: "Giảng viên", email: "gv@uigrade.edu.vn" },
        attachments: [],
        latestSubmission: {
            _id: "submission-1",
            attemptNo: 1,
            status: "submitted",
            gradeStatus,
            finalScore: gradeStatus === "published" ? 9 : null,
        },
    };
}

describe("student role and assignment navigation", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ data: [] }),
        }));
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
        vi.unstubAllGlobals();
    });

    it("keeps the selected assignment in the submit link and hides unpublished results", () => {
        render(
            <AssignmentDetailDialog
                item={assignment("pending")}
                canManage={false}
                isStudent
                deletingId=""
                onClose={() => undefined}
                onOpenEdit={() => undefined}
                onDelete={() => undefined}
            />
        );

        expect(screen.getByRole("link", { name: "Đi tới nộp bài" }).getAttribute("href"))
            .toBe("/ui/submit_assignment?assignmentId=assignment-1");
        expect(screen.queryByRole("link", { name: "Xem kết quả chấm" })).toBeNull();
    });

    it("routes a published result to the student's result page", () => {
        render(
            <AssignmentDetailDialog
                item={assignment("published")}
                canManage={false}
                isStudent
                deletingId=""
                onClose={() => undefined}
                onOpenEdit={() => undefined}
                onDelete={() => undefined}
            />
        );

        expect(screen.getByRole("link", { name: "Xem kết quả chấm" }).getAttribute("href"))
            .toBe("/ui/my_results?submissionId=submission-1");
    });

    it("does not grant the student result UI to the legacy User role", async () => {
        mocks.fetchCurrentUserClient.mockResolvedValue({
            id: "legacy-1",
            name: "Legacy User",
            role: "User",
        });

        render(<MyResultsPage />);

        expect(await screen.findByText("Trang này dành cho sinh viên")).toBeTruthy();
        await waitFor(() => {
            expect(fetch).not.toHaveBeenCalledWith("/api/grading/results", expect.anything());
        });
    });
});
