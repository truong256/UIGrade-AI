// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    requireActor: vi.fn(),
    getProfile: vi.fn(),
    listClasses: vi.fn(),
    listAssignments: vi.fn(),
    listSubmissions: vi.fn(),
    fetchCurrentUserClient: vi.fn(),
}));

vi.mock("@/lib/current-user", () => ({
    requireActiveRequestActor: mocks.requireActor,
}));

vi.mock("@/lib/auth-client", () => ({
    fetchCurrentUserClient: mocks.fetchCurrentUserClient,
}));

vi.mock("@/services/supabase/web-mvp.supabase", () => ({
    SupabaseWebProfileService: { get: mocks.getProfile },
    SupabaseWebClassService: { list: mocks.listClasses },
    SupabaseWebAssignmentService: { list: mocks.listAssignments },
    SupabaseWebSubmissionService: { list: mocks.listSubmissions },
}));

import { GET } from "@/app/api/dashboard/overview/route";
import MyClassesPage from "@/app/ui/my_classes/page";
import { JoinClassDialog } from "@/components/my_classes/JoinClassDialog";

function jsonResponse(body: unknown, ok = true) {
    return { ok, json: async () => body };
}

describe("student dashboard and class workflow", () => {
    beforeEach(() => {
        mocks.requireActor.mockResolvedValue({
            userId: "student-1",
            email: "student@uigrade.edu.vn",
            role: "student",
        });
        mocks.getProfile.mockResolvedValue({ name: "Sinh viên mẫu" });
        mocks.listClasses.mockResolvedValue([]);
        mocks.listAssignments.mockResolvedValue([
            { _id: "assignment-new", latestSubmission: null },
            {
                _id: "assignment-draft",
                latestSubmission: { _id: "draft-1", status: "draft" },
            },
            {
                _id: "assignment-submitted",
                latestSubmission: { _id: "submission-1", status: "submitted" },
            },
        ]);
        mocks.listSubmissions.mockResolvedValue([]);
        mocks.fetchCurrentUserClient.mockResolvedValue({
            id: "student-1",
            role: "student",
        });
    });

    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it("counts a draft as needing attention instead of completed", async () => {
        const response = await GET(
            new Request("http://localhost/api/dashboard/overview?range=7")
        );
        const body = await response.json();

        expect(body.data.stats.completionRate.current).toBe(33);
        expect(body.data.stats.needsAttention.current).toBe(2);
    });

    it("sends only one join request when the form is submitted twice", async () => {
        let resolveJoin!: (response: ReturnType<typeof jsonResponse>) => void;
        const joinResponse = new Promise<ReturnType<typeof jsonResponse>>((resolve) => {
            resolveJoin = resolve;
        });
        const fetchMock = vi.fn(() => joinResponse);
        vi.stubGlobal("fetch", fetchMock);

        render(<JoinClassDialog open onClose={vi.fn()} />);
        fireEvent.change(screen.getByLabelText(/mã tham gia lớp học/i), {
            target: { value: "student-01" },
        });
        const form = screen.getByRole("button", { name: /ghi danh vào lớp/i }).closest("form");
        expect(form).not.toBeNull();

        fireEvent.submit(form!);
        fireEvent.submit(form!);

        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
        resolveJoin(jsonResponse({ data: { membershipStatus: "pending" } }));
    });

    it("shows the join action only to students", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({ data: [] })));
        const { unmount } = render(<MyClassesPage />);

        expect(
            await screen.findByRole("button", { name: /tham gia bằng mã/i })
        ).toBeTruthy();
        unmount();

        mocks.fetchCurrentUserClient.mockResolvedValue({ id: "admin-1", role: "admin" });
        render(<MyClassesPage />);

        await waitFor(() => {
            expect(
                screen.queryByRole("button", { name: /tham gia bằng mã/i })
            ).toBeNull();
        });
    });
});
