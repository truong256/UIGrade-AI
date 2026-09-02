import {ClassroomUserRef} from "@/app/ui/my_classes/type/classroom.type";

export type ClassroomOption = {
    _id: string;
    name: string;
    code: string;
};

export type CurrentUser = {
    _id?: string;
    name?: string;
    role?: "User" | "admin" | "teacher";
};

export type AttachmentItem = {
    url: string;
    originalName: string;
    kind: string;
}

export type RubricCriterion  = {
    code: string;
    title: string;
    maxPoints: number;
    gradingSource: string;
}

export type LatestSubmission  = {
    _id: string;
    attemptNo: number;
    status: string;
    finalScore?: number | null;
    gradeStatus?: string;
}

export type AssignmentItem  = {
    _id: string;
    title: string;
    description: string;
    dueAt?: string;
    startAt?: string;
    status: "draft" | "published" | "closed";
    displayStatus: "draft" | "published" | "closed";
    maxScore: number;
    allowLateSubmit: boolean;
    allowResubmit: boolean;
    latePenaltyPercent: number;
    language: string;
    rubricText?: string;
    rubric?: RubricCriterion[];
    classroom: {
        _id: string;
        name: string;
        code: string;
    } | null;
    teacher: {
        _id: string;
        name: string;
        email: string;
    } | null;
    attachments?: AttachmentItem[];
    createdAt?: string;
    latestSubmission?: LatestSubmission | null;
}

export type ApiResult<T> = {
    success: boolean;
    message?: string;
    data?: T;
    user?: CurrentUser;
};

export type EditFormState  = {
    title: string;
    classroomId: string;
    description: string;
    rubricText: string;
    startAt: string;
    dueAt: string;
    maxScore: string;
    language: string;
    allowLateSubmit: boolean;
    allowResubmit: boolean;
    latePenaltyPercent: string;
    status: "draft" | "published" | "closed";
};

export type SelectOption = {
    value: string;
    label: string;
}