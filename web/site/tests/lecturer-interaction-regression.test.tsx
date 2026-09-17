// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClassDetailDialog } from "@/components/my_classes/ClassDetailDialog";
import EditClassDialog from "@/components/my_classes/EditClassDialog";
import AssignmentListAlerts from "@/components/assignment_list/AssignmentListAlerts";
import { AlertMessages } from "@/components/grading_detail/AlertMessages";
import { ScoreEditorCard } from "@/components/grading_detail/ScoreEditorCard";
import { TeacherFeedbackPanel } from "@/components/grading_detail/TeacherFeedbackPanel";

const classroom = {
    _id: "class-1",
    name: "Lớp Compose",
    code: "COMPOSE-01",
    semester: "HK1" as const,
    academicYear: "2026-2027",
    status: "active" as const,
};

describe("lecturer interaction accessibility", () => {
    beforeEach(() => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ activeStudentCount: 0, canManageMembers: false }),
            })
        );
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
        vi.unstubAllGlobals();
    });

    it("names the class detail close action and invokes it once", () => {
        vi.stubGlobal("fetch", vi.fn(() => new Promise(() => undefined)));
        const onClose = vi.fn();
        render(
            <ClassDetailDialog
                open
                classroom={classroom}
                onClose={onClose}
                onStudentAdded={vi.fn().mockResolvedValue(undefined)}
            />
        );

        fireEvent.click(
            screen.getByRole("button", { name: /đóng chi tiết lớp/i })
        );
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it("exposes the class editor as a named modal dialog", () => {
        render(
            <EditClassDialog
                open
                classroom={classroom}
                onClose={() => undefined}
                onSubmit={vi.fn().mockResolvedValue(false)}
            />
        );

        expect(
            screen.getByRole("dialog", { name: /chỉnh sửa thông tin lớp/i })
        ).toBeTruthy();
        expect(
            screen.getByRole("button", { name: /đóng chỉnh sửa lớp/i })
        ).toBeTruthy();
    });

    it("announces assignment and grading outcomes", () => {
        const { unmount } = render(
            <AssignmentListAlerts error="Không thể lưu" success="" />
        );
        expect(screen.getByRole("alert").textContent).toContain("Không thể lưu");
        unmount();

        render(<AlertMessages error="" notice="Đã lưu bản chấm" />);
        expect(screen.getByRole("status").textContent).toContain("Đã lưu bản chấm");
    });

    it("gives grading inputs meaningful accessible names", () => {
        const { unmount } = render(
            <ScoreEditorCard
                detail={null}
                maxScore={10}
                hasRubric={false}
                canGrade
                totalScore={0}
                manualScore=""
                onManualScoreChange={() => undefined}
            />
        );
        expect(
            screen.getByRole("spinbutton", { name: /điểm tổng thủ công/i })
        ).toBeTruthy();
        unmount();

        render(
            <TeacherFeedbackPanel
                detail={null}
                teacherComment=""
                saving={false}
                publishing={false}
                detailLoading={false}
                selectedSubmissionId="submission-1"
                canGrade
                onTeacherCommentChange={() => undefined}
                onSaveDraft={() => undefined}
                onPublish={() => undefined}
            />
        );
        expect(
            screen.getByRole("textbox", { name: /nhận xét của giảng viên/i })
        ).toBeTruthy();
    });
});
