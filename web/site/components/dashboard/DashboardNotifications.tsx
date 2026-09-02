import type { DashboardData } from "@/app/ui/dashboard/type/dashboard.type";
import { formatRelativeTime } from "@/app/ui/dashboard/type/dashboard.utils";
import EmptyState from "./EmptyState";

type DashboardNotificationsProps = {
    notifications: DashboardData["notifications"];
};

function getNotificationTone(type: DashboardData["notifications"][number]["type"]) {
    if (type === "warning") {
        return {
            toneClass: "border-amber-500 text-amber-600 bg-amber-50/40",
            icon: "warning",
        };
    }

    if (type === "success") {
        return {
            toneClass: "border-emerald-500 text-emerald-600 bg-emerald-50/40",
            icon: "check_circle",
        };
    }

    return {
        toneClass: "border-sky-500 text-sky-600 bg-sky-50/40",
        icon: "info",
    };
}

export default function DashboardNotifications({
                                                   notifications,
                                               }: DashboardNotificationsProps) {
    return (
        <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm xl:col-span-1">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sky-600 text-[20px]">notifications</span>
                    Thông báo mới
                </h2>
                <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 border border-sky-200">
                    {notifications.length} mục
                </span>
            </div>

            {notifications.length ? (
                <div className="space-y-3">
                    {notifications.map((item) => {
                        const { toneClass, icon } = getNotificationTone(item.type);

                        return (
                            <div
                                key={item.id}
                                className={`rounded-2xl border-l-4 p-3.5 transition hover:shadow-xs ${toneClass}`}
                            >
                                <div className="flex gap-3">
                                    <span className="material-symbols-outlined mt-0.5 text-[20px]">
                                        {icon}
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-900">
                                            {item.title}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                                            {item.description}
                                        </p>
                                        <p className="mt-2 text-[11px] text-slate-400">
                                            {formatRelativeTime(item.occurredAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <EmptyState
                    title="Chưa có thông báo"
                    description="Khi hệ thống phát hiện bài nộp mới hoặc bài cần chấm, thông báo sẽ hiển thị tại đây."
                />
            )}
        </div>
    );
}
