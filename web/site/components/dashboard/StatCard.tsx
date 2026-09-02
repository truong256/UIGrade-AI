import type { Trend } from "@/app/ui/dashboard/type/dashboard.type";
import { getTrendTone } from "@/app/ui/dashboard/type/dashboard.utils";

export type StatCardProps = {
    title: string;
    value: string;
    subtitle: string;
    icon: string;
    iconClassName: string;
    trend: Trend;
    suffix?: string;
    positiveIsGood?: boolean;
};

export default function StatCard({
                                     title,
                                     value,
                                     subtitle,
                                     icon,
                                     iconClassName,
                                     trend,
                                     suffix = "",
                                     positiveIsGood = true,
                                 }: StatCardProps) {
    const toneClass = getTrendTone(trend.direction, positiveIsGood);

    return (
        <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm shadow-sky-500/5 transition hover:-translate-y-0.5 hover:shadow-md hover:border-sky-200">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                        {title}
                    </p>
                    <div className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                        {value}
                    </div>
                </div>

                <span
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${iconClassName}`}
                >
                    <span className="material-symbols-outlined text-[24px]">
                        {icon}
                    </span>
                </span>
            </div>

            <div className="mt-3 flex items-center gap-2 text-xs">
                <span className={`inline-flex items-center gap-0.5 font-bold ${toneClass}`}>
                    <span className="material-symbols-outlined text-[16px]">
                        {trend.direction === "flat"
                            ? "trending_flat"
                            : trend.direction === "up"
                                ? "arrow_upward"
                                : "arrow_downward"}
                    </span>
                    {trend.absolute}
                    {suffix}
                </span>
                <span className="text-slate-400">so với kỳ trước</span>
            </div>

            <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
        </div>
    );
}
