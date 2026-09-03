import Submission from "@/models/Submission.model";
import { buildGradingContext } from "@/services/grading-context.service";
import type {
    AiFeedbackResult,
    AutoGradePayload,
    CriterionBreakdown,
    GradeStatus,
    RubricCriterion,
    RunnerReportInput,
} from "@/lib/grading-contract";
import { generateAiFeedback } from "@/services/gemini.service";
import { runRunnerForSubmission } from "@/services/runner.service";

function toStringId(value: unknown): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "bigint") return String(value);

    if (typeof value === "object" && value !== null) {
        const maybeObject = value as { _id?: unknown; toString?: () => string };

        if ("_id" in maybeObject && maybeObject._id && maybeObject._id !== value) {
            return toStringId(maybeObject._id);
        }

        if (typeof maybeObject.toString === "function") {
            const stringValue = maybeObject.toString();
            if (stringValue && stringValue !== "[object Object]") {
                return stringValue;
            }
        }
    }

    return String(value);
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function round2(value: number) {
    return Math.round(value * 100) / 100;
}

function parseRubric(snapshot: any): RubricCriterion[] {
    const rubric = Array.isArray(snapshot?.rubric) ? snapshot.rubric : [];
    return rubric.map((item: any) => ({
        code: String(item.code || ""),
        title: String(item.title || ""),
        description: String(item.description || ""),
        maxPoints: Number(item.maxPoints || 0),
        gradingSource:
            item.gradingSource === "runner" ||
            item.gradingSource === "ai" ||
            item.gradingSource === "hybrid" ||
            item.gradingSource === "manual"
                ? item.gradingSource
                : "manual",
        requiredEvidence: Array.isArray(item.requiredEvidence)
            ? item.requiredEvidence.map(String)
            : [],
        passThreshold:
            item.passThreshold === null || item.passThreshold === undefined
                ? null
                : Number(item.passThreshold),
        notes: String(item.notes || ""),
    }));
}

function normalizeRubricForAutograde(
    rubric: RubricCriterion[],
    maxScore: number
): RubricCriterion[] {
    const cleaned = rubric.filter((item) => Number(item.maxPoints || 0) > 0);

    if (!cleaned.length) {
        return [
            {
                code: "overall",
                title: "Chấm tổng thể",
                description:
                    "Đánh giá tổng thể dựa trên mô tả bài, rubric, starter code và bài nộp sinh viên.",
                maxPoints: maxScore > 0 ? maxScore : 10,
                gradingSource: "ai",
                requiredEvidence: [],
                passThreshold: null,
                notes: "Auto-generated fallback rubric",
            },
        ];
    }

    const hasAutoCriterion = cleaned.some(
        (item) =>
            item.gradingSource === "ai" ||
            item.gradingSource === "hybrid" ||
            item.gradingSource === "runner"
    );

    if (hasAutoCriterion) {
        return cleaned;
    }

    return cleaned.map((item) => ({
        ...item,
        gradingSource: "ai",
    }));
}

function checksForCriterion(
    runnerReport: RunnerReportInput | null | undefined,
    criterionCode: string
) {
    return Array.isArray(runnerReport?.checks)
        ? runnerReport.checks.filter((item) => item.criterionCode === criterionCode)
        : [];
}

function deriveScoreFromChecks(
    criterion: RubricCriterion,
    runnerReport: RunnerReportInput | null | undefined
) {
    const checks = checksForCriterion(runnerReport, criterion.code);

    if (!checks.length) {
        if (criterion.code.includes("visual") && typeof runnerReport?.visualSimilarity === "number") {
            const ratio = clamp(Number(runnerReport.visualSimilarity) / 100, 0, 1);
            return {
                awardedPoints: round2(ratio * criterion.maxPoints),
                note: `Derived from visualSimilarity=${runnerReport.visualSimilarity}`,
                hasEvidence: true,
            };
        }

        if (
            criterion.code.includes("accessibility") &&
            typeof runnerReport?.accessibilityScore === "number"
        ) {
            const ratio = clamp(Number(runnerReport.accessibilityScore) / 100, 0, 1);
            return {
                awardedPoints: round2(ratio * criterion.maxPoints),
                note: `Derived from accessibilityScore=${runnerReport.accessibilityScore}`,
                hasEvidence: true,
            };
        }

        if (
            criterion.code.includes("build") &&
            runnerReport?.buildPassed !== undefined &&
            runnerReport?.buildPassed !== null
        ) {
            return {
                awardedPoints: runnerReport.buildPassed ? criterion.maxPoints : 0,
                note: "Derived from buildPassed",
                hasEvidence: true,
            };
        }

        if (
            criterion.code.includes("test") &&
            runnerReport?.testPassed !== undefined &&
            runnerReport?.testPassed !== null
        ) {
            return {
                awardedPoints: runnerReport.testPassed ? criterion.maxPoints : 0,
                note: "Derived from testPassed",
                hasEvidence: true,
            };
        }

        return {
            awardedPoints: 0,
            note: "No runner evidence matched this criterion.",
            hasEvidence: false,
        };
    }

    const scoredChecks = checks.filter(
        (item) =>
            typeof item.score === "number" &&
            typeof item.maxScore === "number" &&
            Number(item.maxScore) > 0
    );

    if (scoredChecks.length) {
        const totalScore = scoredChecks.reduce((sum, item) => sum + Number(item.score || 0), 0);
        const totalMax = scoredChecks.reduce((sum, item) => sum + Number(item.maxScore || 0), 0);
        const ratio = totalMax > 0 ? totalScore / totalMax : 0;

        return {
            awardedPoints: round2(clamp(ratio, 0, 1) * criterion.maxPoints),
            note: `Derived from explicit check scores ${totalScore}/${totalMax}`,
            hasEvidence: true,
        };
    }

    const passedCount = checks.filter((item) => item.status === "passed").length;
    const ratio = checks.length > 0 ? passedCount / checks.length : 0;

    return {
        awardedPoints: round2(clamp(ratio, 0, 1) * criterion.maxPoints),
        note: `Derived from passed checks ${passedCount}/${checks.length}`,
        hasEvidence: true,
    };
}

function buildBreakdown(params: {
    rubric: RubricCriterion[];
    runnerReport?: RunnerReportInput | null;
    aiFeedback?: AiFeedbackResult | null;
}) {
    const aiMap = new Map(
        (params.aiFeedback?.criterionFeedback || []).map((item) => [item.criterionCode, item])
    );

    const criterionBreakdown: CriterionBreakdown[] = params.rubric.map((criterion) => {
        if (criterion.gradingSource === "runner") {
            const runner = deriveScoreFromChecks(criterion, params.runnerReport);
            return {
                criterionCode: criterion.code,
                title: criterion.title,
                gradingSource: criterion.gradingSource,
                awardedPoints: runner.awardedPoints,
                maxPoints: criterion.maxPoints,
                note: runner.note,
            };
        }

        if (criterion.gradingSource === "manual") {
            return {
                criterionCode: criterion.code,
                title: criterion.title,
                gradingSource: criterion.gradingSource,
                awardedPoints: 0,
                maxPoints: criterion.maxPoints,
                note: "Manual review required.",
            };
        }

        const aiItem = aiMap.get(criterion.code);
        const aiScore = clamp(Number(aiItem?.awardedPoints || 0), 0, criterion.maxPoints);

        if (criterion.gradingSource === "ai") {
            return {
                criterionCode: criterion.code,
                title: criterion.title,
                gradingSource: criterion.gradingSource,
                awardedPoints: round2(aiScore),
                maxPoints: criterion.maxPoints,
                note: aiItem ? `AI confidence: ${aiItem.confidence}` : "AI feedback missing.",
            };
        }

        const runner = deriveScoreFromChecks(criterion, params.runnerReport);

        if (!runner.hasEvidence && aiItem) {
            return {
                criterionCode: criterion.code,
                title: criterion.title,
                gradingSource: criterion.gradingSource,
                awardedPoints: round2(aiScore),
                maxPoints: criterion.maxPoints,
                note: "AI only. Runner chưa có evidence.",
            };
        }

        if (runner.hasEvidence && !aiItem) {
            return {
                criterionCode: criterion.code,
                title: criterion.title,
                gradingSource: criterion.gradingSource,
                awardedPoints: round2(runner.awardedPoints),
                maxPoints: criterion.maxPoints,
                note: "Runner only. AI feedback missing.",
            };
        }

        if (!runner.hasEvidence && !aiItem) {
            return {
                criterionCode: criterion.code,
                title: criterion.title,
                gradingSource: criterion.gradingSource,
                awardedPoints: 0,
                maxPoints: criterion.maxPoints,
                note: "Neither runner nor AI produced evidence.",
            };
        }

        const hybridScore = round2((runner.awardedPoints + aiScore) / 2);

        return {
            criterionCode: criterion.code,
            title: criterion.title,
            gradingSource: criterion.gradingSource,
            awardedPoints: clamp(hybridScore, 0, criterion.maxPoints),
            maxPoints: criterion.maxPoints,
            note: `Hybrid score. Runner=${runner.awardedPoints}, AI=${aiScore}`,
        };
    });

    return criterionBreakdown;
}

function serializeSubmission(submission: any) {
    if (!submission) return null;

    return {
        _id: toStringId(submission._id),
        status: submission.status || "submitted",
        gradeStatus: submission.gradeStatus || "pending",
        finalScore: submission.finalScore ?? null,
        attemptNo: Number(submission.attemptNo || 1),
        submittedAt: submission.submittedAt || null,
        repositoryUrl: submission.repositoryUrl || "",
        note: submission.note || "",
        sourceArchive: submission.sourceArchive || null,
        screenshots: Array.isArray(submission.screenshots) ? submission.screenshots : [],
        files: Array.isArray(submission.files) ? submission.files : [],
        assignment: submission.assignmentId
            ? {
                _id: toStringId(submission.assignmentId?._id || submission.assignmentId),
                title: submission.assignmentId?.title || "",
                maxScore: Number(submission.assignmentId?.maxScore || 0),
                dueAt: submission.assignmentId?.dueAt || null,
                startAt: submission.assignmentId?.startAt || null,
                status: submission.assignmentId?.status || "",
            }
            : null,
        classroom: submission.classroomId
            ? {
                _id: toStringId(submission.classroomId?._id || submission.classroomId),
                name: submission.classroomId?.name || "",
                code: submission.classroomId?.code || "",
                semester: submission.classroomId?.semester || "",
                academicYear: submission.classroomId?.academicYear || "",
            }
            : null,
        student: submission.studentId
            ? {
                _id: toStringId(submission.studentId?._id || submission.studentId),
                name: submission.studentId?.name || "",
                email: submission.studentId?.email || "",
                studentCode: submission.studentId?.studentCode || "",
            }
            : null,
        assignmentSnapshot: submission.assignmentSnapshot || null,
        autoGrade: submission.autoGrade || null,
        teacherOverride: submission.teacherOverride || null,
        gradeHistory: Array.isArray(submission.gradeHistory) ? submission.gradeHistory : [],
    };
}

async function loadSubmission(submissionId: string) {
    return Submission.findById(submissionId)
        .populate(
            "assignmentId",
            "title maxScore dueAt startAt status description rubricText attachments language rubric aiConfig"
        )
        .populate("classroomId", "name code semester academicYear")
        .populate("studentId", "name email studentCode");
}

export const gradingService = {
    async getSubmissionDetail(submissionId: string) {
        const submission = await loadSubmission(submissionId);

        if (!submission) {
            throw new Error("Không tìm thấy bài nộp");
        }

        return serializeSubmission(submission);
    },

    async getSubmissionHistory(submissionId: string) {
        const submission = await Submission.findById(submissionId).select("gradeHistory");

        if (!submission) {
            throw new Error("Không tìm thấy bài nộp");
        }

        return Array.isArray(submission.gradeHistory) ? submission.gradeHistory : [];
    },

    async gradeSubmission(params: {
        submissionId: string;
        actorId: string;
        regenerateAi?: boolean;
        regenerateRunner?: boolean;
        runnerReport?: RunnerReportInput | null;
    }) {
        const submission = await loadSubmission(params.submissionId);

        if (!submission) {
            throw new Error("Không tìm thấy bài nộp");
        }

        if (!submission.assignmentSnapshot) {
            throw new Error("Bài nộp chưa có assignmentSnapshot để chấm");
        }

        const rawRubric = parseRubric(submission.assignmentSnapshot);
        const maxScore =
            Number(submission.assignmentSnapshot.maxScore || 0) ||
            rawRubric.reduce((sum, item) => sum + Number(item.maxPoints || 0), 0);

        const rubric = normalizeRubricForAutograde(rawRubric, maxScore);

        let effectiveRunnerReport: RunnerReportInput | null =
            params.runnerReport ??
            (params.regenerateRunner ? null : submission.autoGrade?.runnerEvidence ?? null);

        if (!effectiveRunnerReport) {
            effectiveRunnerReport = await runRunnerForSubmission(submission);
        }

        const aiCriteria = rubric.filter(
            (item) => item.gradingSource === "ai" || item.gradingSource === "hybrid"
        );

        let aiFeedback: AiFeedbackResult | null = submission.autoGrade?.aiFeedback || null;

        const aiEnabled = submission.assignmentSnapshot?.aiConfig?.enabled !== false;
        const gradingContext = await buildGradingContext(submission);

        if (aiEnabled && (params.regenerateAi || !aiFeedback) && aiCriteria.length) {
            aiFeedback = await generateAiFeedback({
                assignmentTitle:
                    submission.assignmentSnapshot?.title || submission.assignmentId?.title || "Bài tập",
                gradingContextText: gradingContext.text,
                multimodalParts: gradingContext.multimodalParts,
                rubric: aiCriteria,
                runnerReport: effectiveRunnerReport,
                model:
                    submission.assignmentSnapshot?.aiConfig?.model ||
                    process.env.GEMINI_MODEL ||
                    "gemini-3.8-flash",
                language: submission.assignmentSnapshot?.aiConfig?.feedbackLanguage || "vi",
            });
        }

        const criterionBreakdown = buildBreakdown({
            rubric,
            runnerReport: effectiveRunnerReport,
            aiFeedback,
        });

        const autoScore = round2(
            criterionBreakdown.reduce((sum, item) => {
                if (item.gradingSource === "manual") return sum;
                return sum + Number(item.awardedPoints || 0);
            }, 0)
        );

        const hasManual = rubric.some((item) => item.gradingSource === "manual");
        const hasAiInfluence = rubric.some(
            (item) => item.gradingSource === "ai" || item.gradingSource === "hybrid"
        );
        const lowConfidence = (aiFeedback?.criterionFeedback || []).some(
            (item) => Number(item.confidence || 0) < 0.35
        );

        // Chính sách sản phẩm: AI chỉ đề xuất điểm, không tự quyết định điểm
        // cuối. Bất kỳ tiêu chí nào có gradingSource "ai"/"hybrid" đều bắt
        // buộc giáo viên duyệt trước khi điểm được coi là chính thức.
        const needsTeacherReview = hasManual || hasAiInfluence || lowConfidence;
        const status: GradeStatus = needsTeacherReview ? "needs_teacher_review" : "auto_graded";

        const autoGradePayload: AutoGradePayload = {
            score: autoScore,
            maxScore,
            normalizedScore: maxScore > 0 ? round2((autoScore / maxScore) * 100) : 0,
            status,
            needsTeacherReview,
            criterionBreakdown,
            runnerEvidence: effectiveRunnerReport,
            aiFeedback,
            gradedAt: new Date().toISOString(),
        };

        const previousScore = submission.finalScore ?? null;
        submission.autoGrade = autoGradePayload;
        submission.gradeStatus = status;
        // Không ghi autoScore vào finalScore khi còn cần giáo viên duyệt —
        // finalScore chỉ được coi là chính thức sau khi có teacherOverride.
        // autoGrade.score (autoScore) vẫn hiển thị cho giáo viên như đề xuất.
        submission.finalScore = submission.teacherOverride?.score ?? (needsTeacherReview
            ? previousScore
            : autoScore);
        submission.status = "graded";

        if (!Array.isArray(submission.gradeHistory)) {
            submission.gradeHistory = [];
        }

        submission.gradeHistory.push({
            action: "AUTO_GRADE",
            actorId: params.actorId,
            note: needsTeacherReview
                ? "Auto grade xong nhưng cần giáo viên xem lại."
                : "Auto grade hoàn tất.",
            previousScore,
            nextScore: submission.finalScore,
            createdAt: new Date(),
        });

        if (params.regenerateAi) {
            submission.gradeHistory.push({
                action: "AI_FEEDBACK_REFRESH",
                actorId: params.actorId,
                note: "Đã refresh AI feedback.",
                previousScore: submission.finalScore,
                nextScore: submission.finalScore,
                createdAt: new Date(),
            });
        }

        await submission.save();
        return serializeSubmission(submission);
    },

    async overrideSubmissionScore(params: {
        submissionId: string;
        actorId: string;
        score: number;
        comment: string;
    }) {
        const submission = await loadSubmission(params.submissionId);

        if (!submission) {
            throw new Error("Không tìm thấy bài nộp");
        }

        const previousScore = submission.finalScore ?? null;

        submission.teacherOverride = {
            teacherId: params.actorId,
            score: Number(params.score || 0),
            comment: String(params.comment || ""),
            overriddenAt: new Date(),
        };

        submission.finalScore = Number(params.score || 0);
        submission.gradeStatus = "overridden";
        submission.status = "graded";

        if (!Array.isArray(submission.gradeHistory)) {
            submission.gradeHistory = [];
        }

        submission.gradeHistory.push({
            action: "TEACHER_OVERRIDE",
            actorId: params.actorId,
            note: params.comment,
            previousScore,
            nextScore: submission.finalScore,
            createdAt: new Date(),
        });

        await submission.save();
        return serializeSubmission(submission);
    },
};
