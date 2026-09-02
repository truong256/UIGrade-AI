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
        <div className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-sm xl:col-span-2">
            <div className="flex items-center justify-between border-b border-sky-50 px-6 py-5">
                <div>
                    <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sky-600 text-[20px]">history_edu</span>
                        Hoạt động chấm bài gần đây
                    </h2>
                    <p className="mt-1 text-xs text-slate-500">
                        Danh sách bài nộp và trạng thái chấm điểm mới nhất trên hệ thống.
                    </p>
                </div>

                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 border border-sky-200">
                    {activities.length} bài
                </span>
            </div>

            {activities.length ? (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] table-fixed text-left">
                        <thead className="bg-sky-50/50 text-[11px] uppercase tracking-[0.12em] text-slate-500 border-b border-sky-50">
                        <tr>
                            <th className="w-[220px] px-6 py-3.5">Học sinh</th>
                            <th className="w-[150px] px-6 py-3.5">Lớp</th>
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
                                className="transition hover:bg-sky-50/40"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 text-xs font-bold text-white shadow-xs">
                                            {item.studentName.slice(0, 1).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900">
                                                {item.studentName}
                                            </p>
                                            <p className="text-xs text-slate-400">
                                                Bài nộp mới
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                <td className="px-6 py-4 text-sm font-medium text-slate-700">
                                    {item.className}
                                </td>

                                <td className="px-6 py-4 text-sm text-slate-600">
                                    {item.assignmentTitle}
                                </td>

                                <td className="px-6 py-4 text-center">
                                    <span
                                        className={`inline-flex min-w-[76px] items-center justify-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold leading-5 ${item.scoreClassName}`}
                                    >
                                        {item.score === null
                                            ? "Chưa chấm"
                                            : `${formatScore(item.score)}/10`}
                                    </span>
                                </td>

                                <td className="px-6 py-4 text-center">
                                    <ActivityStatus status={item.status} />
                                </td>

                                <td className="px-6 py-4 text-center text-xs text-slate-500">
                                    {formatRelativeTime(item.submittedAt)}
                                </td>

                                <td className="px-6 py-4 text-right">
                                    <Link
                                        href={item.actionHref}
                                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-100 bg-white text-sky-600 shadow-xs transition hover:bg-sky-600 hover:text-white"
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
