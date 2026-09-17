// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { describe, expect, it } from "vitest";
import {
    isPublishedGrade,
    normalizeAssignmentRubric,
    validateGradePayload,
} from "@/lib/grading-workflow";
import { isItemGraded, normalizeResult } from "@/app/ui/my_results/type/my_results.utils";

const rubric = [
    { code: "ui", title: "Giao diện", maxPoints: 20 },
    { code: "function", title: "Chức năng", maxPoints: 40 },
    { code: "code", title: "Code Quality", maxPoints: 20 },
    { code: "docs", title: "Tài liệu", maxPoints: 20 },
];

function grade(criteria: Array<[string, unknown]>, publish = true) {
    return validateGradePayload({
        assignmentRubric: rubric,
        assignmentMaxScore: 100,
        criteria: criteria.map(([criterionCode, awardedPoints]) => ({ criterionCode, awardedPoints })),
        lecturerFeedback: "Nhận xét chính thức",
        publish,
    });
}

describe("grading workflow validation", () => {
    it("calculates 89/100 from all rubric criteria", () => {
        const result = grade([["ui", 18], ["function", 35], ["code", 17], ["docs", 19]]);
        expect(result.score).toBe(89);
        expect(result.maxScore).toBe(100);
        expect(result.rubricBreakdown).toHaveLength(4);
    });

    it("supports zero, decimals and exact maximum values", () => {
        expect(grade([["ui", 0], ["function", 35.25], ["code", 20], ["docs", 19.5]]).score)
            .toBe(74.75);
        expect(grade([["ui", 20], ["function", 40], ["code", 20], ["docs", 20]]).score)
            .toBe(100);
    });

    it.each([
        ["negative", -1, "phải từ 0"],
        ["criterion overflow", 21, "phải từ 0"],
        ["NaN", Number.NaN, "không hợp lệ"],
        ["Infinity", Number.POSITIVE_INFINITY, "không hợp lệ"],
        ["text", "not-a-score", "không hợp lệ"],
    ])("rejects %s rubric score", (_name, value, expected) => {
        expect(() => grade([["ui", value], ["function", 40], ["code", 20], ["docs", 20]]))
            .toThrow(expected);
    });

    it("rejects an unknown or duplicate criterion", () => {
        expect(() => grade([["other", 1], ["function", 1], ["code", 1], ["docs", 1]]))
            .toThrow("không thuộc rubric");
        expect(() => grade([["ui", 1], ["ui", 2], ["code", 1], ["docs", 1]]))
            .toThrow("gửi lặp");
    });

    it("allows an incomplete draft but blocks an incomplete publish", () => {
        expect(grade([["ui", 18]], false).score).toBe(18);
        expect(() => grade([["ui", 18]], true)).toThrow("Chưa nhập điểm cho");
    });

    it("rejects a rubric total above the assignment maximum", () => {
        expect(() => validateGradePayload({
            assignmentRubric: [
                { code: "one", title: "Một", maxPoints: 80 },
                { code: "two", title: "Hai", maxPoints: 80 },
            ],
            assignmentMaxScore: 100,
            criteria: [
                { criterionCode: "one", awardedPoints: 70 },
                { criterionCode: "two", awardedPoints: 70 },
            ],
            publish: true,
        })).toThrow("vượt quá điểm tối đa");
    });

    it.each([0, 85, 100, 89.25])("supports manual score %s when no rubric exists", score => {
        expect(validateGradePayload({
            assignmentRubric: [], assignmentMaxScore: 100, manualScore: score, publish: true,
        }).score).toBe(score);
    });

    it.each([-1, 101, Number.NaN, Number.POSITIVE_INFINITY, "text", ""])(
        "rejects invalid manual score %s",
        score => {
            expect(() => validateGradePayload({
                assignmentRubric: [], assignmentMaxScore: 100, manualScore: score, publish: true,
            })).toThrow();
        }
    );

    it("rejects malformed rubric definitions", () => {
        expect(() => normalizeAssignmentRubric([
            { code: "same", title: "One", maxPoints: 10 },
            { code: "same", title: "Two", maxPoints: 10 },
        ])).toThrow("bị trùng");
        expect(() => normalizeAssignmentRubric([
            { code: "bad", title: "Bad", maxPoints: 0 },
        ])).toThrow("phải lớn hơn 0");
    });

    it("keeps AI separate from lecturer-confirmed score", () => {
        const result = grade([["ui", 18], ["function", 35], ["code", 17], ["docs", 19]]);
        expect(result).not.toHaveProperty("aiFeedback");
    });
});

describe("student result normalization", () => {
    it("shows a published result with criterion and lecturer feedback", () => {
        const result = normalizeResult({
            _id: "grade-1",
            assignmentId: "assignment-1",
            assignmentTitle: "Android UI",
            classroomName: "SE01",
            gradeStatus: "published",
            finalScore: 89,
            maxScore: 100,
            teacherComment: "Tốt",
            publishedAt: "2026-09-08T12:00:00Z",
            criterionBreakdown: [{
                title: "UI", awardedPoints: 18, maxPoints: 20, feedback: "Responsive tốt",
            }],
            aiFeedback: { summary: "Gợi ý", strengths: ["Rõ ràng"], nextSteps: ["Tối ưu"] },
        });
        expect(isItemGraded(result)).toBe(true);
        expect(result.finalScore).toBe(89);
        expect(result.criterionBreakdown[0]?.note).toBe("Responsive tốt");
        expect(result.teacherComment).toBe("Tốt");
    });

    it.each(["draft", "grading", "pending"])("never exposes %s result fields", status => {
        const result = normalizeResult({
            _id: "grade-draft",
            assignmentTitle: "Draft",
            gradeStatus: status,
            finalScore: 99,
            teacherComment: "internal",
            criterionBreakdown: [{ title: "UI", awardedPoints: 20, maxPoints: 20 }],
            aiFeedback: { summary: "internal AI" },
        });
        expect(result.finalScore).toBeNull();
        expect(result.teacherComment).toBe("");
        expect(result.aiSummary).toBe("");
        expect(result.criterionBreakdown).toEqual([]);
        expect(isItemGraded(result)).toBe(false);
        expect(isPublishedGrade(status)).toBe(false);
    });
});
