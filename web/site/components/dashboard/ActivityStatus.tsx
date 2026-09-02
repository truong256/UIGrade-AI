type ActivityStatusProps = {
    status: string;
};

export default function ActivityStatus({ status }: ActivityStatusProps) {
    const map: Record<string, string> = {
        pending: "bg-slate-100 text-slate-700",
        auto_graded: "bg-emerald-100 text-emerald-700",
        needs_teacher_review: "bg-amber-100 text-amber-700",
        overridden: "bg-blue-100 text-blue-700",
    };

    const labelMap: Record<string, string> = {
        pending: "Chờ chấm",
        auto_graded: "Đã chấm",
        needs_teacher_review: "Cần xem lại",
        overridden: "Đã sửa tay",
    };

    return (
        <span
            className={`inline-flex min-w-[84px] items-center justify-center whitespace-nowrap rounded-full px-3 py-1 text-[11px] font-bold leading-5 ${
                map[status] || "bg-slate-100 text-slate-700"
            }`}
        >
            {labelMap[status] || status}
        </span>
    );
}
