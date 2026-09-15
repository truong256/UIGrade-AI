// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    replace: vi.fn(),
    searchParams: new URLSearchParams("assignmentId=assignment-1"),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({ replace: mocks.replace }),
    usePathname: () => "/ui/grading_detail",
    useSearchParams: () => mocks.searchParams,
}));

import { useGradingDetail } from "@/app/ui/grading_detail/hook/use_Grading_detail";

const assignment = {
    _id: "assignment-1",
    title: "Bài Compose",
    maxScore: 10,
    classroom: { _id: "class-1", name: "Lớp Compose", code: "COMPOSE-01" },
    rubric: [
        {
            code: "ui",
            title: "Giao diện",
            description: "Khớp thiết kế",
            maxPoints: 10,
        },
    ],
};

const student = {
    _id: "student-1",
    name: "Sinh viên mẫu",
    email: "student@uigrade.edu.vn",
    studentCode: "SV001",
};

function response(data: unknown, message?: string) {
    return {
        ok: true,
        json: async () => ({ success: true, data, message }),
    };
}

function baseFetch(options?: { published?: boolean; publishResponse?: Promise<unknown> }) {
    return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);

        if (url === "/api/grading/assignments") {
            return Promise.resolve(response({ canGrade: true, items: [assignment] }));
        }

        if (url === "/api/grading/assignments/assignment-1/submissions") {
            return Promise.resolve(
                response({
                    assignment,
                    students: [
                        {
                            _id: "membership-1",
                            userId: student,
                            roleInClass: "student",
                        },
                    ],
                    submissions: [
                        {
                            _id: "submission-1",
                            studentId: student,
                            gradeStatus: options?.published ? "published" : "pending",
                            status: "submitted",
                        },
                    ],
                })
            );
        }

        if (url === "/api/grading/submissions/submission-1") {
            return Promise.resolve(
                response({
                    assignment,
                    marker: "current",
                    grade: options?.published
                        ? {
                            status: "published",
                            score: 10,
                            rubricBreakdown: [
                                { criterionCode: "ui", awardedPoints: 10 },
                            ],
                        }
                        : null,
                })
            );
        }

        if (url === "/api/grading/submissions/submission-1/history") {
            return Promise.resolve(response([]));
        }

        if (
            url === "/api/grading/submissions/submission-1/publish" &&
            init?.method === "POST"
        ) {
            return options?.publishResponse || Promise.resolve(response({}, "Đã công bố"));
        }

        if (
            url === "/api/grading/submissions/submission-1/draft" &&
            init?.method === "PUT"
        ) {
            return Promise.resolve(response({}, "Đã lưu nháp"));
        }

        throw new Error(`Unexpected request: ${init?.method || "GET"} ${url}`);
    });
}

async function readyHook(fetchMock: ReturnType<typeof vi.fn>) {
    vi.stubGlobal("fetch", fetchMock);
    const hook = renderHook(() => useGradingDetail());
    await waitFor(() => expect(hook.result.current.selectedSubmissionId).toBe("submission-1"));
    return hook;
}

describe("lecturer grading state machine", () => {
    beforeEach(() => {
        mocks.searchParams = new URLSearchParams("assignmentId=assignment-1");
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
        vi.unstubAllGlobals();
    });

    it("rejects a criterion score above its maximum before publishing", async () => {
        const fetchMock = baseFetch();
        const hook = await readyHook(fetchMock);

        act(() => hook.result.current.setCriterionScores({ ui: "11" }));
        await act(async () => hook.result.current.handlePublish());

        expect(hook.result.current.error).toMatch(/phải từ 0 đến 10/i);
        expect(
            fetchMock.mock.calls.filter(
                ([input, init]) =>
                    String(input).endsWith("/publish") &&
                    (init as RequestInit | undefined)?.method === "POST"
            )
        ).toHaveLength(0);
    });

    it("emits one publish request while the first publish is pending", async () => {
        const pendingPublish = new Promise(() => undefined);
        const fetchMock = baseFetch({ publishResponse: pendingPublish });
        const hook = await readyHook(fetchMock);

        act(() => hook.result.current.setCriterionScores({ ui: "10" }));
        act(() => {
            void hook.result.current.handlePublish();
            void hook.result.current.handlePublish();
        });

        await waitFor(() => {
            expect(
                fetchMock.mock.calls.filter(
                    ([input, init]) =>
                        String(input).endsWith("/publish") &&
                        (init as RequestInit | undefined)?.method === "POST"
                )
            ).toHaveLength(1);
        });
    });

    it("does not write a draft after the grade is published", async () => {
        const fetchMock = baseFetch({ published: true });
        const hook = await readyHook(fetchMock);

        await act(async () => hook.result.current.handleSaveDraft());

        expect(
            fetchMock.mock.calls.filter(
                ([input, init]) =>
                    String(input).endsWith("/draft") &&
                    (init as RequestInit | undefined)?.method === "PUT"
            )
        ).toHaveLength(0);
    });

    it("ignores a stale submission detail response", async () => {
        let resolveStale!: (value: unknown) => void;
        const staleDetail = new Promise((resolve) => {
            resolveStale = resolve;
        });
        const fallbackFetch = baseFetch();
        const fetchMock = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
            const url = String(input);

            if (url === "/api/grading/submissions/submission-2") {
                return staleDetail;
            }
            if (url === "/api/grading/submissions/submission-2/history") {
                return Promise.resolve(response([]));
            }
            return fallbackFetch(input, init);
        });
        const hook = await readyHook(fetchMock);

        let staleRequest!: Promise<void>;
        act(() => {
            staleRequest = hook.result.current.loadDetail(
                "assignment-1",
                "student-2",
                "submission-2"
            );
        });
        await act(async () => {
            await hook.result.current.loadDetail(
                "assignment-1",
                "student-1",
                "submission-1"
            );
        });
        await act(async () => {
            resolveStale(response({ assignment, marker: "stale", grade: null }));
            await staleRequest;
        });

        expect(hook.result.current.selectedStudentId).toBe("student-1");
        expect(hook.result.current.detail?.marker).toBe("current");
    });
});
