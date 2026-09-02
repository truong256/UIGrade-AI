type Props = {
    status: "Đang mở" | "Đã đóng" | "Bản nháp";
};

export function AssignmentStatusBadge({ status }: Props) {
    const className =
        status === "Đang mở"
            ? "bg-emerald-100 border-emerald-200 text-emerald-700"
            : status === "Đã đóng"
                ? "bg-slate-100 border-slate-200 text-slate-600"
                : "bg-blue-100 border-blue-200 text-blue-700";

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${className}`}
        >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {status}
        </span>
    );
}