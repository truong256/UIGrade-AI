import type { AnyObj, NormalizedSubmission, SidebarStudent } from "./grading_detail.type";

export function asObj(value: unknown): AnyObj {
    return typeof value === "object" && value !== null ? (value as AnyObj) : {};
}

export function toText(value: unknown, fallback = "") {
    if (typeof value === "string") return value;
    if (value === null || value === undefined) return fallback;
    return String(value);
}

export function toNum(value: unknown, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function toId(value: unknown): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object" && value !== null) {
        const obj = value as { _id?: unknown; toString?: () => string };
        if (obj._id) return toId(obj._id);
        if (typeof obj.toString === "function") {
            const str = obj.toString();
            if (str && str !== "[object Object]") return str;
        }
    }
    return String(value);
}

export function formatDateTime(value?: string | null) {
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

export function formatDate(value?: string | null) {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}

export function formatScore(value?: number | null) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "--";
    const num = Number(value);
    return Number.isInteger(num) ? String(num) : num.toFixed(1);
}

export function latestSubmissionMap(list: NormalizedSubmission[]) {
    const sorted = [...list].sort((a, b) => {
        if (a.latest && !b.latest) return -1;
        if (!a.latest && b.latest) return 1;
        const t1 = new Date(a.submittedAt || 0).getTime();
        const t2 = new Date(b.submittedAt || 0).getTime();
        if (t1 !== t2) return t2 - t1;
        return b.attemptNo - a.attemptNo;
    });

    const map = new Map<string, NormalizedSubmission>();
    for (const item of sorted) {
        const studentId = item.student?._id || "";
        if (!studentId || map.has(studentId)) continue;
        map.set(studentId, item);
    }
    return map;
}

export function submissionStatus(submission: NormalizedSubmission | null) {
    if (!submission) return "Chưa nộp";
    const d = submission.submittedAt ? formatDate(submission.submittedAt) : "--";
    if (submission.gradeStatus === "overridden") return `GV đã duyệt • ${d}`;
    if (submission.gradeStatus === "auto_graded") return `Đã chấm AI • ${d}`;
    if (submission.gradeStatus === "needs_teacher_review") return `Cần duyệt • ${d}`;
    if (submission.status === "late") return `Nộp muộn • ${d}`;
    return "Đã nộp • Đang chờ";
}

export function buildSidebar(classItems: unknown[], submissionItems: NormalizedSubmission[]) {
    const result: SidebarStudent[] = [];
    const seen = new Set<string>();
    const subMap = latestSubmissionMap(submissionItems);

    for (const memberRaw of classItems) {
        const member = asObj(memberRaw);
        const user = asObj(member.userId || member.user);
        const studentId = toId(user._id);
        if (!studentId) continue;
        if (member.roleInClass === "teacher" || user.role === "teacher") continue;
        if (seen.has(studentId)) continue;

        seen.add(studentId);
        const submission = subMap.get(studentId) || null;

        result.push({
            studentId,
            name: toText(user.name, "Sinh viên"),
            studentCode: toText(user.studentCode),
            submissionId: submission?._id || null,
            statusText: submissionStatus(submission),
            scoreText: submission ? formatScore(submission.finalScore) : "0.0",
            gradeStatus: submission?.gradeStatus || "pending",
            missing: !submission,
        });
    }

    for (const submission of subMap.values()) {
        const studentId = submission.student?._id || "";
        if (!studentId || seen.has(studentId)) continue;
        result.push({
            studentId,
            name: submission.student?.name || "Sinh viên",
            studentCode: submission.student?.studentCode || "",
            submissionId: submission._id,
            statusText: submissionStatus(submission),
            scoreText: formatScore(submission.finalScore),
            gradeStatus: submission.gradeStatus,
            missing: false,
        });
    }

    return result.sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

export function badgeClass(status: string) {
    if (status === "overridden") return "bg-green-50 text-green-700 border-green-200";
    if (status === "auto_graded") return "bg-blue-50 text-blue-700 border-blue-200";
    if (status === "needs_teacher_review") return "bg-amber-50 text-amber-700 border-amber-200";
    if (status === "late") return "bg-rose-50 text-rose-700 border-rose-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
}

export function statusLabel(status: string) {
    if (status === "overridden") return "Giáo viên chốt điểm";
    if (status === "auto_graded") return "Đã chấm AI";
    if (status === "needs_teacher_review") return "Cần duyệt";
    if (status === "late") return "Nộp muộn";
    if (status === "graded") return "Đã chấm";
    if (status === "submitted") return "Đã nộp";
    return "Đang chờ";
}

export function isPdf(url?: string, mimeType?: string) {
    return Boolean(url && ((mimeType || "").includes("pdf") || url.toLowerCase().endsWith(".pdf")));
}
