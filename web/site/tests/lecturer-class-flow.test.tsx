// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    fetchCurrentUserClient: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
    fetchCurrentUserClient: mocks.fetchCurrentUserClient,
}));

import MyClassesPage from "@/app/ui/my_classes/page";
import { ClassDetailDialog } from "@/components/my_classes/ClassDetailDialog";

const classroom = {
    _id: "class-1",
    name: "Lập trình Android",
    code: "ANDROID-01",
    description: "Lớp kiểm thử",
    semester: "HK1" as const,
    academicYear: "2026-2027",
    status: "active" as const,
    approvedStudentCount: 3,
};

function jsonResponse(body: unknown, ok = true) {
    return {
        ok,
        json: async () => body,
    };
}

describe("lecturer class workflow", () => {
    beforeEach(() => {
        mocks.fetchCurrentUserClient.mockResolvedValue({
            id: "lecturer-1",
            email: "teacher@uigrade.edu.vn",
            role: "lecturer",
        });
        vi.stubGlobal("confirm", vi.fn(() => true));
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("prevents duplicate class creation while the first request is pending", async () => {
        let resolveCreate!: (response: ReturnType<typeof jsonResponse>) => void;
        const createResponse = new Promise<ReturnType<typeof jsonResponse>>((resolve) => {
            resolveCreate = resolve;
        });

        const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            const method = init?.method || "GET";

            if (url === "/api/classes" && method === "GET") {
                return Promise.resolve(jsonResponse({ data: [] }));
            }

            if (url === "/api/classes" && method === "POST") {
                return createResponse;
            }

            throw new Error(`Unexpected request: ${method} ${url}`);
        });
        vi.stubGlobal("fetch", fetchMock);

        render(<MyClassesPage />);

        await screen.findByText("Tạo Lớp học mới");
        fireEvent.change(
            screen.getByPlaceholderText("VD: Lập trình Android Nâng cao - L01"),
            { target: { value: "Lớp Compose" } }
        );
        fireEvent.change(screen.getByPlaceholderText("VD: ANDR2026-L01"), {
            target: { value: "COMPOSE-01" },
        });

        const createButton = screen.getByText("Tạo lớp ngay").closest("button");
        expect(createButton).not.toBeNull();
        fireEvent.click(createButton!);
        fireEvent.click(createButton!);

        await waitFor(() => {
            const createRequests = fetchMock.mock.calls.filter(
                ([input, init]) =>
                    String(input) === "/api/classes" &&
                    (init as RequestInit | undefined)?.method === "POST"
            );
            expect(createRequests).toHaveLength(1);
        });

        await act(async () => {
            resolveCreate(jsonResponse({ data: classroom }));
        });
        expect((await screen.findByRole("status")).textContent).toContain(
            "Đã tạo lớp học"
        );
    });

    it("sends one delete request and confirms success when the lecturer clicks twice", async () => {
        let resolveDelete!: (response: ReturnType<typeof jsonResponse>) => void;
        const deleteResponse = new Promise<ReturnType<typeof jsonResponse>>((resolve) => {
            resolveDelete = resolve;
        });
        let classListRequests = 0;

        const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            const method = init?.method || "GET";

            if (url === "/api/classes" && method === "GET") {
                classListRequests += 1;
                return Promise.resolve(
                    jsonResponse({ data: classListRequests === 1 ? [classroom] : [] })
                );
            }

            if (url === "/api/classes/class-1/stats") {
                return Promise.resolve(jsonResponse({ activeStudentCount: 3 }));
            }

            if (url === "/api/classes/class-1" && method === "DELETE") {
                return deleteResponse;
            }

            throw new Error(`Unexpected request: ${method} ${url}`);
        });
        vi.stubGlobal("fetch", fetchMock);

        render(<MyClassesPage />);

        await screen.findByText("Lập trình Android");
        fireEvent.click(
            screen.getByRole("button", { name: /mở menu quản lý lớp/i })
        );
        const deleteButton = screen.getByText("Xóa lớp").closest("button");
        expect(deleteButton).not.toBeNull();
        fireEvent.click(deleteButton!);
        fireEvent.click(deleteButton!);

        await waitFor(() => {
            const deleteRequests = fetchMock.mock.calls.filter(
                ([input, init]) =>
                    String(input) === "/api/classes/class-1" &&
                    (init as RequestInit | undefined)?.method === "DELETE"
            );
            expect(deleteRequests).toHaveLength(1);
        });

        await act(async () => {
            resolveDelete(jsonResponse({ data: { _id: "class-1" } }));
        });

        expect((await screen.findByRole("status")).textContent).toContain(
            "Đã xóa lớp học"
        );
    });

    it("refreshes membership and announces a successful approval", async () => {
        let approved = false;
        const onStudentAdded = vi.fn().mockResolvedValue(undefined);
        const pendingMember = {
            _id: "membership-1",
            userId: {
                _id: "student-1",
                name: "Sinh viên chờ duyệt",
                email: "student@uigrade.edu.vn",
                studentCode: "SV001",
            },
            roleInClass: "student",
            status: "pending",
        };

        const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);
            const method = init?.method || "GET";

            if (url === "/api/classes/class-1/stats") {
                return Promise.resolve(
                    jsonResponse({ activeStudentCount: approved ? 1 : 0, canManageMembers: true })
                );
            }

            if (url === "/api/classes/class-1/students?status=active") {
                return Promise.resolve(
                    jsonResponse({ items: approved ? [{ ...pendingMember, status: "active" }] : [] })
                );
            }

            if (url === "/api/classes/class-1/students?status=pending") {
                return Promise.resolve(
                    jsonResponse({ items: approved ? [] : [pendingMember] })
                );
            }

            if (
                url === "/api/classes/class-1/students/student-1" &&
                method === "PATCH"
            ) {
                approved = true;
                return Promise.resolve(jsonResponse({ data: pendingMember }));
            }

            throw new Error(`Unexpected request: ${method} ${url}`);
        });
        vi.stubGlobal("fetch", fetchMock);

        render(
            <ClassDetailDialog
                open
                classroom={classroom}
                onClose={() => undefined}
                onStudentAdded={onStudentAdded}
            />
        );

        await screen.findByText("Sinh viên chờ duyệt");
        fireEvent.click(screen.getByText("Duyệt").closest("button")!);

        await waitFor(() => expect(onStudentAdded).toHaveBeenCalledTimes(1));
        expect((await screen.findByRole("status")).textContent).toContain(
            "Đã duyệt sinh viên"
        );
        expect(screen.getByText("Thành viên đang hoạt động")).toBeTruthy();
    });
});
