import type { DashboardData } from "@/app/ui/dashboard/type/dashboard.type";
import { formatRelativeTime } from "@/app/ui/dashboard/type/dashboard.utils";
import EmptyState from "./EmptyState";

type DashboardNotificationsProps = {
    notifications: DashboardData["notifications"];
};

function getNotificationTone(type: DashboardData["notifications"][number]["type"]) {
    if (type === "warning") {
        return {
            toneClass: "border-l-amber-500 bg-amber-50/50 text-amber-900",
            iconClass: "text-amber-600",
            icon: "warning",
        };
    }

    if (type === "success") {
        return {
            toneClass: "border-l-emerald-500 bg-emerald-50/50 text-emerald-900",
            iconClass: "text-emerald-600",
            icon: "check_circle",
        };
    }

    return {
        toneClass: "border-l-blue-500 bg-blue-50/50 text-blue-900",
        iconClass: "text-blue-600",
        icon: "info",
    };
}

export default function DashboardNotifications({
    notifications,
}: DashboardNotificationsProps) {
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs xl:col-span-1">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-bold text-[#172033] flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-600 text-[20px]">notifications</span>
                    Thông báo mới
                </h2>
                <span className="rounded-lg bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60">
                    {notifications.length} mục
                </span>
            </div>

            {notifications.length ? (
                <div className="space-y-2.5">
                    {notifications.map((item) => {
                        const { toneClass, iconClass, icon } = getNotificationTone(item.type);

                        return (
                            <div
                                key={item.id}
                                className={`rounded-xl border border-slate-200/60 border-l-4 p-3.5 transition hover:shadow-xs ${toneClass}`}
                            >
                                <div className="flex gap-2.5">
                                    <span className={`material-symbols-outlined mt-0.5 text-[18px] ${iconClass}`}>
                                        {icon}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-bold text-[#172033]">
                                            {item.title}
                                        </p>
                                        <p className="mt-0.5 text-xs text-[#4A5568] leading-relaxed">
                                            {item.description}
                                        </p>
                                        <p className="mt-1.5 text-[11px] text-slate-400">
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
