// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

export type AnyObj = Record<string, any>;

export type SidebarStudent = {
    studentId: string;
    name: string;
    email: string;
    studentCode: string;
    submissionId: string | null;
    submittedAt?: string;
    submissionStatus: string;
    statusText: string;
    scoreText: string;
    gradeStatus: string;
    isLate: boolean;
    missing: boolean;
};

export type AssignmentOption = {
    _id: string;
    title: string;
    dueAt?: string;
    classroomName?: string;
};

export type AssignmentDetail = {
    _id: string;
    title: string;
    dueAt?: string;
    maxScore: number;
    description: string;
    classroom: {
        _id: string;
        name: string;
        code: string;
    } | null;
    rubric: AnyObj[];
    attachments?: AnyObj[];
    runnerConfig?: AnyObj;
};

export type NormalizedSubmission = {
    _id: string;
    latest: boolean;
    attemptNo: number;
    status: string;
    gradeStatus: string;
    submittedAt?: string;
    finalScore: number | null;
    isLate: boolean;
    student: {
        _id: string;
        name: string;
        email: string;
        studentCode: string;
    } | null;
};

export type GradingTab = "list" | "config";
export type GradingFilter = "all" | "not_submitted" | "submitted" | "late" | "ungraded" | "grading" | "graded";
