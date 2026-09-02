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
        <div className="flex h-full flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md hover:border-blue-200">
            <div>
                <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {title}
                    </p>

                    <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
                    >
                        <span className="material-symbols-outlined text-[22px]">
                            {icon}
                        </span>
                    </span>
                </div>

                <div className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-[#172033]">
                    {value}
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs">
                    <span className={`inline-flex items-center gap-0.5 font-bold ${toneClass}`}>
                        <span className="material-symbols-outlined text-[15px]">
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

                <p className="mt-1 text-xs text-slate-500 line-clamp-1">{subtitle}</p>
            </div>
        </div>
    );
}
