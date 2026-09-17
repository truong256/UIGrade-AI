// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { ClassesHeader } from "@/components/my_classes/ClassesHeader";
import AssignmentListHeader from "@/components/assignment_list/AssignmentListHeader";
import {
    clearCurrentUserCache,
    fetchCurrentUserClient,
} from "@/lib/auth-client";

describe("lecturer role UI boundary", () => {
    beforeEach(() => {
        clearCurrentUserCache();
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
        clearCurrentUserCache();
    });

    it("normalizes a historical teacher profile before it reaches UI state", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                user: {
                    id: "lecturer-1",
                    email: "teacher@uigrade.edu.vn",
                    role: "teacher",
                },
            }),
        }));

        await expect(fetchCurrentUserClient()).resolves.toMatchObject({
            id: "lecturer-1",
            role: "lecturer",
        });
    });

    it("shows class and assignment creation to the canonical lecturer", () => {
        const { unmount } = render(
            <ClassesHeader role="lecturer" onOpenAddModal={() => undefined} />
        );
        expect(screen.getByRole("button", { name: /tạo lớp mới/i })).toBeTruthy();
        unmount();

        render(<AssignmentListHeader role="lecturer" />);
        expect(
            screen.getByRole("link", { name: /tạo bài tập mới/i }).getAttribute("href")
        ).toBe("/ui/create_assignment");
    });

    it("does not grant creation controls to an unnormalized legacy role", () => {
        const { unmount } = render(
            <ClassesHeader
                role={"teacher" as never}
                onOpenAddModal={() => undefined}
            />
        );
        expect(screen.queryByRole("button", { name: /tạo lớp mới/i })).toBeNull();
        unmount();

        render(<AssignmentListHeader role={"teacher" as never} />);
        expect(screen.queryByRole("link", { name: /tạo bài tập mới/i })).toBeNull();
    });
});
