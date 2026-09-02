import type { SubmissionHistoryItem } from "@/app/ui/account/type/account.types";

type Props = {
    items: SubmissionHistoryItem[];
};

function colorClass(color: SubmissionHistoryItem["statusColor"]) {
    if (color === "green") return "bg-emerald-100 text-emerald-700";
    if (color === "orange") return "bg-blue-100 text-blue-700";
    return "bg-slate-100 text-slate-600";
}

function textColorClass(color: SubmissionHistoryItem["statusColor"]) {
    if (color === "green") return "text-emerald-600";
    if (color === "orange") return "text-blue-700 font-bold";
    return "text-slate-600";
}

export function SubmissionHistory({ items }: Props) {
    const shouldScroll = items.length > 3;

    return (
        <section className="pb-6">
            <div className="mb-4 flex items-center justify-between gap-3 px-1">
                <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600 text-[20px]">history</span>
                        Lịch sử hoạt động
                    </h2>
                    <p className="text-xs text-slate-500">Hiển thị bài nộp hoặc hoạt động chấm gần đây nhất.</p>
                </div>

                <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-0.5 text-xs font-bold text-blue-700 shadow-2xs">
                    {items.length} mục
                </span>
            </div>

            <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-xs">
                {!items.length ? (
                    <div className="px-6 py-12 text-center text-xs text-slate-400">
                        Chưa có hoạt động nộp bài nào để hiển thị.
                    </div>
                ) : (
                    <div className={shouldScroll ? "max-h-[360px] overflow-y-auto" : ""}>
                        <div className="divide-y divide-slate-100">
                            {items.map((item) => (
                                <div
                                    key={item._id}
                                    className="flex items-center justify-between gap-4 p-4 transition hover:bg-blue-50/30"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClass(item.statusColor)}`}>
                                            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                                        </div>

                                        <div className="min-w-0">
                                            <p className="truncate text-xs font-bold text-slate-800">{item.title}</p>
                                            <p className="mt-0.5 truncate text-[11px] text-slate-500">{item.secondary}</p>
                                            <p className="mt-0.5 text-[10px] text-slate-400">{item.submittedAt}</p>
                                        </div>
                                    </div>

                                    <div className="shrink-0 text-right">
                                        <p className={`text-xs font-bold ${textColorClass(item.statusColor)}`}>{item.status}</p>
                                        <p className="text-xs font-bold text-blue-950">{item.score}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
