// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

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
    title?: string;
    awardedPoints: number;
    confidence: number;
    confidenceLabel?: "high" | "medium" | "low";
    summary: string;
    evidence?: AiEvidenceReference[];
    evidenceStatus?: "verified" | "insufficient" | "missing";
    strengths: string[];
    issues: string[];
    suggestions: string[];
    conflicts?: string[];
    needsHumanReview?: boolean;
}

export interface AiEvidenceReference {
    id: string;
    source: string;
    description: string;
    sourceType:
        | "submission_text"
        | "source_file"
        | "screenshot"
        | "repository"
        | "deterministic";
    excerpt?: string;
    lineStart?: number;
    lineEnd?: number;
}

export interface DeterministicGradingCheck {
    code: string;
    label: string;
    criterionCode?: string | null;
    status: "passed" | "failed" | "warning" | "not_run";
    evidence: string[];
    score?: number | null;
    maxScore?: number | null;
    immutable: true;
}

export interface AiGradingConflict {
    code: string;
    criterionCode?: string;
    message: string;
}

export interface AiGradingCritic {
    verdict: "ACCEPT" | "ADJUST" | "NEEDS_HUMAN_REVIEW";
    summary: string;
    adjustments: Array<{
        criterionCode: string;
        oldScore: number;
        newSuggestedScore: number;
        reason: string;
        evidence: AiEvidenceReference[];
    }>;
}

export interface AiGradingMetadata {
    provider: "gemini";
    model: string;
    promptVersion: string;
    schemaVersion: string;
    generatedAt: string;
    submissionVersion: string;
    assignmentVersion?: string;
    contentHash: string;
    stale?: boolean;
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
    suggestedTotal?: number;
    maxScore?: number;
    overallConfidence?: number;
    evidenceCoverage?: {
        verified: number;
        missing: number;
        insufficient: number;
        total: number;
    };
    missingEvidence?: string[];
    conflicts?: AiGradingConflict[];
    needsHumanReview?: boolean;
    critic?: AiGradingCritic;
    deterministicChecks?: DeterministicGradingCheck[];
    metadata?: AiGradingMetadata;
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
