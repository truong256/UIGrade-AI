"use client";

import { useEffect, useMemo, useState } from "react";

type ReportData = {
    generatedAt: string;
    filters: {
        classrooms: Array<{
            _id: string;
            name: string;
            code: string;
        }>;
        assignments: Array<{
            _id: string;
            title: string;
            classroomId: string;
        }>;
        selectedClassroomId: string;
        selectedAssignmentId: string;
    };
    stats: {
        averageScore: number;
        gradedCount: number;
        onTimeRate: number;
        onTimeSubmitted: number;
        expectedSubmissions: number;
        totalStudents: number;
        totalClasses: number;
        warningCount: number;
        totalAssignments: number;
        totalSubmissions: number;
    };
    scoreDistribution: Array<{
        label: string;
        count: number;
        percent: number;
    }>;
    completionByGroup: Array<{
        label: string;
        value: number;
        submitted: number;
        expected: number;
    }>;
    highlightStudents: Array<{
        studentId: string;
        initials: string;
        name: string;
        className: string;
        score: number;
        badge: string;
        note: string;
    }>;
    warningStudents: Array<{
        studentId: string;
        initials: string;
        name: string;
        className: string;
        score: number;
        level: string;
        note: string;
    }>;
};

type AiInsightData = {
    generatedAt: string;
    source: "gemini" | "rule-based";
    summary: string;
    alerts: Array<{
        title: string;
        detail: string;
        severity: "low" | "medium" | "high";
    }>;
    recommendations: string[];
    chartInsights: string[];
    studentInsights: Array<{
        studentId: string;
        name: string;
        level: "low" | "medium" | "high";
        reason: string;
        action: string;
    }>;
};

function formatDateTime(value?: string) {
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

function formatScore(value?: number | null) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return "0.0";
    }

    const num = Number(value);
    return Number.isInteger(num) ? `${num}.0` : num.toFixed(1);
}

function formatPercent(value?: number | null) {
    const num = Number(value || 0);
    return `${Number.isInteger(num) ? num : num.toFixed(1)}%`;
}

function buildCsv(data: ReportData) {
    const rows: string[][] = [];

    rows.push(["BÁO CÁO HỌC TẬP"]);
    rows.push([`Cập nhật lúc`, formatDateTime(data.generatedAt)]);
    rows.push([]);

    rows.push(["TỔNG QUAN"]);
    rows.push(["Điểm trung bình", formatScore(data.stats.averageScore)]);
    rows.push(["Số bài đã chấm", String(data.stats.gradedCount)]);
    rows.push(["Tỷ lệ đúng hạn", formatPercent(data.stats.onTimeRate)]);
    rows.push(["Lượt nộp đúng hạn", `${data.stats.onTimeSubmitted}/${data.stats.expectedSubmissions}`]);
    rows.push(["Số học sinh", String(data.stats.totalStudents)]);
    rows.push(["Số lớp", String(data.stats.totalClasses)]);
    rows.push(["Số bài tập", String(data.stats.totalAssignments)]);
    rows.push(["Học sinh cần lưu ý", String(data.stats.warningCount)]);
    rows.push([]);

    rows.push(["PHỔ ĐIỂM"]);
    rows.push(["Khoảng điểm", "Số bài", "Tỷ lệ"]);
    data.scoreDistribution.forEach((item) => {
        rows.push([item.label, String(item.count), formatPercent(item.percent)]);
    });
    rows.push([]);

    rows.push(["HOÀN THÀNH THEO NHÓM"]);
    rows.push(["Nhóm", "Tỷ lệ", "Đúng hạn", "Kỳ vọng"]);
    data.completionByGroup.forEach((item) => {
        rows.push([
            item.label,
            formatPercent(item.value),
            String(item.submitted),
            String(item.expected),
        ]);
    });
    rows.push([]);

    rows.push(["HỌC SINH TIÊU BIỂU"]);
    rows.push(["Họ tên", "Lớp", "Điểm TB", "Ghi chú"]);
    data.highlightStudents.forEach((item) => {
        rows.push([item.name, item.className, formatScore(item.score), item.note]);
    });
    rows.push([]);

    rows.push(["HỌC SINH CẦN LƯU Ý"]);
    rows.push(["Họ tên", "Lớp", "Điểm TB", "Mức độ", "Ghi chú"]);
    data.warningStudents.forEach((item) => {
        rows.push([
            item.name,
            item.className,
            formatScore(item.score),
            item.level,
            item.note,
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

function downloadCsv(data: ReportData) {
    const csv = buildCsv(data);
    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `bao-cao-hoc-tap-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

function StatCard({
                      title,
                      value,
                      subtitle,
                      icon,
                      iconClassName,
                  }: {
    title: string;
    value: string;
    subtitle: string;
    icon: string;
    iconClassName: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClassName}`}>
                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                </span>
            </div>

            <div className="mt-4 text-3xl font-bold text-slate-900">{value}</div>
            <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
        </div>
    );
}

function EmptyState({ title, description }: { title: string; description: string }) {
    return (
        <div className="flex h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center shadow-sm">
            <span className="material-symbols-outlined text-4xl text-slate-300">assessment</span>
            <h3 className="mt-4 text-lg font-semibold text-slate-700">{title}</h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">{description}</p>
        </div>
    );
}

function AlertBadge({ severity }: { severity: "low" | "medium" | "high" }) {
    const className =
        severity === "high"
            ? "bg-red-100 text-red-700"
            : severity === "medium"
                ? "bg-amber-100 text-amber-700"
                : "bg-emerald-100 text-emerald-700";

    const label = severity === "high" ? "Cao" : severity === "medium" ? "Trung bình" : "Thấp";

    return <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${className}`}>{label}</span>;
}

export default function LearningReportPage() {
    const [data, setData] = useState<ReportData | null>(null);
    const [aiData, setAiData] = useState<AiInsightData | null>(null);
    const [classroomId, setClassroomId] = useState("all");
    const [assignmentId, setAssignmentId] = useState("all");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiError, setAiError] = useState("");
    const [aiRefreshKey, setAiRefreshKey] = useState(0);

    useEffect(() => {
        let cancelled = false;

        const loadData = async () => {
            try {
                setLoading(true);
                setError("");
                setAiData(null);
                setAiError("");

                const params = new URLSearchParams();
                if (classroomId !== "all") params.set("classroomId", classroomId);
                if (assignmentId !== "all") params.set("assignmentId", assignmentId);

                const res = await fetch(`/api/reports/learning?${params.toString()}`, {
                    cache: "no-store",
                });
                const json = await res.json().catch(() => ({}));

                if (!res.ok || json.success === false) {
                    throw new Error(json.message || "Không thể tải báo cáo");
                }

                if (cancelled) return;

                const nextData = json.data as ReportData;
                setData(nextData);

                if (classroomId !== "all") {
                    const classroomStillExists = (nextData.filters.classrooms || []).some(
                        (item) => item._id === classroomId
                    );
                    if (!classroomStillExists) {
                        setClassroomId("all");
                    }
                }

                if (assignmentId !== "all") {
                    const assignmentStillExists = (nextData.filters.assignments || []).some(
                        (item) => item._id === assignmentId
                    );
                    if (!assignmentStillExists) {
                        setAssignmentId("all");
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : "Không thể tải báo cáo");
                    setData(null);
                    setAiData(null);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        void loadData();

        return () => {
            cancelled = true;
        };
    }, [classroomId, assignmentId, refreshKey]);

    useEffect(() => {
        if (!data || loading || error) return;

        let cancelled = false;

        const loadAi = async () => {
            try {
                setAiLoading(true);
                setAiError("");

                const params = new URLSearchParams();
                if (classroomId !== "all") params.set("classroomId", classroomId);
                if (assignmentId !== "all") params.set("assignmentId", assignmentId);

                const res = await fetch(`/api/reports/learning/ai-summary?${params.toString()}`, {
                    cache: "no-store",
                });
                const json = await res.json().catch(() => ({}));

                if (!res.ok || json.success === false) {
                    throw new Error(json.message || "Không thể lấy nhận định AI");
                }

                if (cancelled) return;
                setAiData(json.data as AiInsightData);
            } catch (err) {
                if (!cancelled) {
                    setAiError(err instanceof Error ? err.message : "Không thể lấy nhận định AI");
                    setAiData(null);
                }
            } finally {
                if (!cancelled) {
                    setAiLoading(false);
                }
            }
        };

        void loadAi();

        return () => {
            cancelled = true;
        };
    }, [data, classroomId, assignmentId, aiRefreshKey, loading, error]);

    const classroomOptions = useMemo(() => data?.filters.classrooms || [], [data]);
    const assignmentOptions = useMemo(() => data?.filters.assignments || [], [data]);
    const aiStudentInsightMap = useMemo(() => {
        const map = new Map<string, AiInsightData["studentInsights"][number]>();
        (aiData?.studentInsights || []).forEach((item) => {
            if (item.studentId) {
                map.set(item.studentId, item);
            }
        });
        return map;
    }, [aiData]);

    return (
        <div className="space-y-6">
            <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-sm font-medium text-orange-500">Báo cáo học tập</p>
                    <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900">
                        Tổng quan kết quả lớp học
                    </h1>
                    <p className="mt-2 text-sm text-slate-500">
                        Dữ liệu được tổng hợp từ lớp học, bài tập và bài nộp hiện có trong hệ thống.
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                        Cập nhật lần cuối: {data ? formatDateTime(data.generatedAt) : "--"}
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => setRefreshKey((prev) => prev + 1)}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        <span className="material-symbols-outlined text-[18px]">refresh</span>
                        Làm mới dữ liệu
                    </button>

                    <button
                        type="button"
                        onClick={() => data && downloadCsv(data)}
                        disabled={!data}
                        className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        Xuất CSV / Excel
                    </button>
                </div>
            </section>

            <section className="grid grid-cols-1 gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-4">
                <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Lớp học</span>
                    <select
                        value={classroomId}
                        onChange={(event) => {
                            setClassroomId(event.target.value);
                            setAssignmentId("all");
                        }}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                    >
                        <option value="all">Tất cả lớp học</option>
                        {classroomOptions.map((item) => (
                            <option key={item._id} value={item._id}>
                                {item.name || item.code}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-700">Bài tập</span>
                    <select
                        value={assignmentId}
                        onChange={(event) => setAssignmentId(event.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-400"
                    >
                        <option value="all">Tất cả bài tập</option>
                        {assignmentOptions.map((item) => (
                            <option key={item._id} value={item._id}>
                                {item.title}
                            </option>
                        ))}
                    </select>
                </label>

                <div className="rounded-2xl bg-orange-50 p-4 md:col-span-2">
                    <p className="text-sm font-semibold text-orange-700">Gợi ý sử dụng</p>
                    <p className="mt-2 text-sm text-slate-600">
                        Chọn lớp hoặc bài tập để lọc báo cáo theo đúng phạm vi. Hệ thống sẽ tải số liệu trước,
                        sau đó AI mới phân tích
                    </p>
                </div>
            </section>

            {loading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div
                            key={index}
                            className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm"
                        />
                    ))}
                </div>
            ) : error ? (
                <EmptyState title="Không tải được báo cáo" description={error} />
            ) : !data ? (
                <EmptyState
                    title="Chưa có dữ liệu"
                    description="Hiện chưa có dữ liệu để tạo báo cáo. Hãy tạo lớp học, giao bài và nộp bài trước."
                />
            ) : (
                <>
                    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <StatCard
                            title="Điểm trung bình"
                            value={formatScore(data.stats.averageScore)}
                            subtitle={`${data.stats.gradedCount} bài đã có điểm`}
                            icon="star"
                            iconClassName="bg-orange-100 text-orange-500"
                        />
                        <StatCard
                            title="Hoàn thành đúng hạn"
                            value={formatPercent(data.stats.onTimeRate)}
                            subtitle={`${data.stats.onTimeSubmitted}/${data.stats.expectedSubmissions} lượt nộp đúng hạn`}
                            icon="task_alt"
                            iconClassName="bg-blue-100 text-blue-500"
                        />
                        <StatCard
                            title="Số học sinh"
                            value={String(data.stats.totalStudents)}
                            subtitle={`${data.stats.totalClasses} lớp • ${data.stats.totalAssignments} bài tập`}
                            icon="group"
                            iconClassName="bg-purple-100 text-purple-500"
                        />
                        <StatCard
                            title="Cần lưu ý"
                            value={String(data.stats.warningCount)}
                            subtitle="Điểm thấp, thiếu bài hoặc nộp muộn nhiều lần"
                            icon="warning"
                            iconClassName="bg-red-100 text-red-500"
                        />
                    </section>

                    <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-orange-500">auto_awesome</span>
                                        <h2 className="text-lg font-bold text-slate-900">Nhận định AI</h2>
                                        {aiData ? (
                                            <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${aiData.source === "gemini" ? "bg-violet-100 text-violet-700" : "bg-slate-100 text-slate-700"}`}>
                                                {aiData.source === "gemini" ? "Gemini" : "Rule-based"}
                                            </span>
                                        ) : null}
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Tóm tắt xu hướng, cảnh báo bất thường
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        {aiData
                                            ? `AI cập nhật lúc ${formatDateTime(aiData.generatedAt)}`
                                            : aiLoading
                                                ? "AI đang phân tích dữ liệu..."
                                                : "Chưa có nhận định AI"}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setAiRefreshKey((prev) => prev + 1)}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    <span className={`material-symbols-outlined text-[18px] ${aiLoading ? "animate-spin" : ""}`}>
                                        refresh
                                    </span>
                                    Phân tích lại AI
                                </button>
                            </div>

                            {aiLoading && !aiData ? (
                                <div className="space-y-3 py-6">
                                    <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
                                    <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                                    <div className="h-4 w-5/6 animate-pulse rounded bg-slate-200" />
                                </div>
                            ) : aiError ? (
                                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                                    {aiError}
                                </div>
                            ) : aiData ? (
                                <div className="space-y-6 pt-5">
                                    <div className="rounded-2xl bg-orange-50 p-4">
                                        <p className="text-sm leading-7 text-slate-700">{aiData.summary}</p>
                                    </div>

                                    <div>
                                        <div className="mb-3 flex items-center gap-2">
                                            <span className="material-symbols-outlined text-red-500">crisis_alert</span>
                                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                                                Cảnh báo nổi bật
                                            </h3>
                                        </div>
                                        <div className="space-y-3">
                                            {aiData.alerts.length === 0 ? (
                                                <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                                                    Chưa có cảnh báo nào cần ưu tiên ngay.
                                                </div>
                                            ) : (
                                                aiData.alerts.map((item, index) => (
                                                    <div key={`${item.title}-${index}`} className="rounded-2xl border border-slate-200 p-4">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                                                                <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                                                            </div>
                                                            <AlertBadge severity={item.severity} />
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                                    AI chưa có dữ liệu để phân tích.
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-500">lightbulb</span>
                                    <h2 className="text-lg font-bold text-slate-900">Đề xuất từ AI</h2>
                                </div>
                                <div className="space-y-3">
                                    {(aiData?.recommendations || []).length === 0 ? (
                                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                                            Chưa có đề xuất hành động.
                                        </div>
                                    ) : (
                                        aiData?.recommendations.map((item, index) => (
                                            <div key={`${index}-${item}`} className="flex gap-3 rounded-2xl bg-slate-50 p-4">
                                                <span className="material-symbols-outlined mt-0.5 text-orange-500">check_circle</span>
                                                <p className="text-sm leading-6 text-slate-700">{item}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                                <div className="mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-purple-500">monitoring</span>
                                    <h2 className="text-lg font-bold text-slate-900">Phân tích biểu đồ</h2>
                                </div>
                                <div className="space-y-3">
                                    {(aiData?.chartInsights || []).length === 0 ? (
                                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                                            Chưa có nhận xét biểu đồ.
                                        </div>
                                    ) : (
                                        aiData?.chartInsights.map((item, index) => (
                                            <div key={`${index}-${item}`} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                                                {item}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Phổ điểm</h2>
                                    <p className="text-sm text-slate-500">
                                        Phân bố các bài đã được chấm theo thang điểm 10.
                                    </p>
                                </div>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                    {data.stats.totalSubmissions} bài nộp
                                </span>
                            </div>

                            {data.scoreDistribution.every((item) => item.count === 0) ? (
                                <div className="flex h-72 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">
                                    Chưa có bài nào được chấm để hiển thị phổ điểm.
                                </div>
                            ) : (
                                <div className="flex h-72 items-end justify-between gap-3">
                                    {data.scoreDistribution.map((item) => (
                                        <div key={item.label} className="flex flex-1 flex-col items-center">
                                            <div className="mb-2 text-xs font-semibold text-slate-600">
                                                {item.count}
                                            </div>
                                            <div className="flex h-56 w-full items-end rounded-2xl bg-orange-50 px-2 pb-2">
                                                <div
                                                    className="w-full rounded-xl bg-orange-500 transition-all"
                                                    style={{ height: `${Math.max(item.percent, item.count > 0 ? 12 : 0)}%` }}
                                                />
                                            </div>
                                            <div className="mt-2 text-xs text-slate-500">{item.label}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="mb-6 flex items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">Hoàn thành theo nhóm</h2>
                                    <p className="text-sm text-slate-500">
                                        Tỷ lệ nộp đúng hạn được gom theo khối hoặc tên lớp.
                                    </p>
                                </div>
                            </div>

                            {data.completionByGroup.length === 0 ? (
                                <div className="flex h-72 items-center justify-center rounded-2xl bg-slate-50 text-sm text-slate-500">
                                    Chưa có đủ dữ liệu để tính tỷ lệ hoàn thành.
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {data.completionByGroup.map((item) => (
                                        <div key={item.label}>
                                            <div className="mb-2 flex items-center justify-between gap-4 text-sm">
                                                <div>
                                                    <p className="font-semibold text-slate-800">{item.label}</p>
                                                    <p className="text-xs text-slate-400">
                                                        {item.submitted}/{item.expected} lượt đúng hạn
                                                    </p>
                                                </div>
                                                <span className="font-bold text-slate-900">
                                                    {formatPercent(item.value)}
                                                </span>
                                            </div>
                                            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className="h-full rounded-full bg-orange-500"
                                                    style={{ width: `${Math.min(item.value, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 p-6">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-yellow-500">emoji_events</span>
                                    <h2 className="text-lg font-bold text-slate-900">Học sinh tiêu biểu</h2>
                                </div>
                            </div>

                            {data.highlightStudents.length === 0 ? (
                                <div className="p-6 text-sm text-slate-500">
                                    Chưa có đủ bài được chấm để xác định học sinh tiêu biểu.
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {data.highlightStudents.map((item) => (
                                        <div
                                            key={item.studentId}
                                            className="flex items-center justify-between gap-4 p-4 transition hover:bg-slate-50"
                                        >
                                            <div className="flex min-w-0 items-center gap-4">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-500">
                                                    {item.initials}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-slate-900">
                                                        {item.name}
                                                    </p>
                                                    <p className="truncate text-xs text-slate-500">
                                                        {item.className} • Điểm TB: {formatScore(item.score)}
                                                    </p>
                                                    <p className="truncate text-[11px] text-slate-400">{item.note}</p>
                                                </div>
                                            </div>

                                            <span className="rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-green-700">
                                                {item.badge}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 p-6">
                                <div className="flex items-center gap-2">
                                    <span className="material-symbols-outlined text-red-500">priority_high</span>
                                    <h2 className="text-lg font-bold text-slate-900">Cần lưu ý</h2>
                                </div>
                            </div>

                            {data.warningStudents.length === 0 ? (
                                <div className="p-6 text-sm text-slate-500">
                                    Hiện chưa có học sinh nào nằm trong nhóm cần theo dõi.
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-50">
                                    {data.warningStudents.map((item) => {
                                        const insight = aiStudentInsightMap.get(item.studentId);
                                        return (
                                            <div
                                                key={item.studentId}
                                                className="flex items-start justify-between gap-4 p-4 transition hover:bg-slate-50"
                                            >
                                                <div className="flex min-w-0 items-start gap-4">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-600">
                                                        {item.initials}
                                                    </div>
                                                    <div className="min-w-0 space-y-1">
                                                        <p className="truncate text-sm font-bold text-slate-900">
                                                            {item.name}
                                                        </p>
                                                        <p className="truncate text-xs text-slate-500">
                                                            {item.className} • Điểm TB: {formatScore(item.score)}
                                                        </p>
                                                        <p className="text-[11px] text-slate-400">{item.note}</p>
                                                        {insight ? (
                                                            <div className="mt-2 rounded-2xl bg-red-50 p-3">
                                                                <p className="text-[11px] font-semibold uppercase tracking-wider text-red-700">
                                                                    Phân tích AI
                                                                </p>
                                                                <p className="mt-1 text-xs text-slate-700">
                                                                    <span className="font-semibold">Lý do:</span> {insight.reason}
                                                                </p>
                                                                <p className="mt-1 text-xs text-slate-700">
                                                                    <span className="font-semibold">Gợi ý:</span> {insight.action}
                                                                </p>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                <span className="rounded-full bg-red-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-red-700">
                                                    {item.level}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>
                </>
            )}
        </div>
    );
}
