export type CurrentUser = {
    _id?: string;
    name?: string;
    role?: "admin" | "teacher" | "User";
    studentCode?: string;
};

export type AnyObject = Record<string, any>;

export type ScoreCriterion = {
    title: string;
    gradingSource: string;
    awardedPoints: number;
    maxPoints: number;
    note: string;
};

export type ResultItem = {
    _id: string;
    assignmentId: string;
    assignmentTitle: string;
    classroomName: string;
    classroomCode: string;
    studentId: string;
    studentName: string;
    studentCode: string;
    dueAt?: string;
    submittedAt?: string;
    attemptNo: number;
    submissionStatus: string;
    gradeStatus: string;
    finalScore: number | null;
    maxScore: number;
    repositoryUrl: string;
    studentNote: string;
    teacherComment: string;
    aiSummary: string;
    strengths: string[];
    nextSteps: string[];
    criterionBreakdown: ScoreCriterion[];
};

export type SelectOption = {
    value: string;
    label: string;
};

export type ResultsStats = {
    totalVisible: number;
    gradedCount: number;
    averageScore: string;
    teacherCommentCount: number;
};
