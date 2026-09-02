import type { ResultsStats } from "@/app/ui/my_results/type/my_results.type";

type StatsCardsProps = { stats: ResultsStats };

const cards = [
    { key: "totalVisible", label: "Tổng số bài hiển thị", icon: "assignment" },
    { key: "gradedCount", label: "Bài đã có điểm", icon: "check_circle" },
    { key: "averageScore", label: "Điểm trung bình", icon: "analytics" },
    { key: "teacherCommentCount", label: "Bài có nhận xét giảng viên", icon: "rate_review" },
] as const;

export function StatsCards({ stats }: StatsCardsProps) {
    return (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
                <div key={card.key} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.label}</p>
                    <p className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-[#172033]">{stats[card.key]}</p>
                </div>
            ))}
        </section>
    );
}
