import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    profile: { role: "lecturer", status: "active" } as Record<string, unknown>,
    submission: {} as Record<string, unknown>,
    createSignedUrl: vi.fn(),
    generateAiFeedback: vi.fn(),
    buildGradingContext: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
    createSupabaseServerClient: vi.fn(async () => ({
        auth: {
            getUser: vi.fn(async () => ({
                data: { user: { id: "lecturer-1" } },
                error: null,
            })),
        },
        from: (table: string) => ({
            select: () => ({
                eq: () => ({
                    maybeSingle: vi.fn(async () => ({
                        data: table === "profiles" ? mocks.profile : mocks.submission,
                        error: null,
                    })),
                }),
            }),
        }),
        storage: {
            from: () => ({ createSignedUrl: mocks.createSignedUrl }),
        },
    })),
}));

vi.mock("@/services/gemini.service", () => ({
    generateAiFeedback: mocks.generateAiFeedback,
}));

vi.mock("@/services/grading-context.service", () => ({
    buildGradingContext: mocks.buildGradingContext,
}));

import { SupabaseGradingService } from "@/services/supabase/grading.supabase";

const assignment = {
    id: "assignment-1",
    lecturer_id: "lecturer-1",
    max_score: 10,
    rubric: [{ code: "ui", title: "UI", maxPoints: 10 }],
};

function submission(overrides: Record<string, unknown> = {}) {
    return {
        id: "submission-1",
        assignment_id: "assignment-1",
        student_id: "student-1",
        source_zip_url: "student-1/assignment-1/source.zip",
        files: [],
        assignment,
        grade: null,
        ...overrides,
    };
}

describe("Supabase grading service boundaries", () => {
    beforeEach(() => {
        mocks.profile = { role: "lecturer", status: "active" };
        mocks.submission = submission();
        mocks.createSignedUrl.mockReset().mockResolvedValue({
            data: { signedUrl: "https://signed.example/file" },
            error: null,
        });
        mocks.generateAiFeedback.mockReset();
        mocks.buildGradingContext.mockReset();
    });

    it("signs only a file belonging to the selected student and assignment", async () => {
        await expect(SupabaseGradingService.getSubmissionFileUrl("submission-1", "source"))
            .resolves.toBe("https://signed.example/file");
        expect(mocks.createSignedUrl).toHaveBeenCalledWith(
            "student-1/assignment-1/source.zip",
            600
        );
    });

    it("rejects an external file URL before asking Storage to sign it", async () => {
        mocks.submission = submission({ source_zip_url: "https://files.example.com/source.zip" });
        await expect(SupabaseGradingService.getSubmissionFileUrl("submission-1", "source"))
            .rejects.toThrow("Supabase Storage của dự án");
        expect(mocks.createSignedUrl).not.toHaveBeenCalled();
    });

    it("rejects a Storage object owned by another submission", async () => {
        mocks.submission = submission({ source_zip_url: "student-2/assignment-1/source.zip" });
        await expect(SupabaseGradingService.getSubmissionFileUrl("submission-1", "source"))
            .rejects.toThrow("không thuộc bài nộp");
        expect(mocks.createSignedUrl).not.toHaveBeenCalled();
    });

    it("does not regenerate AI data after a grade is published", async () => {
        mocks.submission = submission({
            grade: {
                id: "grade-1",
                status: "published",
                score: 8,
                max_score: 10,
                rubric_breakdown: [],
            },
        });
        await expect(SupabaseGradingService.generateAiSuggestion("submission-1"))
            .rejects.toThrow("Gợi ý AI đã khóa");
        expect(mocks.buildGradingContext).not.toHaveBeenCalled();
        expect(mocks.generateAiFeedback).not.toHaveBeenCalled();
    });
});
