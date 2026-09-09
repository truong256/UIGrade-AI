export type GradeLifecycleStatus = "draft" | "published";

export type AssignmentRubricCriterion = {
    code: string;
    title: string;
    description: string;
    maxPoints: number;
};

export type GradeCriterionInput = {
    criterionCode: string;
    awardedPoints: unknown;
    feedback?: unknown;
};

export type GradeBreakdownEntry = {
    criterionCode: string;
    title: string;
    gradingSource: "manual";
    awardedPoints: number;
    maxPoints: number;
    feedback: string;
};

export type ValidatedGrade = {
    score: number;
    maxScore: number;
    lecturerFeedback: string;
    rubricBreakdown: GradeBreakdownEntry[];
};

const SCORE_PRECISION = 100;

function roundScore(value: number): number {
    return Math.round(value * SCORE_PRECISION) / SCORE_PRECISION;
}

function record(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value !== null
        ? value as Record<string, unknown>
        : {};
}

function requiredFiniteScore(value: unknown, label: string): number {
    if (value === "" || value === null || value === undefined) {
        throw new Error(`${label} chưa được nhập.`);
    }

    const score = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(score)) {
        throw new Error(`${label} không hợp lệ.`);
    }
    return roundScore(score);
}

export function normalizeAssignmentRubric(value: unknown): AssignmentRubricCriterion[] {
    if (!Array.isArray(value)) return [];

    const seen = new Set<string>();
    return value.map((raw, index) => {
        const item = record(raw);
        const code = String(item.code ?? item.id ?? `criterion-${index + 1}`).trim();
        const title = String(item.title ?? item.name ?? `Tiêu chí ${index + 1}`).trim();
        const maxPoints = requiredFiniteScore(
            item.maxPoints ?? item.maxScore,
            `Điểm tối đa của ${title}`
        );

        if (!code) throw new Error(`Tiêu chí ${index + 1} chưa có mã.`);
        if (seen.has(code)) throw new Error(`Mã tiêu chí bị trùng: ${code}.`);
        if (maxPoints <= 0) throw new Error(`Điểm tối đa của ${title} phải lớn hơn 0.`);
        seen.add(code);

        return {
            code,
            title: title || `Tiêu chí ${index + 1}`,
            description: String(item.description ?? "").trim(),
            maxPoints,
        };
    });
}

export function validateGradePayload(params: {
    assignmentRubric: unknown;
    assignmentMaxScore: unknown;
    criteria?: GradeCriterionInput[];
    manualScore?: unknown;
    lecturerFeedback?: unknown;
    publish: boolean;
}): ValidatedGrade {
    const maxScore = requiredFiniteScore(params.assignmentMaxScore, "Điểm tối đa");
    if (maxScore <= 0) throw new Error("Điểm tối đa của bài tập phải lớn hơn 0.");

    const lecturerFeedback = String(params.lecturerFeedback ?? "").trim();
    if (lecturerFeedback.length > 5_000) {
        throw new Error("Nhận xét chung không được vượt quá 5.000 ký tự.");
    }

    const rubric = normalizeAssignmentRubric(params.assignmentRubric);
    if (!rubric.length) {
        const score = requiredFiniteScore(params.manualScore, "Điểm tổng");
        if (score < 0 || score > maxScore) {
            throw new Error(`Điểm tổng phải từ 0 đến ${maxScore}.`);
        }
        return { score, maxScore, lecturerFeedback, rubricBreakdown: [] };
    }

    const rubricByCode = new Map(rubric.map((criterion) => [criterion.code, criterion]));
    const submittedCodes = new Set<string>();
    const breakdown: GradeBreakdownEntry[] = [];

    for (const raw of Array.isArray(params.criteria) ? params.criteria : []) {
        const criterionCode = String(raw?.criterionCode ?? "").trim();
        if (!criterionCode) throw new Error("Có tiêu chí chấm chưa xác định.");
        if (submittedCodes.has(criterionCode)) {
            throw new Error(`Tiêu chí ${criterionCode} bị gửi lặp.`);
        }

        const criterion = rubricByCode.get(criterionCode);
        if (!criterion) throw new Error(`Tiêu chí ${criterionCode} không thuộc rubric của bài tập.`);

        const awardedPoints = requiredFiniteScore(raw.awardedPoints, `Điểm ${criterion.title}`);
        if (awardedPoints < 0 || awardedPoints > criterion.maxPoints) {
            throw new Error(`Điểm ${criterion.title} phải từ 0 đến ${criterion.maxPoints}.`);
        }

        const feedback = String(raw.feedback ?? "").trim();
        if (feedback.length > 2_000) {
            throw new Error(`Nhận xét cho ${criterion.title} không được vượt quá 2.000 ký tự.`);
        }

        submittedCodes.add(criterionCode);
        breakdown.push({
            criterionCode,
            title: criterion.title,
            gradingSource: "manual",
            awardedPoints,
            maxPoints: criterion.maxPoints,
            feedback,
        });
    }

    if (params.publish) {
        const missing = rubric.filter((criterion) => !submittedCodes.has(criterion.code));
        if (missing.length) {
            throw new Error(`Chưa nhập điểm cho: ${missing.map((item) => item.title).join(", ")}.`);
        }
    }

    const score = roundScore(breakdown.reduce((sum, item) => sum + item.awardedPoints, 0));
    if (score > maxScore) {
        throw new Error(`Tổng điểm ${score} vượt quá điểm tối đa ${maxScore}.`);
    }

    return { score, maxScore, lecturerFeedback, rubricBreakdown: breakdown };
}

export function isPublishedGrade(status: unknown): boolean {
    return status === "published";
}
