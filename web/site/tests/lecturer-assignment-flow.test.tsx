// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { extractAssignmentPayload } from "@/validations/assignment.validation";

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

import LegacyCreateAssignmentPage from "@/app/ui/server_config/create_assignment/page";
import AssignmentFormPage from "@/components/assignments/AssignmentFormPage";
import AssignmentListPage from "@/app/ui/assignment_list/page";

function validAssignmentForm() {
    const form = new FormData();
    form.set("title", "Bài Compose");
    form.set("classroomId", "786b49e6-8929-46a7-81f2-0c26b8b30a3a");
    form.set("description", "Xây dựng giao diện Android Compose");
    form.set(
        "rubric",
        JSON.stringify([
            {
                code: "ui",
                title: "Giao diện",
                description: "Khớp thiết kế",
                maxPoints: 10,
                gradingSource: "ai",
                requiredEvidence: [],
                passThreshold: null,
                notes: "",
            },
        ])
    );
    form.set("startAt", "2026-09-20T10:00:00.000Z");
    form.set("dueAt", "2026-09-21T10:00:00.000Z");
    form.set("maxScore", "10");
    return form;
}

describe("lecturer assignment lifecycle", () => {
    beforeEach(() => {
        mocks.fetchCurrentUserClient.mockResolvedValue({
            id: "lecturer-1",
            role: "lecturer",
        });
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => ({ data: [] }),
            })
        );
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
        vi.unstubAllGlobals();
    });

    it("redirects the legacy server-config URL to the canonical lecturer route", () => {
        render(<LegacyCreateAssignmentPage />);

        expect(mocks.redirect).toHaveBeenCalledWith("/ui/create_assignment");
    });

    it("rejects a due date that is not after the start date", () => {
        const form = validAssignmentForm();
        form.set("dueAt", "2026-09-20T09:00:00.000Z");

        expect(() => extractAssignmentPayload(form)).toThrow(/hạn nộp phải sau/i);
    });

    it("keeps an invalid schedule on the form without sending a create request", async () => {
        const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);

            if (url === "/api/classes") {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({
                        data: [
                            {
                                _id: "786b49e6-8929-46a7-81f2-0c26b8b30a3a",
                                name: "Lớp Compose",
                                code: "COMPOSE-01",
                            },
                        ],
                    }),
                });
            }

            if (url === "/api/rubric/parse") {
                return Promise.resolve({
                    ok: false,
                    json: async () => ({ message: "Không dùng parser trong kiểm thử" }),
                });
            }

            if (url === "/api/assignments" && init?.method === "POST") {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ data: { _id: "assignment-1" } }),
                });
            }

            throw new Error(`Unexpected request: ${init?.method || "GET"} ${url}`);
        });
        vi.stubGlobal("fetch", fetchMock);

        const { container } = render(<AssignmentFormPage />);
        await screen.findByText("Tạo bài tập");

        const dateInputs = Array.from(
            container.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]')
        );
        expect(dateInputs).toHaveLength(2);
        fireEvent.change(
            screen.getByRole("textbox", { name: /^tên bài tập$/i }),
            { target: { value: "Bài Compose" } }
        );
        fireEvent.change(
            screen.getByPlaceholderText(
                "Mô tả yêu cầu, cấu trúc project, đầu vào đầu ra, quy ước đặt tên file..."
            ),
            { target: { value: "Xây dựng giao diện Compose" } }
        );
        fireEvent.change(dateInputs[0], { target: { value: "2026-09-20T10:00" } });
        fireEvent.change(dateInputs[1], { target: { value: "2026-09-20T09:00" } });
        fireEvent.click(screen.getByText("Tạo và công bố bài tập").closest("button")!);

        expect(await screen.findByText(/hạn nộp phải sau/i)).toBeTruthy();
        await waitFor(() => {
            expect(
                fetchMock.mock.calls.filter(
                    ([input, init]) =>
                        String(input) === "/api/assignments" &&
                        (init as RequestInit | undefined)?.method === "POST"
                )
            ).toHaveLength(0);
        });
        expect(dateInputs[0].value).toBe("2026-09-20T10:00");
        expect(dateInputs[1].value).toBe("2026-09-20T09:00");
    });

    it("allows only one assignment deletion at a time", async () => {
        const assignments = ["assignment-1", "assignment-2"].map((id, index) => ({
            _id: id,
            title: `Bài tập ${index + 1}`,
            description: "Bài tập kiểm thử",
            status: "published",
            displayStatus: "published",
            startAt: "2026-09-20T10:00:00.000Z",
            dueAt: "2026-09-21T10:00:00.000Z",
            maxScore: 10,
            classroom: {
                _id: "786b49e6-8929-46a7-81f2-0c26b8b30a3a",
                name: "Lớp Compose",
                code: "COMPOSE-01",
            },
        }));
        const pendingDelete = new Promise(() => undefined);
        vi.stubGlobal("confirm", vi.fn(() => true));

        const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            const method = init?.method || "GET";

            if (url === "/api/assignments" && method === "GET") {
                return Promise.resolve({ ok: true, json: async () => ({ data: assignments }) });
            }

            if (url === "/api/classes" && method === "GET") {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ data: [assignments[0].classroom] }),
                });
            }

            if (url.startsWith("/api/assignments/") && method === "DELETE") {
                return pendingDelete;
            }

            throw new Error(`Unexpected request: ${method} ${url}`);
        });
        vi.stubGlobal("fetch", fetchMock);

        render(<AssignmentListPage />);
        await screen.findByText("Bài tập 1");

        const menuButtons = screen.getAllByRole("button", {
            name: /tùy chọn bài tập/i,
        });
        fireEvent.click(menuButtons[0]);
        fireEvent.click(screen.getByText("Xóa").closest("button")!);
        fireEvent.click(menuButtons[1]);
        expect(screen.queryByText("Xóa")).toBeNull();

        await waitFor(() => {
            expect(
                fetchMock.mock.calls.filter(
                    ([input, init]) =>
                        String(input).startsWith("/api/assignments/") &&
                        (init as RequestInit | undefined)?.method === "DELETE"
                )
            ).toHaveLength(1);
        });
    });
});
