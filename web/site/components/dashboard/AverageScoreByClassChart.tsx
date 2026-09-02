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
    const barColors = ["#2563EB", "#4F75B9", "#60A5FA", "#93C5FD", "#DCE9FF"];

    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
            <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-base font-bold text-[#172033] flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600 text-[20px]">bar_chart</span>
                        Điểm trung bình theo lớp
                    </h2>
                    <p className="mt-0.5 text-xs text-[#4A5568]">
                        Tổng hợp điểm các bài đã chấm trong kỳ đang xem.
                    </p>
                </div>

                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200/60">
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
                                stroke="#f1f5f9"
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
                                cursor={{ fill: "rgba(37, 99, 235, 0.04)" }}
                            />
                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
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
