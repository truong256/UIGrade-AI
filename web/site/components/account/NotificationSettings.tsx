import type { NotificationSettingsPayload } from "@/app/ui/account/type/account.types";

type Props = {
    value: NotificationSettingsPayload;
    loading?: boolean;
    onChange: (next: NotificationSettingsPayload) => void;
};

const rows = [
    {
        key: "emailAssignments" as const,
        title: "Email thông báo bài tập",
        description: "Nhận cập nhật khi có bài tập mới hoặc bài được chấm điểm",
        icon: "mail",
    },
    {
        key: "pushReminders" as const,
        title: "Thông báo đẩy trên thiết bị",
        description: "Nhắc nhở hạn chót, trạng thái chấm và cập nhật lớp học",
        icon: "notifications_active",
    },
];

export function NotificationSettings({ value, loading = false, onChange }: Props) {
    return (
        <section className="rounded-3xl border border-sky-100 bg-white p-5 shadow-xs sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sky-600 text-[20px]">tune</span>
                        Cài đặt thông báo
                    </h2>
                </div>

                {loading && <span className="text-xs font-semibold text-sky-700 animate-pulse">Đang lưu...</span>}
            </div>

            <div className="space-y-3">
                {rows.map((item) => {
                    const enabled = Boolean(value[item.key]);

                    return (
                        <div
                            key={item.key}
                            className="flex items-center justify-between gap-4 rounded-2xl bg-sky-50/40 border border-sky-100 p-3.5"
                        >
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-sky-600 shadow-xs border border-sky-100">
                                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                                </div>

                                <div>
                                    <p className="text-xs font-bold text-slate-800">{item.title}</p>
                                    <p className="mt-0.5 text-[11px] text-slate-500">{item.description}</p>
                                </div>
                            </div>

                            <button
                                type="button"
                                disabled={loading}
                                onClick={() =>
                                    onChange({
                                        ...value,
                                        [item.key]: !enabled,
                                    })
                                }
                                className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                                    enabled ? "bg-sky-600" : "bg-slate-300"
                                } disabled:cursor-not-allowed disabled:opacity-70`}
                                aria-pressed={enabled}
                                aria-label={item.title}
                            >
                                <span
                                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition ${
                                        enabled ? "left-5.5" : "left-0.5"
                                    }`}
                                />
                            </button>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
