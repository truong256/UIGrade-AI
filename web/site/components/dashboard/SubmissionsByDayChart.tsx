"use client";

import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type { DashboardData } from "@/app/ui/dashboard/type/dashboard.type";
import EmptyState from "./EmptyState";
import { SubmissionTooltip } from "./ChartTooltips";

type SubmissionsByDayChartProps = {
    rangeDays: number;
    data: DashboardData["charts"]["submissionsByDay"];
};

export default function SubmissionsByDayChart({
    rangeDays,
    data,
}: SubmissionsByDayChartProps) {
    const totalSubmissions = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-base font-bold text-[#172033] flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600 text-[20px]">show_chart</span>
                        Lượt nộp bài theo thời gian
                    </h2>
                    <p className="mt-0.5 text-xs text-[#4A5568]">
                        Số lượt nộp bài trong {rangeDays} ngày gần nhất.
                    </p>
                </div>

                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200/60">
                    {totalSubmissions} lượt
                </span>
            </div>

            {data.length ? (
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient
                                    id="submissionGradientDashboard"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1"
                                >
                                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.25} />
                                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.01} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#f1f5f9"
                            />
                            <XAxis
                                dataKey="label"
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: "#64748b", fontSize: 12 }}
                            />
                            <YAxis
                                allowDecimals={false}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: "#64748b", fontSize: 12 }}
                            />
                            <Tooltip
                                content={<SubmissionTooltip />}
                                cursor={{ stroke: "#93c5fd", strokeWidth: 2 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#2563EB"
                                strokeWidth={2.5}
                                fill="url(#submissionGradientDashboard)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <EmptyState
                    title="Chưa có dữ liệu nộp bài"
                    description="Khi sinh viên bắt đầu nộp bài, biểu đồ này sẽ hiển thị tự động."
                />
            )}
        </div>
    );
}
