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
        <section className="flex flex-col gap-4 rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-500/5 lg:flex-row lg:items-center lg:justify-between">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 border border-sky-200">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                        UIGrade AI Dashboard
                    </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                    {data?.user.greeting || "Đang tải bảng điều khiển..."}
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    Theo dõi nhanh lớp học, tiến độ nộp bài và các hoạt động chấm điểm tự động mới nhất.
                </p>

                {data ? (
                    <div className="mt-4 flex flex-wrap gap-2.5 text-xs text-slate-600">
                        <span className="rounded-xl bg-sky-50/80 border border-sky-100 px-3 py-1 font-medium text-sky-900">
                            {data.summary.totalClasses} lớp học
                        </span>
                        <span className="rounded-xl bg-sky-50/80 border border-sky-100 px-3 py-1 font-medium text-sky-900">
                            {data.summary.totalAssignments} bài tập
                        </span>
                        <span className="rounded-xl bg-sky-50/80 border border-sky-100 px-3 py-1 font-medium text-sky-900">
                            {data.summary.totalStudents} sinh viên
                        </span>
                        <span className="rounded-xl bg-slate-100 px-3 py-1 text-slate-500">
                            Cập nhật {formatDateTime(data.generatedAt)}
                        </span>
                    </div>
                ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="flex rounded-2xl border border-sky-100 bg-sky-50/50 p-1">
                    {[7, 30, 90].map((value) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => onRangeDaysChange(value as RangeDays)}
                            className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all duration-200 ${
                                rangeDays === value
                                    ? "bg-white text-sky-700 shadow-sm font-bold"
                                    : "text-slate-600 hover:text-sky-900 hover:bg-sky-100/50"
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
                    className="inline-flex items-center gap-2 rounded-2xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-600/20 transition hover:bg-sky-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
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
