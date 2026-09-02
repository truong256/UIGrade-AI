import type { AssignmentDetail, NormalizedSubmission } from "./grading_detail.type";
import { asObj, toNum, toText } from "./grading_detail.unit";

export async function requestJson<T = unknown>(url: string, init?: RequestInit) {
    const res = await fetch(url, {
        ...init,
        cache: "no-store",
        headers: {
            ...(init?.body ? { "Content-Type": "application/json" } : {}),
            ...(init?.headers || {}),
        },
    });

    const json = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
        data?: T;
        items?: unknown[];
        user?: unknown;
    };

    if (!res.ok || json.success === false) {
        throw new Error(json.message || "Không thể tải dữ liệu");
    }

    return json;
}

export function normalizeAssignment(raw: unknown): AssignmentDetail {
    const item = asObj(raw);
    const classroom = asObj(item.classroom || item.classroomId);
    return {
        _id: toText(item._id),
        title: toText(item.title, "Bài tập"),
        dueAt: toText(item.dueAt) || undefined,
        maxScore: toNum(item.maxScore, 10),
        description: toText(item.description),
        classroom: classroom._id
            ? {
                _id: toText(classroom._id),
                name: toText(classroom.name),
                code: toText(classroom.code),
            }
            : null,
        rubric: Array.isArray(item.rubric) ? item.rubric : [],
        attachments: Array.isArray(item.attachments) ? item.attachments : [],
        runnerConfig: asObj(item.runnerConfig),
    };
}

export function normalizeSubmissions(raw: unknown[]): NormalizedSubmission[] {
    return raw.map((entry) => {
        const item = asObj(entry);
        const student = asObj(item.student || item.studentId);
        return {
            _id: toText(item._id),
            latest: Boolean(item.latest),
            attemptNo: toNum(item.attemptNo, 1),
            status: toText(item.status, "submitted"),
            gradeStatus: toText(item.gradeStatus, "pending"),
            submittedAt: toText(item.submittedAt) || undefined,
            finalScore:
                item.finalScore === null || item.finalScore === undefined
                    ? null
                    : toNum(item.finalScore, 0),
            student: student._id
                ? {
                    _id: toText(student._id),
                    name: toText(student.name, "Sinh viên"),
                    studentCode: toText(student.studentCode),
                }
                : null,
        };
    });
}
