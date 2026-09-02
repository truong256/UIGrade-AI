"use client";

import type { DashboardData, RangeDays } from "@/app/ui/dashboard/type/dashboard.type";
import { downloadCsv, formatDateTime } from "@/app/ui/dashboard/type/dashboard.utils";

type DashboardHeaderProps = {
    data: DashboardData | null;
    rangeDays: RangeDays;
    onRangeDaysChange: (value: RangeDays) => void;
};

export default function DashboardHeader({
    data,
    rangeDays,
    onRangeDaysChange,
}: DashboardHeaderProps) {
    return (
        <section className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs lg:flex-row lg:items-center lg:justify-between">
            <div>
                <div className="flex items-center gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                        UIGrade AI Dashboard
                    </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172033]">
                    {data?.user.greeting || "Đang tải bảng điều khiển..."}
                </h1>

                <p className="mt-1 text-sm text-[#4A5568]">
                    Theo dõi nhanh lớp học, tiến độ nộp bài và các hoạt động chấm điểm tự động mới nhất.
                </p>

                {data ? (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="rounded-lg bg-blue-50/80 border border-blue-100 px-2.5 py-1 font-medium text-blue-900">
                            {data.summary.totalClasses} lớp học
                        </span>
                        <span className="rounded-lg bg-blue-50/80 border border-blue-100 px-2.5 py-1 font-medium text-blue-900">
                            {data.summary.totalAssignments} bài tập
                        </span>
                        <span className="rounded-lg bg-blue-50/80 border border-blue-100 px-2.5 py-1 font-medium text-blue-900">
                            {data.summary.totalStudents} sinh viên
                        </span>
                        <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-slate-500 font-medium">
                            Cập nhật {formatDateTime(data.generatedAt)}
                        </span>
                    </div>
                ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:shrink-0">
                <div className="flex rounded-xl border border-slate-200 bg-slate-50/80 p-1">
                    {[7, 30, 90].map((value) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => onRangeDaysChange(value as RangeDays)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                                rangeDays === value
                                    ? "bg-white text-blue-600 shadow-xs font-bold"
                                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                            }`}
                        >
                            {value} ngày
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => data && downloadCsv(data)}
                    disabled={!data}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 active:scale-98 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <span className="material-symbols-outlined text-[18px]">
                        download
                    </span>
                    Xuất CSV
                </button>
            </div>
        </section>
    );
}
