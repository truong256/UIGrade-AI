import type { DashboardData, Trend } from "./dashboard.type";

export function formatDateTime(value?: string | null) {
    if (!value) return "--";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";

    return new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}

export function formatRelativeTime(value?: string | null) {
    if (!value) return "Vừa xong";

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Vừa xong";

    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.round(diffMs / 60000);

    if (diffMinutes < 1) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} ngày trước`;
}

export function formatScore(value?: number | null) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return "--";
    }

    const num = Number(value);
    return Number.isInteger(num) ? `${num}.0` : num.toFixed(1);
}

export function formatPercent(value?: number | null) {
    const num = Number(value || 0);
    return `${Number.isInteger(num) ? num : num.toFixed(1)}%`;
}

export function getTrendTone(direction: Trend["direction"], positiveIsGood = true) {
    if (direction === "flat") {
        return "text-slate-500";
    }

    const good = positiveIsGood ? direction === "up" : direction === "down";
    return good ? "text-emerald-600" : "text-red-500";
}

export function buildCsv(data: DashboardData) {
    const rows: string[][] = [];

    rows.push(["DASHBOARD TỔNG QUAN"]);
    rows.push(["Thời điểm xuất", formatDateTime(data.generatedAt)]);
    rows.push(["Khoảng thời gian", `${data.rangeDays} ngày qua`]);
    rows.push([]);

    rows.push(["THỐNG KÊ"]);
    rows.push(["Tổng bài nộp", String(data.stats.totalSubmissions.current)]);
    rows.push(["Tỷ lệ hoàn thành", formatPercent(data.stats.completionRate.current)]);
    rows.push(["Điểm trung bình", `${formatScore(data.stats.averageScore.current)}/10`]);
    rows.push(["Cần xử lý", String(data.stats.needsAttention.current)]);
    rows.push([]);

    rows.push(["LƯỢT NỘP THEO NGÀY"]);
    rows.push(["Ngày", "Số lượt nộp"]);
    data.charts.submissionsByDay.forEach((item) => {
        rows.push([item.label, String(item.value)]);
    });
    rows.push([]);

    rows.push(["ĐIỂM TRUNG BÌNH THEO LỚP"]);
    rows.push(["Lớp", "Điểm TB"]);
    data.charts.averageScoreByClass.forEach((item) => {
        rows.push([item.label, formatScore(item.value)]);
    });
    rows.push([]);

    rows.push(["HOẠT ĐỘNG GẦN ĐÂY"]);
    rows.push(["Học sinh", "Lớp", "Bài tập", "Điểm", "Trạng thái", "Thời gian"]);
    data.recentActivities.forEach((item) => {
        rows.push([
            item.studentName,
            item.className,
            item.assignmentTitle,
            item.score === null ? "--" : formatScore(item.score),
            item.status,
            formatDateTime(item.submittedAt),
        ]);
    });

    return rows
        .map((row) =>
            row
                .map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`)
                .join(",")
        )
        .join("\n");
}

export function downloadCsv(data: DashboardData) {
    const csv = buildCsv(data);
    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dashboard-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}
