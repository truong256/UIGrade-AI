export type AnyObj = Record<string, any>;

export type SidebarStudent = {
    studentId: string;
    name: string;
    studentCode: string;
    submissionId: string | null;
    statusText: string;
    scoreText: string;
    gradeStatus: string;
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
    student: {
        _id: string;
        name: string;
        studentCode: string;
    } | null;
};

export type GradingTab = "list" | "config";
