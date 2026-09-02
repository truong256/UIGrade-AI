"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardBottomSection from "@/components/dashboard/DashboardBottomSection";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import DashboardError from "@/components/dashboard/DashboardError";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardLoading from "@/components/dashboard/DashboardLoading";
import DashboardStats from "@/components/dashboard/DashboardStats";
import type { StatCardProps } from "@/components/dashboard/StatCard";
import type { DashboardData, RangeDays } from "./type/dashboard.type";
import { formatPercent, formatScore } from "./type/dashboard.utils";

type DashboardApiResult = {
    data?: DashboardData | null;
    message?: string;
};

export default function DashboardPage() {
    const [rangeDays, setRangeDays] = useState<RangeDays>(7);
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadData = async () => {
            try {
                setLoading(true);
                setError("");

                const res = await fetch(`/api/dashboard/overview?range=${rangeDays}`, {
                    cache: "no-store",
                });

                const json: DashboardApiResult = await res
                    .json()
                    .catch(() => ({} as DashboardApiResult));

                if (!res.ok) {
                    throw new Error(json.message || "Không thể tải dashboard");
                }

                if (!cancelled) {
                    setData(json.data || null);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error ? err.message : "Không thể tải dashboard"
                    );
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
    }, [rangeDays]);

    const statCards = useMemo<StatCardProps[]>(() => {
        if (!data) return [];

        const attentionTitle = data.user.role === "User" ? "Chờ chấm" : "Cần xử lý";

        return [
            {
                title: "Tổng bài nộp",
                value: data.stats.totalSubmissions.current.toLocaleString("vi-VN"),
                subtitle: data.stats.totalSubmissions.subtitle,
                icon: "description",
                iconClassName: "bg-orange-100 text-orange-600",
                trend: data.stats.totalSubmissions.trend,
                suffix: "",
                positiveIsGood: true,
            },
            {
                title: "Tỷ lệ hoàn thành",
                value: formatPercent(data.stats.completionRate.current),
                subtitle: data.stats.completionRate.subtitle,
                icon: "task_alt",
                iconClassName: "bg-blue-100 text-blue-600",
                trend: data.stats.completionRate.trend,
                suffix: "%",
                positiveIsGood: true,
            },
            {
                title: "Điểm trung bình",
                value: `${formatScore(data.stats.averageScore.current)}/10`,
                subtitle: data.stats.averageScore.subtitle,
                icon: "star",
                iconClassName: "bg-yellow-100 text-yellow-600",
                trend: data.stats.averageScore.trend,
                suffix: "",
                positiveIsGood: true,
            },
            {
                title: attentionTitle,
                value: data.stats.needsAttention.current.toLocaleString("vi-VN"),
                subtitle: data.stats.needsAttention.subtitle,
                icon: "schedule",
                iconClassName: "bg-purple-100 text-purple-600",
                trend: data.stats.needsAttention.trend,
                suffix: "",
                positiveIsGood: false,
            },
        ];
    }, [data]);

    return (
        <div className="space-y-6">
            <DashboardHeader
                data={data}
                rangeDays={rangeDays}
                onRangeDaysChange={setRangeDays}
            />

            {loading ? <DashboardLoading /> : null}

            {!loading && error ? <DashboardError error={error} /> : null}

            {!loading && !error && data ? (
                <>
                    <DashboardStats statCards={statCards} />
                    <DashboardCharts data={data} />
                    <DashboardBottomSection data={data} />
                </>
            ) : null}
        </div>
    );
}
