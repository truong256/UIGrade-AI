// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    redirect: vi.fn(),
    fetchCurrentUserClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    redirect: mocks.redirect,
    useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/auth-client", () => ({
    fetchCurrentUserClient: mocks.fetchCurrentUserClient,
}));

import AssignmentFormPage from "@/components/assignments/AssignmentFormPage";

describe("Assignment creation UX error presentation", () => {
    beforeEach(() => {
        mocks.fetchCurrentUserClient.mockResolvedValue({
            id: "lecturer-1",
            role: "lecturer",
        });

        vi.stubGlobal(
            "fetch",
            vi.fn((input: RequestInfo | URL) => {
                const url = String(input);
                if (url === "/api/classes") {
                    return Promise.resolve({
                        ok: true,
                        json: async () => ({
                            data: [
                                {
                                    _id: "class-1",
                                    name: "Lớp Android",
                                    code: "AND-01",
                                },
                            ],
                        }),
                    });
                }
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ data: [] }),
                });
            })
        );
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
        vi.unstubAllGlobals();
    });

    it("displays error summary in Tóm tắt section and inline field errors on validation failure", async () => {
        render(<AssignmentFormPage />);
        await screen.findByText("Tạo bài tập");

        // Submit without filling title or description
        const submitBtn = screen.getByText("Tạo và công bố bài tập").closest("button")!;
        fireEvent.click(submitBtn);

        // 1. Check Error Summary Card in Tóm tắt and inline field error (both exist)
        expect(await screen.findByText("Không thể tạo bài tập")).toBeTruthy();
        expect(screen.getAllByText("Tên bài tập phải có ít nhất 3 ký tự.")).toHaveLength(2);
        expect(screen.getAllByText("Mô tả bài tập phải có ít nhất 3 ký tự.")).toHaveLength(2);

        // 2. Typing valid title removes its inline error
        fireEvent.change(screen.getByRole("textbox", { name: /^tên bài tập$/i }), {
            target: { value: "Bài tập Android Compose" },
        });

        // Submit again - title errors should be gone from both places
        fireEvent.click(submitBtn);
        expect(screen.queryByText("Tên bài tập phải có ít nhất 3 ký tự.")).toBeNull();
        expect(screen.getAllByText("Mô tả bài tập phải có ít nhất 3 ký tự.")).toHaveLength(2);
    });
});
