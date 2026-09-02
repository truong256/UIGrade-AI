import type { AnyObject, ResultItem, ResultsStats, SelectOption } from "./my_results.type";

export function asObject(value: unknown): AnyObject {
    return typeof value === "object" && value !== null ? (value as AnyObject) : {};
}

export function toText(value: unknown, fallback = "") {
    if (typeof value === "string") return value;
    if (value === null || value === undefined) return fallback;
    return String(value);
}

export function toNumberValue(value: unknown, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function formatDateTime(value?: string) {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

export function formatDate(value?: string) {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}

export function formatScore(value: number | null | undefined) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return "--";
    }

    const numberValue = Number(value);
    return Number.isInteger(numberValue) ? String(numberValue) : numberValue.toFixed(1);
}

export function gradeStatusLabel(status: string) {
    if (status === "overridden") return "Giảng viên đã chốt";
    if (status === "auto_graded") return "AI đã chấm";
    if (status === "needs_teacher_review") return "Chờ giảng viên duyệt";
    if (status === "graded") return "Đã chấm";
    return "Chưa chấm";
}

export function gradeStatusClass(status: string) {
    if (status === "overridden") return "border-green-200 bg-green-50 text-green-700";
    if (status === "auto_graded") return "border-blue-200 bg-blue-50 text-blue-700";
    if (status === "needs_teacher_review") return "border-amber-200 bg-amber-50 text-amber-700";
    return "border-slate-200 bg-slate-100 text-slate-700";
}

export function isItemGraded(item: ResultItem) {
    return (
        item.finalScore !== null ||
        item.gradeStatus === "auto_graded" ||
        item.gradeStatus === "overridden" ||
        item.gradeStatus === "graded"
    );
}

export function normalizeResult(raw: unknown): ResultItem {
    const item = asObject(raw);
    const assignment = asObject(item.assignmentId || item.assignment);
    const classroom = asObject(item.classroomId || item.classroom);
    const student = asObject(item.studentId || item.student);
    const autoGrade = asObject(item.autoGrade);
    const aiFeedback = asObject(autoGrade.aiFeedback);
    const teacherOverride = asObject(item.teacherOverride);

    return {
        _id: toText(item._id),
        assignmentId: toText(assignment._id || item.assignmentId),
        assignmentTitle: toText(assignment.title, "Bài tập chưa đặt tên"),
        classroomName: toText(classroom.name, "Chưa có lớp"),
        classroomCode: toText(classroom.code),
        studentId: toText(student._id || item.studentId),
        studentName: toText(student.name, "Sinh viên"),
        studentCode: toText(student.studentCode),
        dueAt: toText(assignment.dueAt) || undefined,
        submittedAt: toText(item.submittedAt) || undefined,
        attemptNo: toNumberValue(item.attemptNo, 1),
        submissionStatus: toText(item.status, "submitted"),
        gradeStatus: toText(item.gradeStatus, "pending"),
        finalScore:
            item.finalScore === null || item.finalScore === undefined
                ? autoGrade.score === null || autoGrade.score === undefined
                    ? null
                    : toNumberValue(autoGrade.score, 0)
                : toNumberValue(item.finalScore, 0),
        maxScore: toNumberValue(assignment.maxScore || autoGrade.maxScore, 10),
        repositoryUrl: toText(item.repositoryUrl),
        studentNote: toText(item.note),
        teacherComment: toText(teacherOverride.comment),
        aiSummary: toText(aiFeedback.summary),
        strengths: Array.isArray(aiFeedback.strengths)
            ? aiFeedback.strengths.map((entry: unknown) => toText(entry)).filter(Boolean)
            : [],
        nextSteps: Array.isArray(aiFeedback.nextSteps)
            ? aiFeedback.nextSteps.map((entry: unknown) => toText(entry)).filter(Boolean)
            : [],
        criterionBreakdown: Array.isArray(autoGrade.criterionBreakdown)
            ? autoGrade.criterionBreakdown.map((criterion: unknown) => {
                const entry = asObject(criterion);
                return {
                    title: toText(entry.title, "Tiêu chí"),
                    gradingSource: toText(entry.gradingSource, "manual"),
                    awardedPoints: toNumberValue(entry.awardedPoints, 0),
                    maxPoints: toNumberValue(entry.maxPoints, 0),
                    note: toText(entry.note),
                };
            })
            : [],
    };
}

export function pickLatestByAssignment(items: ResultItem[]) {
    const sorted = [...items].sort((a, b) => {
        const timeA = new Date(a.submittedAt || 0).getTime();
        const timeB = new Date(b.submittedAt || 0).getTime();
        if (timeA !== timeB) return timeB - timeA;
        return b.attemptNo - a.attemptNo;
    });

    const unique = new Map<string, ResultItem>();

    for (const item of sorted) {
        if (!item.assignmentId) {
            unique.set(item._id, item);
            continue;
        }
        if (!unique.has(item.assignmentId)) unique.set(item.assignmentId, item);
    }

    return Array.from(unique.values());
}

export function buildClassOptions(items: ResultItem[]): SelectOption[] {
    const map = new Map<string, string>();

    for (const item of items) {
        const key = item.classroomCode || item.classroomName;
        const label = item.classroomCode
            ? `${item.classroomName} (${item.classroomCode})`
            : item.classroomName;

        if (key) map.set(key, label);
    }

    return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
}

export function filterResults(items: ResultItem[], keyword: string, classFilter: string, statusFilter: string) {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return items.filter((item) => {
        const matchKeyword =
            !normalizedKeyword ||
            `${item.assignmentTitle} ${item.classroomName} ${item.classroomCode}`
                .toLowerCase()
                .includes(normalizedKeyword);

        const classKey = item.classroomCode || item.classroomName;
        const matchClass = classFilter === "all" || classKey === classFilter;

        const matchStatus =
            statusFilter === "all"
                ? true
                : statusFilter === "graded"
                    ? isItemGraded(item)
                    : statusFilter === "pending"
                        ? !isItemGraded(item)
                        : statusFilter === item.submissionStatus;

        return matchKeyword && matchClass && matchStatus;
    });
}

export function getResultsStats(items: ResultItem[]): ResultsStats {
    const gradedCount = items.filter(isItemGraded).length;
    const scores = items
        .map((item) => item.finalScore)
        .filter((value): value is number => value !== null && value !== undefined);

    return {
        totalVisible: items.length,
        gradedCount,
        averageScore:
            scores.length > 0
                ? (scores.reduce((sum, value) => sum + value, 0) / scores.length).toFixed(1)
                : "--",
        teacherCommentCount: items.filter((item) => item.teacherComment).length,
    };
}
