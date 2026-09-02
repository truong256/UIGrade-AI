export type GradingSource = "runner" | "ai" | "hybrid" | "manual";
export type GradeStatus =
    | "pending"
    | "auto_graded"
    | "needs_teacher_review"
    | "overridden";
export type RuntimeStatus =
    | "not_run"
    | "project_invalid"
    | "build_failed"
    | "apk_missing"
    | "install_failed"
    | "launch_failed"
    | "screenshot_failed"
    | "comparison_failed"
    | "passed";

export interface RunnerArtifact {
    label: string;
    path?: string;
    url?: string;
    mimeType?: string;
}

export interface RunnerLog {
    label: string;
    content: string;
}

export interface VisualComparisonResult {
    screenKey?: string;
    label?: string;
    similarity: number;
    diffPercent?: number | null;
    baselineUrl?: string;
    studentUrl?: string;
    diffUrl?: string;
    message?: string;
}

export interface RunnerCheck {
    code: string;
    label: string;
    criterionCode?: string | null;
    status: "passed" | "failed" | "warning" | "not_run";
    score?: number | null;
    maxScore?: number | null;
    message?: string | null;
    evidence?: string[];
}

export interface RunnerReportInput {
    buildPassed?: boolean | null;
    testPassed?: boolean | null;
    visualSimilarity?: number | null;
    accessibilityScore?: number | null;
    checks?: RunnerCheck[];
    rawSummary?: string | null;

    runtimeStatus?: RuntimeStatus;
    packageName?: string | null;
    apkPath?: string | null;

    screenshots?: RunnerArtifact[];
    artifacts?: RunnerArtifact[];
    logs?: RunnerLog[];

    visualComparison?: VisualComparisonResult | null;
    visualComparisons?: VisualComparisonResult[];
}

export interface RubricCriterion {
    code: string;
    title: string;
    description?: string;
    maxPoints: number;
    gradingSource: GradingSource;
    requiredEvidence?: string[];
    passThreshold?: number | null;
    notes?: string;
}

export interface AiCriterionFeedback {
    criterionCode: string;
    awardedPoints: number;
    confidence: number;
    summary: string;
    strengths: string[];
    issues: string[];
    suggestions: string[];
}

export interface AiIssue {
    severity: "low" | "medium" | "high";
    title: string;
    evidence: string;
    fix: string;
}

export interface AiFeedbackResult {
    summary: string;
    strengths: string[];
    issues: AiIssue[];
    nextSteps: string[];
    criterionFeedback: AiCriterionFeedback[];
}

export interface CriterionBreakdown {
    criterionCode: string;
    title: string;
    gradingSource: GradingSource;
    awardedPoints: number;
    maxPoints: number;
    note?: string;
}

export interface AutoGradePayload {
    score: number;
    maxScore: number;
    normalizedScore: number;
    status: GradeStatus;
    needsTeacherReview: boolean;
    criterionBreakdown: CriterionBreakdown[];
    runnerEvidence?: RunnerReportInput | null;
    aiFeedback?: AiFeedbackResult | null;
    gradedAt: string;
}

export interface GradeHistoryItem {
    action: "AUTO_GRADE" | "AI_FEEDBACK_REFRESH" | "TEACHER_OVERRIDE" | "MANUAL_REVIEW";
    actorId?: string | null;
    note?: string | null;
    previousScore?: number | null;
    nextScore?: number | null;
    createdAt: string;
}