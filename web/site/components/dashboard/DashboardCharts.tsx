"use client";

import dynamic from "next/dynamic";
import type { DashboardData } from "@/app/ui/dashboard/type/dashboard.type";

const ChartSkeleton = () => (
    <div className="h-[340px] rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs animate-pulse flex flex-col justify-between">
        <div className="space-y-2">
            <div className="h-5 w-44 rounded-lg bg-slate-100" />
            <div className="h-3 w-64 rounded-md bg-slate-50" />
        </div>
        <div className="h-48 w-full rounded-xl bg-slate-50/70" />
        <div className="flex justify-between">
            <div className="h-3 w-24 rounded-md bg-slate-100" />
            <div className="h-3 w-24 rounded-md bg-slate-100" />
        </div>
    </div>
);

const SubmissionsByDayChart = dynamic(() => import("./SubmissionsByDayChart"), {
    ssr: false,
    loading: ChartSkeleton,
});

const AverageScoreByClassChart = dynamic(() => import("./AverageScoreByClassChart"), {
    ssr: false,
    loading: ChartSkeleton,
});

type DashboardChartsProps = {
    data: DashboardData;
};

export default function DashboardCharts({ data }: DashboardChartsProps) {
    return (
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <SubmissionsByDayChart
                rangeDays={data.rangeDays}
                data={data.charts.submissionsByDay}
            />

            <AverageScoreByClassChart data={data.charts.averageScoreByClass} />
        </section>
    );
}
