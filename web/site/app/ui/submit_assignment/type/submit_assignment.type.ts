export type AssignmentAttachment = {
    kind: string;
    url: string;
    originalName: string;
};

export type LatestSubmission = {
    _id: string;
    attemptNo: number;
    status: "draft" | "submitted" | "late";
    submittedAt?: string;
    repositoryUrl?: string;
    note?: string;
    files: Array<{
        url: string;
        originalName: string;
    }>;
};

export type AssignmentItem = {
    _id: string;
    title: string;
    description: string;
    language: string;
    dueAt?: string;
    startAt?: string;
    allowLateSubmit: boolean;
    allowResubmit: boolean;
    latePenaltyPercent: number;
    maxScore: number;
    rubricText?: string;
    displayStatus: "draft" | "published" | "closed";
    classroom: {
        _id: string;
        name: string;
        code: string;
    } | null;
    attachments: AssignmentAttachment[];
    latestSubmission: LatestSubmission | null;
};

export type ApiResult<T> = {
    success: boolean;
    message?: string;
    data?: T;
};

export type SubmitAction = "draft" | "submit";
