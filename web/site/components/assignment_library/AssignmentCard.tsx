type AssignmentItem = {
    title: string;
    subject: string;
    duration: string;
    status: string;
    statusClassName: string;
    gradientClassName: string;
    icon: string;
    iconColorClassName: string;
    iconBgClassName: string;
    classBadges: string[];
    classText: string;
    createdAt: string;
    actionIcon: string;
};

type Props = {
    item: AssignmentItem;
};

export function AssignmentCard({ item }: Props) {
    return (
        <div className="group overflow-hidden rounded-2xl border border-sky-100 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg shadow-xs">
            <div
                className={`relative flex h-28 items-start justify-between overflow-hidden p-4 ${item.gradientClassName || "bg-gradient-to-br from-sky-600 to-sky-700"}`}
            >
                <div className="absolute -right-4 -top-4 opacity-10 transition-transform group-hover:scale-110">
                    <span className="material-symbols-outlined text-8xl text-white">{item.icon}</span>
                </div>

                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${item.statusClassName}`}>
                    {item.status}
                </span>

                <div className={`rounded-xl p-2 shadow-xs backdrop-blur-md ${item.iconBgClassName || "bg-white/20 text-white"}`}>
                    <span className={`material-symbols-outlined ${item.iconColorClassName || "text-white"}`}>
                        {item.icon === "functions"
                            ? "calculate"
                            : item.icon === "terminal"
                                ? "code"
                                : "android"}
                    </span>
                </div>
            </div>

            <div className="p-4">
                <h3 className="mb-1 text-sm font-bold leading-tight transition-colors group-hover:text-sky-600 line-clamp-1">
                    {item.title}
                </h3>

                <p className="mb-3 text-xs text-slate-500">
                    Môn: {item.subject} • {item.duration}
                </p>

                <div className="mb-3 flex items-center gap-2">
                    <div className="flex -space-x-2">
                        {item.classBadges.map((badge) => (
                            <div
                                key={badge}
                                className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-sky-100 text-[9px] font-bold text-sky-800"
                            >
                                {badge}
                            </div>
                        ))}
                    </div>

                    <span className="text-[11px] text-slate-400">{item.classText}</span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            Ngày tạo
                        </span>
                        <span className="text-xs font-semibold text-slate-700">{item.createdAt}</span>
                    </div>

                    <div className="flex gap-1">
                        <button type="button" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600">
                            <span className="material-symbols-outlined text-[18px]">
                                {item.actionIcon}
                            </span>
                        </button>

                        <button type="button" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-sky-50 hover:text-sky-600">
                            <span className="material-symbols-outlined text-[18px]">more_vert</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}