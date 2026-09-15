// @vitest-environment jsdom

import { act, cleanup, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    fetchAvailableAssignments: vi.fn(),
    saveSubmission: vi.fn(),
}));

vi.mock("@/app/ui/submit_assignment/type/submit_assignment.api", () => ({
    fetchAvailableAssignments: mocks.fetchAvailableAssignments,
    saveSubmission: mocks.saveSubmission,
}));

import { useSubmitAssignment } from "@/app/ui/submit_assignment/hook/use_submit_assignment";
import {
    getSubmissionValidationError,
    MAX_STUDENT_SUBMISSION_BYTES,
} from "@/app/ui/submit_assignment/type/submit_assignment.utils";
import type { AssignmentItem } from "@/app/ui/submit_assignment/type/submit_assignment.type";
import { SubmissionForm } from "@/components/submit_assignment/SubmissionForm";
import { AlertMessages } from "@/components/submit_assignment/AlertMessages";

function assignment(id: string, latestSubmission: AssignmentItem["latestSubmission"] = null): AssignmentItem {
    return {
        _id: id,
        title: `Bài tập ${id}`,
        description: "Mô tả",
        language: "Kotlin",
        dueAt: "2099-09-15T12:00:00.000Z",
        allowLateSubmit: true,
        allowResubmit: true,
        latePenaltyPercent: 0,
        maxScore: 10,
        displayStatus: "published",
        classroom: { _id: "class-1", name: "Android", code: "AND-01" },
        attachments: [],
        latestSubmission,
    };
}

describe("student submission workflow", () => {
    beforeEach(() => {
        window.history.replaceState({}, "", "/ui/submit_assignment");
        mocks.fetchAvailableAssignments.mockResolvedValue([
            assignment("assignment-1"),
            assignment("assignment-2"),
        ]);
        mocks.saveSubmission.mockResolvedValue({ success: true });
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it("selects the assignment requested by the assignmentId deep link", async () => {
        window.history.replaceState(
            {},
            "",
            "/ui/submit_assignment?assignmentId=assignment-2"
        );

        const { result } = renderHook(() => useSubmitAssignment());

        await waitFor(() => expect(result.current.loading).toBe(false));
        expect(result.current.selectedId).toBe("assignment-2");
    });

    it("allows only one submission mutation while the first request is pending", async () => {
        let resolveSave!: (value: { success: boolean }) => void;
        mocks.saveSubmission.mockImplementation(
            () => new Promise((resolve) => { resolveSave = resolve; })
        );
        const { result } = renderHook(() => useSubmitAssignment());
        await waitFor(() => expect(result.current.selectedAssignment?._id).toBe("assignment-1"));

        act(() => {
            void result.current.submitAssignment("draft");
            void result.current.submitAssignment("draft");
        });

        expect(mocks.saveSubmission).toHaveBeenCalledTimes(1);
        await act(async () => resolveSave({ success: true }));
    });

    it("validates repository URLs and file policy before upload", () => {
        const invalidFile = new File(["not-an-apk"], "homework.exe", {
            type: "application/octet-stream",
        });
        const oversizedFile = new File(["zip"], "homework.zip", {
            type: "application/zip",
        });
        Object.defineProperty(oversizedFile, "size", {
            value: MAX_STUDENT_SUBMISSION_BYTES + 1,
        });

        expect(getSubmissionValidationError({
            action: "submit",
            files: [invalidFile],
            repositoryUrl: "",
            existingFiles: [],
        })).toMatch(/APK hoặc ZIP/i);
        expect(getSubmissionValidationError({
            action: "submit",
            files: [oversizedFile],
            repositoryUrl: "",
            existingFiles: [],
        })).toMatch(/100 MB/i);
        expect(getSubmissionValidationError({
            action: "submit",
            files: [],
            repositoryUrl: "http://github.com/example/project",
            existingFiles: [],
        })).toMatch(/HTTPS/i);
    });

    it("accepts an existing draft file when finalizing without selecting it again", () => {
        expect(getSubmissionValidationError({
            action: "submit",
            files: [],
            repositoryUrl: "",
            existingFiles: [{ url: "/api/file", originalName: "draft.zip" }],
        })).toBe("");
    });

    it("requires fresh evidence for a new attempt after an earlier submission", async () => {
        mocks.fetchAvailableAssignments.mockResolvedValue([
            assignment("assignment-1", {
                _id: "submission-1",
                attemptNo: 1,
                status: "submitted",
                files: [{ url: "/api/file", originalName: "old.zip" }],
            }),
        ]);
        const { result } = renderHook(() => useSubmitAssignment());
        await waitFor(() => expect(result.current.selectedAssignment).not.toBeNull());

        await act(async () => result.current.submitAssignment("submit"));

        expect(mocks.saveSubmission).not.toHaveBeenCalled();
        expect(result.current.error).toMatch(/tải tệp hoặc cung cấp repository/i);
    });

    it("associates submission fields with labels and announces feedback", () => {
        const { unmount } = render(
            <SubmissionForm
                assignment={assignment("assignment-1")}
                repositoryUrl=""
                note=""
                onFilesChange={vi.fn()}
                onRepositoryUrlChange={vi.fn()}
                onNoteChange={vi.fn()}
                onSubmit={vi.fn()}
            />
        );

        expect(screen.getByLabelText(/tệp apk hoặc zip/i)).toBeTruthy();
        expect(screen.getByLabelText(/đường dẫn repository/i)).toBeTruthy();
        expect(screen.getByLabelText(/ghi chú nộp bài/i)).toBeTruthy();
        unmount();

        render(<AlertMessages error="File không hợp lệ" success="" />);
        expect(screen.getByRole("alert").textContent).toContain("File không hợp lệ");
    });
});
