"use client";

import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type { DashboardData } from "@/app/ui/dashboard/type/dashboard.type";
import EmptyState from "./EmptyState";
import { ScoreTooltip } from "./ChartTooltips";

type AverageScoreByClassChartProps = {
    data: DashboardData["charts"]["averageScoreByClass"];
};

export default function AverageScoreByClassChart({
                                                     data,
                                                 }: AverageScoreByClassChartProps) {
    const barColors = ["#0284c7", "#0ea5e9", "#38bdf8", "#7dd3fc", "#bae6fd"];

    return (
        <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sky-600 text-[20px]">bar_chart</span>
                        Điểm trung bình theo lớp
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                        Tổng hợp điểm các bài đã chấm trong kỳ đang xem.
                    </p>
                </div>

                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 border border-sky-200">
                    Tối đa 6 lớp
                </span>
            </div>

            {data.length ? (
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                            barCategoryGap={16}
                        >
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
                                domain={[0, 10]}
                                tickLine={false}
                                axisLine={false}
                                tick={{ fill: "#64748b", fontSize: 12 }}
                            />
                            <Tooltip
                                content={<ScoreTooltip />}
                                cursor={{ fill: "rgba(2, 132, 199, 0.05)" }}
                            />
                            <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                                {data.map((item, index) => (
                                    <Cell
                                        key={`${item.label}-${index}`}
                                        fill={barColors[index % barColors.length]}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <EmptyState
                    title="Chưa có dữ liệu điểm số"
                    description="Các lớp sẽ xuất hiện ở đây sau khi có bài nộp được chấm điểm."
                />
            )}
        </div>
    );
}
