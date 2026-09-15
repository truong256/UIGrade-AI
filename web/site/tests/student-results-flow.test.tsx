// @vitest-environment jsdom

import { cleanup, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    fetchCurrentUser: vi.fn(),
    fetchMyResults: vi.fn(),
}));

vi.mock("@/app/ui/my_results/type/my_results.api", () => ({
    fetchCurrentUser: mocks.fetchCurrentUser,
    fetchMyResults: mocks.fetchMyResults,
}));

import { useMyResults } from "@/app/ui/my_results/hook/use_my_results";
import type { ResultItem } from "@/app/ui/my_results/type/my_results.type";
import {
    normalizeResult,
    safeRepositoryUrl,
} from "@/app/ui/my_results/type/my_results.utils";
import { SubmissionInfoCard } from "@/components/my_results/SubmissionInfoCard";
import { ResultsFilters } from "@/components/my_results/ResultsFilters";
import { ErrorAlert } from "@/components/my_results/ErrorAlert";

function resultItem(id: string, submissionId: string): ResultItem {
    return {
        _id: id,
        submissionId,
        assignmentId: `assignment-${id}`,
        assignmentTitle: `Bài tập ${id}`,
        classroomName: "Android",
        classroomCode: "AND-01",
        studentId: "student-1",
        studentName: "Sinh viên mẫu",
        studentCode: "SV001",
        attemptNo: 1,
        submissionStatus: "submitted",
        gradeStatus: "published",
        isLate: false,
        finalScore: 9,
        maxScore: 10,
        repositoryUrl: "",
        studentNote: "",
        teacherComment: "Tốt",
        aiSummary: "",
        strengths: [],
        nextSteps: [],
        criterionBreakdown: [],
    };
}

describe("student results workflow", () => {
    beforeEach(() => {
        window.history.replaceState({}, "", "/ui/my_results");
        mocks.fetchCurrentUser.mockResolvedValue({
            _id: "student-1",
            role: "student",
        });
        mocks.fetchMyResults.mockResolvedValue([
            resultItem("grade-1", "submission-1"),
            resultItem("grade-2", "submission-2"),
        ]);
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it("opens the published result requested by submissionId", async () => {
        window.history.replaceState(
            {},
            "",
            "/ui/my_results?submissionId=submission-2"
        );
        const { result } = renderHook(() => useMyResults());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.selectedItem?.submissionId).toBe("submission-2");
    });

    it("keeps the submission id and published legacy AI feedback in normalized data", () => {
        const normalized = normalizeResult({
            _id: "grade-1",
            submissionId: "submission-1",
            assignmentId: "assignment-1",
            assignmentTitle: "Compose",
            gradeStatus: "published",
            finalScore: 9,
            maxScore: 10,
            aiFeedback: {
                summary: "Bố cục rõ ràng",
                strengths: ["Dễ dùng"],
                nextSteps: ["Tăng tương phản"],
            },
        });

        expect(normalized.submissionId).toBe("submission-1");
        expect(normalized.aiSummary).toBe("Bố cục rõ ràng");
    });

    it("does not render unsafe repository schemes as links", () => {
        expect(safeRepositoryUrl("javascript:alert(1)")).toBe("");
        expect(safeRepositoryUrl("https://gitlab.com/team/project")).toBe(
            "https://gitlab.com/team/project"
        );

        render(
            <SubmissionInfoCard
                item={{
                    ...resultItem("grade-1", "submission-1"),
                    repositoryUrl: "javascript:alert(1)",
                }}
            />
        );
        expect(screen.queryByRole("link")).toBeNull();
    });

    it("labels result filters and announces request errors", () => {
        const { unmount } = render(
            <ResultsFilters
                keyword=""
                classFilter="all"
                statusFilter="all"
                classOptions={[]}
                onKeywordChange={vi.fn()}
                onClassFilterChange={vi.fn()}
                onStatusFilterChange={vi.fn()}
            />
        );

        expect(screen.getByLabelText(/tìm kiếm bài tập/i)).toBeTruthy();
        expect(screen.getByLabelText(/lớp học/i)).toBeTruthy();
        expect(screen.getByLabelText(/trạng thái/i)).toBeTruthy();
        unmount();

        render(<ErrorAlert message="Không tải được kết quả" />);
        expect(screen.getByRole("alert").textContent).toContain("Không tải được");
    });
});
