import { AssignmentStatusBadge } from "./AssignmentStatusBadge";

type AssignmentRow = {
    id: string;
    title: string;
    icon: string;
    className: string;
    assignedDate: string;
    dueDate: string;
    status: "Đang mở" | "Đã đóng" | "Bản nháp";
};

type Props = {
    rows: AssignmentRow[];
};

export function AssignmentTable({ rows }: Props) {
    return (
        <section className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-xs">
            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                    <thead className="bg-blue-50/50 border-b border-blue-100">
                    <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        <th className="px-4 py-3">Tên bài tập</th>
                        <th className="px-4 py-3">Lớp học</th>
                        <th className="px-4 py-3">Ngày giao</th>
                        <th className="px-4 py-3">Hạn nộp</th>
                        <th className="px-4 py-3">Trạng thái</th>
                        <th className="px-4 py-3 text-right">Thao tác</th>
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                    {rows.map((row) => (
                        <tr key={row.id} className="transition hover:bg-blue-50/30">
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                                            row.status === "Đã đóng"
                                                ? "bg-slate-100 text-slate-400"
                                                : "bg-blue-100 text-blue-700"
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">
                                            {row.icon}
                                        </span>
                                    </div>
                                    <span className="text-xs font-bold text-slate-900">{row.title}</span>
                                </div>
                            </td>

                            <td className="px-4 py-3 text-xs font-medium text-slate-500">
                                {row.className}
                            </td>

                            <td className="px-4 py-3 text-xs text-slate-500">
                                {row.assignedDate}
                            </td>

                            <td className="px-4 py-3 text-xs text-slate-500">
                                {row.dueDate}
                            </td>

                            <td className="px-4 py-3">
                                <AssignmentStatusBadge status={row.status} />
                            </td>

                            <td className="px-4 py-3 text-right">
                                <button type="button" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600">
                                    <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}