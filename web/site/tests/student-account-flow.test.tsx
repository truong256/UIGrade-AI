// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EditProfileDialog } from "@/components/account/EditProfileDialog";

const student = {
    _id: "student-1",
    name: "Sinh viên mẫu",
    email: "student@uigrade.edu.vn",
    role: "student" as const,
    studentCode: "SV001",
    phone: "0900000000",
    department: "Công nghệ thông tin",
    cohort: "2026",
    bio: "Học viên",
    avatar: "",
};

describe("student account workflow", () => {
    afterEach(cleanup);

    it("labels the profile form and keeps the authenticated email read-only", () => {
        render(
            <EditProfileDialog
                open
                user={student}
                onClose={vi.fn()}
                onSubmit={vi.fn()}
            />
        );

        expect(screen.getByRole("dialog", { name: /chỉnh sửa hồ sơ/i })).toBeTruthy();
        expect(screen.getByLabelText(/họ và tên/i)).toBeTruthy();
        expect(screen.getByLabelText(/^email$/i)).toHaveProperty("readOnly", true);
        expect(screen.getByLabelText(/mã người dùng/i)).toBeTruthy();
        expect(screen.getByRole("button", { name: /đóng/i })).toBeTruthy();
    });

    it("prevents duplicate profile updates while the first one is pending", async () => {
        let resolveSave!: () => void;
        const onSubmit = vi.fn(
            () => new Promise<void>((resolve) => { resolveSave = resolve; })
        );
        render(
            <EditProfileDialog
                open
                user={student}
                onClose={vi.fn()}
                onSubmit={onSubmit}
            />
        );

        const saveButton = screen.getByRole("button", { name: /lưu thay đổi/i });
        fireEvent.click(saveButton);
        fireEvent.click(saveButton);

        expect(onSubmit).toHaveBeenCalledTimes(1);
        await act(async () => resolveSave());
    });
});
