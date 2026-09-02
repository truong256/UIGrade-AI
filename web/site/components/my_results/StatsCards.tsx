import type { ResultsStats } from "@/app/ui/my_results/type/my_results.type";

type StatsCardsProps = { stats: ResultsStats };

const cards = [
    { key: "totalVisible", label: "Tổng số bài hiển thị" },
    { key: "gradedCount", label: "Bài đã có điểm" },
    { key: "averageScore", label: "Điểm trung bình" },
    { key: "teacherCommentCount", label: "Bài có nhận xét giảng viên" },
] as const;

export function StatsCards({ stats }: StatsCardsProps) {
    return (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
                <div key={card.key} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-sm text-slate-500">{card.label}</p>
                    <p className="mt-3 text-3xl font-black text-slate-900">{stats[card.key]}</p>
                </div>
            ))}
        </section>
    );
}
