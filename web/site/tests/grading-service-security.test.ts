// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    userId: "lecturer-1",
    profile: { role: "lecturer", status: "active" } as Record<string, unknown>,
    submission: {} as Record<string, unknown>,
    createSignedUrl: vi.fn(),
    download: vi.fn(),
    upsert: vi.fn(),
    generateAiFeedback: vi.fn(),
    buildGradingContext: vi.fn(),
    generateAiGradingRecommendation: vi.fn(),
    extractSubmissionEvidence: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
    createSupabaseServerClient: vi.fn(async () => ({
        auth: {
            getUser: vi.fn(async () => ({
                data: { user: { id: mocks.userId } },
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
            upsert: (...args: unknown[]) => {
                mocks.upsert(table, ...args);
                return Promise.resolve({ error: null });
            },
        }),
        storage: {
            from: () => ({ createSignedUrl: mocks.createSignedUrl, download: mocks.download }),
        },
    })),
}));

vi.mock("@/services/gemini.service", () => ({
    generateAiFeedback: mocks.generateAiFeedback,
}));

vi.mock("@/services/grading-context.service", () => ({
    buildGradingContext: mocks.buildGradingContext,
}));

vi.mock("@/services/ai-grading-v2.service", () => ({
    generateAiGradingRecommendation: mocks.generateAiGradingRecommendation,
}));

vi.mock("@/services/grading-evidence.service", () => ({
    extractSubmissionEvidence: mocks.extractSubmissionEvidence,
}));

import { SupabaseGradingService } from "@/services/supabase/grading.supabase";
import { resetAiGenerationRateLimitForTests } from "@/lib/ai-grading-rate-limit";

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
        mocks.userId = "lecturer-1";
        mocks.profile = { role: "lecturer", status: "active" };
        mocks.submission = submission();
        mocks.createSignedUrl.mockReset().mockResolvedValue({
            data: { signedUrl: "https://signed.example/file" },
            error: null,
        });
        mocks.download.mockReset().mockResolvedValue({ data: null, error: { message: "missing" } });
        mocks.upsert.mockReset();
        mocks.generateAiFeedback.mockReset();
        mocks.buildGradingContext.mockReset();
        mocks.extractSubmissionEvidence.mockReset().mockReturnValue({ assignment: { rubric: assignment.rubric } });
        mocks.generateAiGradingRecommendation.mockReset().mockResolvedValue({
            summary: "suggestion",
            metadata: {
                provider: "gemini",
                model: "gemini-2.5-flash",
                promptVersion: "v2.0",
                schemaVersion: "v2",
                contentHash: "hash",
                submissionVersion: "2026-09-10T10:00:00.000Z",
                assignmentVersion: "2026-09-10T09:00:00.000Z",
                generatedAt: "2026-09-10T12:00:00.000Z",
            },
        });
        resetAiGenerationRateLimitForTests();
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

    it("denies AI generation to students", async () => {
        mocks.userId = "student-1";
        mocks.profile = { role: "student", status: "active" };
        await expect(SupabaseGradingService.generateAiSuggestion("submission-1"))
            .rejects.toThrow("Chỉ giảng viên");
    });

    it("never returns internal AI analysis to a student", async () => {
        mocks.userId = "student-1";
        mocks.profile = { role: "student", status: "active" };
        mocks.submission = submission({
            grade: {
                id: "grade-1",
                status: "published",
                score: 8,
                max_score: 10,
                rubric_breakdown: [],
                ai_feedback: { summary: "internal" },
            },
        });
        const result = await SupabaseGradingService.getSubmissionDetail("submission-1");
        expect(result.grade?.aiFeedback).toBeNull();
        expect(result.finalScore).toBe(8);
    });

    it("marks an AI suggestion stale when the submission version changed", async () => {
        mocks.submission = submission({
            updated_at: "2026-09-10T12:00:00.000Z",
            ai_suggestion: {
                suggestion: {
                    summary: "old",
                    metadata: { submissionVersion: "2026-09-10T11:00:00.000Z", stale: false },
                },
            },
            grade: {
                id: "grade-1",
                status: "draft",
                score: 0,
                max_score: 10,
                rubric_breakdown: [],
            },
        });
        const result = await SupabaseGradingService.getSubmissionDetail("submission-1");
        const feedback = result.grade?.aiFeedback as unknown as { metadata: { stale: boolean } };
        expect(feedback.metadata.stale).toBe(true);
    });

    it("denies AI generation to an inactive lecturer", async () => {
        mocks.profile = { role: "lecturer", status: "pending" };
        await expect(SupabaseGradingService.generateAiSuggestion("submission-1"))
            .rejects.toThrow("không có quyền truy cập");
    });

    it("denies AI generation across lecturer ownership boundaries", async () => {
        mocks.submission = submission({
            assignment: { ...assignment, lecturer_id: "lecturer-2" },
        });
        await expect(SupabaseGradingService.generateAiSuggestion("submission-1"))
            .rejects.toThrow("giảng viên khác");
        expect(mocks.buildGradingContext).not.toHaveBeenCalled();
        expect(mocks.generateAiFeedback).not.toHaveBeenCalled();
    });

    it("stores AI output only in the isolated suggestion table", async () => {
        await expect(SupabaseGradingService.generateAiSuggestion("submission-1"))
            .resolves.toMatchObject({ summary: "suggestion" });
        expect(mocks.generateAiGradingRecommendation).toHaveBeenCalledOnce();
        expect(mocks.upsert).toHaveBeenCalledWith(
            "ai_grading_suggestions",
            expect.objectContaining({
                submission_id: "submission-1",
                lecturer_id: "lecturer-1",
                suggestion: expect.objectContaining({ summary: "suggestion" }),
            }),
            { onConflict: "submission_id" }
        );
        expect(mocks.upsert).not.toHaveBeenCalledWith("grades", expect.anything(), expect.anything());
    });
});
