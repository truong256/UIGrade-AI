import type { AssignmentItem, LatestSubmission } from "./submit_assignment.type";

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

export function formatTimeRemaining(value?: string) {
    if (!value) return "Không xác định";
    const diffMs = new Date(value).getTime() - Date.now();
    if (diffMs <= 0) return "Đã quá hạn";

    const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(totalHours / 24);
    const hours = totalHours % 24;
    return `${days} ngày ${hours} giờ`;
}

export function getSubmissionBadge(status?: LatestSubmission["status"]) {
    if (status === "late") {
        return "border-amber-200 bg-amber-50 text-amber-700";
    }

    if (status === "submitted") {
        return "border-green-200 bg-green-50 text-green-700";
    }

    if (status === "draft") {
        return "border-slate-200 bg-slate-100 text-slate-700";
    }

    return "border-blue-200 bg-blue-50 text-blue-700";
}

export function getSubmissionLabel(status?: LatestSubmission["status"]) {
    if (status === "late") return "Đã nộp trễ";
    if (status === "submitted") return "Đã nộp";
    if (status === "draft") return "Đã lưu nháp";
    return "Chưa nộp";
}

export function canSubmitAssignment(assignment: AssignmentItem | null) {
    if (!assignment) return false;
    if (assignment.displayStatus === "closed") return false;

    if (
        assignment.latestSubmission &&
        assignment.latestSubmission.status !== "draft" &&
        !assignment.allowResubmit
    ) {
        return false;
    }

    if (new Date(String(assignment.dueAt)).getTime() < Date.now() && !assignment.allowLateSubmit) {
        return false;
    }

    return true;
}

export function getSubmitButtonLabel(assignment: AssignmentItem | null, submitting: boolean) {
    if (submitting) return "Đang xử lý...";
    if (assignment?.latestSubmission && assignment.allowResubmit) return "Nộp lại bài";
    return "Nộp bài ngay";
}
