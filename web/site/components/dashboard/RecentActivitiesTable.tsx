import Link from "next/link";
import type { DashboardData } from "@/app/ui/dashboard/type/dashboard.type";
import { formatRelativeTime, formatScore } from "@/app/ui/dashboard/type/dashboard.utils";
import ActivityStatus from "./ActivityStatus";
import EmptyState from "./EmptyState";

type RecentActivitiesTableProps = {
    activities: DashboardData["recentActivities"];
};

export default function RecentActivitiesTable({
    activities,
}: RecentActivitiesTableProps) {
    return (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs xl:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                    <h2 className="text-base font-bold text-[#172033] flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600 text-[20px]">history_edu</span>
                        Hoạt động chấm bài gần đây
                    </h2>
                    <p className="mt-0.5 text-xs text-[#4A5568]">
                        Danh sách bài nộp và trạng thái chấm điểm mới nhất trên hệ thống.
                    </p>
                </div>

                <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200/60">
                    {activities.length} bài
                </span>
            </div>

            {activities.length ? (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] table-fixed text-left">
                        <thead className="bg-slate-50/80 text-xs font-semibold text-slate-600 border-b border-slate-200/80">
                        <tr>
                            <th className="w-[220px] px-6 py-3.5">Học sinh</th>
                            <th className="w-[140px] px-6 py-3.5">Lớp</th>
                            <th className="w-[260px] px-6 py-3.5">Bài tập</th>
                            <th className="w-[120px] px-6 py-3.5 text-center">Điểm</th>
                            <th className="w-[140px] px-6 py-3.5 text-center">Trạng thái</th>
                            <th className="w-[130px] px-6 py-3.5 text-center">Thời gian</th>
                            <th className="w-[80px] px-6 py-3.5 text-right">Xem</th>
                        </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                        {activities.map((item) => (
                            <tr
                                key={item.submissionId}
                                className="transition hover:bg-slate-50/60"
                            >
                                <td className="px-6 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-xs font-bold text-white shadow-xs">
                                            {item.studentName.slice(0, 1).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-[#172033] truncate">
                                                {item.studentName}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                Bài nộp mới
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-6 py-3.5 text-sm font-medium text-slate-700 truncate">
                                    {item.className}
                                </td>

                                <td className="px-6 py-3.5 text-sm text-slate-600 truncate">
                                    {item.assignmentTitle}
                                </td>

                                <td className="px-6 py-3.5 text-center">
                                    <span
                                        className={`inline-flex items-center justify-center whitespace-nowrap rounded-lg px-2.5 py-0.5 text-xs font-bold ${item.scoreClassName}`}
                                    >
                                        {item.score === null
                                            ? "Chưa chấm"
                                            : `${formatScore(item.score)}/10`}
                                    </span>
                                </td>

                                <td className="px-6 py-3.5 text-center">
                                    <ActivityStatus status={item.status} />
                                </td>

                                <td className="px-6 py-3.5 text-center text-xs text-slate-500">
                                    {formatRelativeTime(item.submittedAt)}
                                </td>

                                <td className="px-6 py-3.5 text-right">
                                    <Link
                                        href={item.actionHref}
                                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-blue-600 shadow-xs transition hover:bg-blue-600 hover:text-white"
                                        aria-label="Xem chi tiết chấm bài"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">
                                            visibility
                                        </span>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-6">
                    <EmptyState
                        title="Chưa có hoạt động gần đây"
                        description="Sau khi sinh viên nộp bài, danh sách hoạt động sẽ tự động hiển thị ở đây."
                    />
                </div>
            )}
        </div>
    );
}
