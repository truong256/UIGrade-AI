// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import type { RubricCriterion } from "@/lib/grading-contract";

const POINT_UNIT = String.raw`(?:điểm|đ|pts?|points?)`;
const POINT_NUMBER = String.raw`(\d+(?:[.,]\d+)?)`;

type PointExpression = {
    points: number;
    index: number;
};

export type RubricNormalizationResult = {
    rubric: RubricCriterion[];
    warnings: string[];
    normalized: boolean;
};

export type RubricTextFallbackResult = RubricNormalizationResult & {
    usedExplicitPoints: boolean;
    complete: boolean;
};

function slugifyCriterionCode(value: string) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "criterion";
}

export function inferRubricGradingSource(
    text: string
): RubricCriterion["gradingSource"] {
    if (/(build|test|runner|required file|readme|cấu trúc|structure|gradle|manifest)/i.test(text)) {
        return "hybrid";
    }

    return "ai";
}

export function createRubricCriterion(params: {
    title: string;
    description?: string;
    points: number;
    index: number;
    gradingSource: RubricCriterion["gradingSource"];
    code?: string;
}): RubricCriterion {
    const title = params.title.trim() || `Tiêu chí ${params.index + 1}`;

    return {
        code: String(params.code || `${slugifyCriterionCode(title)}_${params.index + 1}`),
        title,
        description: String(params.description || title).trim(),
        maxPoints: params.points,
        gradingSource: params.gradingSource,
        requiredEvidence: [],
        passThreshold: null,
        notes: "",
    };
}

function parsePointNumber(value: string) {
    const points = Number(value.replace(",", "."));
    return Number.isFinite(points) && points > 0 ? points : null;
}

function findPointExpression(line: string): PointExpression | null {
    const patterns = [
        new RegExp(
            String.raw`(?:^|\s)(?:điểm|score|points?)\s*:\s*${POINT_NUMBER}(?:\s*${POINT_UNIT})?\s*[.!]?\s*$`,
            "i"
        ),
        new RegExp(
            String.raw`\s*(?::|[-–—])\s*${POINT_NUMBER}\s*${POINT_UNIT}\s*[.!]?\s*$`,
            "i"
        ),
        new RegExp(
            String.raw`\(\s*${POINT_NUMBER}\s*${POINT_UNIT}\s*\)\s*:?\s*$`,
            "i"
        ),
        new RegExp(
            String.raw`(?:^|\s)${POINT_NUMBER}\s*${POINT_UNIT}\s*[.!]?\s*$`,
            "i"
        ),
    ];

    for (const pattern of patterns) {
        const match = line.match(pattern);
        const points = match?.[1] ? parsePointNumber(match[1]) : null;
        if (match && points !== null) {
            return { points, index: match.index ?? 0 };
        }
    }

    return null;
}

export function isTotalMetadataLine(line: string) {
    return new RegExp(
        String.raw`^(?:tổng(?:\s+điểm)?|total(?:\s+points?)?)\s*[:\-]?\s*\d+(?:[.,]\d+)?(?:\s*${POINT_UNIT})?\s*[.!]?\s*$`,
        "i"
    ).test(line.trim());
}

export function isRubricTotalMetadata(title: string, description = "") {
    const totalLabel = /^(?:tổng(?:\s+điểm)?|total(?:\s+points?)?)$/i;
    return (
        totalLabel.test(title.trim()) ||
        isTotalMetadataLine(title) ||
        isTotalMetadataLine(description)
    );
}

function cleanCriterionTitle(value: string) {
    return value
        .replace(/^\s*(?:\d+|[a-z])\s*[.)]\s*/i, "")
        .replace(/^[-:–—•\s]+|[-:–—•\s]+$/g, "")
        .trim();
}

function stripListPrefix(value: string) {
    return value
        .replace(/^\s*(?:[-–—•*]\s+|(?:\d+|[a-z])\s*[.)]\s+)/i, "")
        .trim();
}

function round2(value: number) {
    return Number(value.toFixed(2));
}

export function normalizeRubricTotal(
    rubric: RubricCriterion[],
    expectedMaxScore: number
): RubricNormalizationResult {
    if (!rubric.length) {
        return { rubric, warnings: [], normalized: false };
    }

    const total = rubric.reduce((sum, item) => sum + Number(item.maxPoints), 0);
    const hasValidPoints = rubric.every(
        (item) => Number.isFinite(item.maxPoints) && item.maxPoints > 0
    );

    if (
        !hasValidPoints ||
        !Number.isFinite(total) ||
        total <= 0 ||
        !Number.isFinite(expectedMaxScore) ||
        expectedMaxScore <= 0 ||
        Math.abs(total - expectedMaxScore) < 0.001
    ) {
        return { rubric, warnings: [], normalized: false };
    }

    const factor = expectedMaxScore / total;
    const scaled = rubric.map((item) => ({
        ...item,
        maxPoints: round2(item.maxPoints * factor),
    }));
    const scaledTotal = scaled.reduce((sum, item) => sum + item.maxPoints, 0);
    const delta = round2(expectedMaxScore - scaledTotal);
    scaled[scaled.length - 1].maxPoints = round2(
        scaled[scaled.length - 1].maxPoints + delta
    );

    return {
        rubric: scaled,
        warnings: [
            `Tổng điểm rubric được chuẩn hóa từ ${round2(total)} thành ${round2(expectedMaxScore)}.`,
        ],
        normalized: true,
    };
}

export function parseRubricTextFallback(
    rubricText: string,
    maxScore: number
): RubricTextFallbackResult {
    const rawLines = rubricText
        .split(/\n|;/g)
        .map((line) => line.trim())
        .filter(Boolean);
    const criteria: RubricCriterion[] = [];
    let currentQuestion = "";
    let awaitingQuestionDescription = false;
    let unparsedLineCount = 0;

    for (let index = 0; index < rawLines.length; index++) {
        const line = rawLines[index];
        if (isTotalMetadataLine(stripListPrefix(line))) continue;

        const questionMatch = line.match(
            new RegExp(
                String.raw`^câu\s*(\d+)\s*\(\s*${POINT_NUMBER}\s*${POINT_UNIT}\s*\)\s*:?\s*$`,
                "i"
            )
        );
        const followingLines = rawLines.slice(index + 1);
        const nextQuestionOffset = followingLines.findIndex((candidate) =>
            /^câu\s*\d+\b/i.test(candidate)
        );
        const currentQuestionLines = nextQuestionOffset === -1
            ? followingLines
            : followingLines.slice(0, nextQuestionOffset);
        const hasFollowingSubCriterion = currentQuestionLines
            .some((candidate) => /^[a-z]\s*[.)]+\s*\(\s*\d+(?:[.,]\d+)?\s*(?:điểm|đ|pts?|points?)\s*\)/i.test(candidate));
        if (questionMatch && hasFollowingSubCriterion) {
            currentQuestion = `Câu ${questionMatch[1]}`;
            awaitingQuestionDescription = false;
            continue;
        }

        const questionPoints = questionMatch?.[2]
            ? parsePointNumber(questionMatch[2])
            : null;
        if (questionMatch && questionPoints !== null) {
            const title = `Câu ${questionMatch[1]}`;
            criteria.push(
                createRubricCriterion({
                    title,
                    description: title,
                    points: questionPoints,
                    index: criteria.length,
                    gradingSource: "manual",
                })
            );
            currentQuestion = title;
            awaitingQuestionDescription = true;
            continue;
        }

        const subCriterionMatch = line.match(
            new RegExp(
                String.raw`^([a-z])\s*[.)]+\s*\(\s*${POINT_NUMBER}\s*${POINT_UNIT}\s*\)\s*(.+)$`,
                "i"
            )
        );
        const subCriterionPoints = subCriterionMatch?.[2]
            ? parsePointNumber(subCriterionMatch[2])
            : null;
        if (subCriterionMatch && subCriterionPoints !== null) {
            criteria.push(
                createRubricCriterion({
                    title: currentQuestion
                        ? `${currentQuestion} - ${subCriterionMatch[1].toLowerCase()}`
                        : cleanCriterionTitle(subCriterionMatch[3]),
                    description: subCriterionMatch[3].trim(),
                    points: subCriterionPoints,
                    index: criteria.length,
                    gradingSource: "manual",
                })
            );
            awaitingQuestionDescription = false;
            continue;
        }

        const parenthesizedMatch = line.match(
            new RegExp(
                String.raw`^(.+?)\s*\(\s*${POINT_NUMBER}\s*${POINT_UNIT}\s*\)\s*:?\s*(.*)$`,
                "i"
            )
        );
        const parenthesizedPoints = parenthesizedMatch?.[2]
            ? parsePointNumber(parenthesizedMatch[2])
            : null;
        if (parenthesizedMatch && parenthesizedPoints !== null) {
            const title = cleanCriterionTitle(parenthesizedMatch[1]);
            const trailingDescription = parenthesizedMatch[3].trim();
            criteria.push(
                createRubricCriterion({
                    title,
                    description: trailingDescription || title,
                    points: parenthesizedPoints,
                    index: criteria.length,
                    gradingSource: "manual",
                })
            );
            awaitingQuestionDescription = false;
            continue;
        }

        const pointExpression = findPointExpression(line);
        if (!pointExpression) {
            const nextLine = rawLines[index + 1] || "";
            const introducesSubCriteria =
                /^hoàn thành các yêu cầu/i.test(line) &&
                /^[a-z]\s*[.)]+\s*\(/i.test(nextLine);
            if (introducesSubCriteria) continue;

            if (awaitingQuestionDescription && criteria.length) {
                const lastIndex = criteria.length - 1;
                criteria[lastIndex] = {
                    ...criteria[lastIndex],
                    description: line,
                };
                awaitingQuestionDescription = false;
                continue;
            }

            unparsedLineCount += 1;
            continue;
        }

        const withoutPoints = line.slice(0, pointExpression.index);
        const itemMarker = withoutPoints.match(/^\s*([a-z])\s*[.)]/i)?.[1];
        const cleanedTitle = cleanCriterionTitle(withoutPoints);
        const title = currentQuestion && itemMarker
            ? `${currentQuestion} - ${itemMarker.toLowerCase()}`
            : cleanedTitle || `Tiêu chí ${criteria.length + 1}`;

        criteria.push(
            createRubricCriterion({
                title,
                description: cleanedTitle || line,
                points: pointExpression.points,
                index: criteria.length,
                gradingSource: "manual",
            })
        );
        awaitingQuestionDescription = false;
    }

    if (!criteria.length) {
        return {
            rubric: [
                createRubricCriterion({
                    title: "Chấm tổng thể",
                    description: rubricText.trim() || "Chấm tổng thể theo yêu cầu bài tập.",
                    points: maxScore,
                    index: 0,
                    gradingSource: "manual",
                    code: "overall",
                }),
            ],
            warnings: [],
            normalized: false,
            usedExplicitPoints: false,
            complete: false,
        };
    }

    if (unparsedLineCount > 0) {
        return {
            rubric: criteria,
            warnings: [
                "Một số dòng rubric chưa có biểu thức điểm rõ ràng nên không tự động chuẩn hóa tổng điểm.",
            ],
            normalized: false,
            usedExplicitPoints: true,
            complete: false,
        };
    }

    return {
        ...normalizeRubricTotal(criteria, maxScore),
        usedExplicitPoints: true,
        complete: true,
    };
}
