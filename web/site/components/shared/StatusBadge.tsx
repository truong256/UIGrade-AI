import type { ReactNode } from "react";

export type StatusColorType = "success" | "warning" | "error" | "info" | "neutral";

type StatusBadgeProps = {
    label: string;
    variant?: StatusColorType;
    icon?: string;
    className?: string;
    customContent?: ReactNode;
};

const variantStyles: Record<StatusColorType, { bg: string; text: string; iconColor: string; border: string }> = {
    success: {
        bg: "bg-emerald-50 text-emerald-700",
        text: "text-emerald-700",
        iconColor: "text-emerald-600",
        border: "border-emerald-200/60",
    },
    warning: {
        bg: "bg-amber-50 text-amber-700",
        text: "text-amber-700",
        iconColor: "text-amber-600",
        border: "border-amber-200/60",
    },
    error: {
        bg: "bg-red-50 text-red-700",
        text: "text-red-700",
        iconColor: "text-red-600",
        border: "border-red-200/60",
    },
    info: {
        bg: "bg-blue-50 text-blue-700",
        text: "text-blue-700",
        iconColor: "text-blue-600",
        border: "border-blue-200/60",
    },
    neutral: {
        bg: "bg-slate-100 text-slate-700",
        text: "text-slate-700",
        iconColor: "text-slate-500",
        border: "border-slate-200/60",
    },
};

export function StatusBadge({
    label,
    variant = "neutral",
    icon,
    className = "",
    customContent,
}: StatusBadgeProps) {
    const style = variantStyles[variant] || variantStyles.neutral;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-0.5 text-xs font-semibold leading-normal transition-colors shrink-0 ${style.bg} ${style.border} ${className}`}
        >
            {icon && (
                <span className={`material-symbols-outlined text-[14px] ${style.iconColor}`}>
                    {icon}
                </span>
            )}
            {customContent ? customContent : <span>{label}</span>}
        </span>
    );
}

/**
 * Android-aligned Assignment Status Badge mapping
 */
export function AssignmentStatusBadge({ status }: { status: string }) {
    const s = (status || "").toUpperCase();

    switch (s) {
        case "UPCOMING":
            return <StatusBadge label="Sắp mở" variant="info" icon="schedule" />;
        case "NOT_SUBMITTED":
        case "UNSUBMITTED":
            return <StatusBadge label="Chưa nộp" variant="neutral" icon="radio_button_unchecked" />;
        case "DRAFT":
            return <StatusBadge label="Đang soạn" variant="warning" icon="edit_note" />;
        case "SUBMITTED":
            return <StatusBadge label="Đã nộp" variant="info" icon="check_circle" />;
        case "LATE":
            return <StatusBadge label="Nộp muộn" variant="warning" icon="schedule" />;
        case "GRADING":
            return <StatusBadge label="Đang chấm" variant="warning" icon="hourglass_bottom" />;
        case "GRADED":
            return <StatusBadge label="Đã chấm" variant="success" icon="check_circle" />;
        case "OVERDUE":
            return <StatusBadge label="Quá hạn" variant="error" icon="event_busy" />;
        case "CLOSED":
            return <StatusBadge label="Đã đóng" variant="neutral" icon="lock" />;
        case "RESUBMISSION_REQUIRED":
            return <StatusBadge label="Cần nộp lại" variant="error" icon="replay" />;
        default:
            return <StatusBadge label={status} variant="neutral" />;
    }
}

/**
 * Android-aligned Submission Status Badge mapping
 */
export function SubmissionStatusBadge({ status }: { status: string }) {
    const s = (status || "").toLowerCase();

    switch (s) {
        case "completed":
        case "graded":
        case "passed":
            return <StatusBadge label="Hoàn thành" variant="success" icon="check_circle" />;
        case "released":
            return <StatusBadge label="Đã công bố" variant="success" icon="verified" />;
        case "processing":
        case "grading":
        case "running":
            return <StatusBadge label="Đang chấm" variant="info" icon="sync" />;
        case "submitted":
            return <StatusBadge label="Đã nộp" variant="info" icon="check_circle" />;
        case "pending":
        case "waiting":
            return <StatusBadge label="Chờ xử lý" variant="warning" icon="hourglass_bottom" />;
        case "late":
            return <StatusBadge label="Nộp muộn" variant="warning" icon="schedule" />;
        case "failed":
        case "error":
            return <StatusBadge label="Lỗi" variant="error" icon="error" />;
        default:
            return <StatusBadge label={status} variant="neutral" />;
    }
}
