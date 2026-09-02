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
        <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sky-600 text-[20px]">show_chart</span>
                        Lượt nộp bài theo thời gian
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                        Số lượt nộp bài trong {rangeDays} ngày gần nhất.
                    </p>
                </div>

                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 border border-sky-200">
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
                                    <stop offset="0%" stopColor="#0284c7" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#f0f9ff"
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
                                cursor={{ stroke: "#bae6fd", strokeWidth: 2 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="value"
                                stroke="#0284c7"
                                strokeWidth={3}
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
