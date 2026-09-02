"use client";

import { useEffect, useMemo, useState } from "react";
import { pageInfo, sidebarGroups, versionInfo } from "@/lib/server-config-data";

type ServerConfigValue = {
    judge: {
        serverUrl: string;
        apiKey: string;
        hasApiKey: boolean;
    };
    limits: {
        maxRuntimeMs: number;
        maxMemoryMb: number;
    };
    email: {
        enabled: boolean;
        smtpHost: string;
        smtpPort: number;
        secure: boolean;
        smtpUser: string;
        smtpPass: string;
        hasSmtpPass: boolean;
        senderName: string;
        senderEmail: string;
        notifyOnNewAssignment: boolean;
        notifyBeforeDue: boolean;
        reminderBeforeHours: number[];
        notifyAtDue: boolean;
        testReceiverEmail: string;
    };
    backup: {
        backupFrequency: string;
        cloudProvider: string;
    };
    updatedAt?: string;
};

type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data?: T;
};

const defaultValue: ServerConfigValue = {
    judge: {
        serverUrl: "https://judge.autograde.io/v1/api",
        apiKey: "",
        hasApiKey: false,
    },
    limits: {
        maxRuntimeMs: 1000,
        maxMemoryMb: 256,
    },
    email: {
        enabled: false,
        smtpHost: "smtp.gmail.com",
        smtpPort: 587,
        secure: false,
        smtpUser: "",
        smtpPass: "",
        hasSmtpPass: false,
        senderName: "AutoGrade",
        senderEmail: "",
        notifyOnNewAssignment: true,
        notifyBeforeDue: true,
        reminderBeforeHours: [24, 3],
        notifyAtDue: true,
        testReceiverEmail: "",
    },
    backup: {
        backupFrequency: "daily_0000",
        cloudProvider: "google_drive",
    },
};

async function parseJsonSafe<T>(response: Response): Promise<T | Record<string, never>> {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

function formatUpdatedAt(value?: string) {
    if (!value) return versionInfo.updatedAt;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return versionInfo.updatedAt;

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            aria-pressed={checked}
            aria-label={label}
            className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-sky-600" : "bg-slate-300"}`}
        >
            <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${checked ? "left-6" : "left-1"}`}
            />
        </button>
    );
}

export function ServerConfigClient() {
    const [form, setForm] = useState<ServerConfigValue>(defaultValue);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [runningReminder, setRunningReminder] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [showApiKey, setShowApiKey] = useState(false);
    const [showSmtpPass, setShowSmtpPass] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch("/api/server-config", {
                    cache: "no-store",
                });
                const json = (await parseJsonSafe<ApiResponse<ServerConfigValue>>(response)) as ApiResponse<ServerConfigValue>;

                if (!response.ok || !json.success || !json.data) {
                    throw new Error(json.message || "Không thể tải cấu hình hệ thống");
                }

                setForm(json.data);
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : "Không thể tải cấu hình hệ thống");
            } finally {
                setLoading(false);
            }
        };

        void loadData();
    }, []);

    useEffect(() => {
        if (!message && !error) return;
        const timer = window.setTimeout(() => {
            setMessage("");
            setError("");
        }, 3500);

        return () => window.clearTimeout(timer);
    }, [message, error]);

    const reminderHoursText = useMemo(
        () => form.email.reminderBeforeHours.join(", "),
        [form.email.reminderBeforeHours]
    );

    const handleSave = async () => {
        try {
            setSaving(true);
            setError("");
            setMessage("");

            const response = await fetch("/api/server-config", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });

            const json = (await parseJsonSafe<ApiResponse<ServerConfigValue>>(response)) as ApiResponse<ServerConfigValue>;

            if (!response.ok || !json.success || !json.data) {
                throw new Error(json.message || "Không thể lưu cấu hình");
            }

            setForm(json.data);
            setMessage(json.message || "Lưu cấu hình thành công");
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Không thể lưu cấu hình");
        } finally {
            setSaving(false);
        }
    };

    const handleSendTestEmail = async () => {
        try {
            setTesting(true);
            setError("");
            setMessage("");

            const response = await fetch("/api/server-config/test-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    to: form.email.testReceiverEmail,
                }),
            });

            const json = (await parseJsonSafe<ApiResponse<{ to: string }>>(response)) as ApiResponse<{ to: string }>;

            if (!response.ok || !json.success) {
                throw new Error(json.message || "Không thể gửi email thử");
            }

            setMessage(json.message || "Đã gửi email thử thành công");
        } catch (testError) {
            setError(testError instanceof Error ? testError.message : "Không thể gửi email thử");
        } finally {
            setTesting(false);
        }
    };

    const handleRunReminder = async () => {
        try {
            setRunningReminder(true);
            setError("");
            setMessage("");

            const response = await fetch("/api/notifications/assignment-reminders", {
                method: "POST",
            });

            const json = (await parseJsonSafe<ApiResponse<{ sent: number; checkedAssignments: number; failed: number }>>(response)) as ApiResponse<{ sent: number; checkedAssignments: number; failed: number }>;

            if (!response.ok || !json.success) {
                throw new Error(json.message || "Không thể chạy tác vụ nhắc hạn");
            }

            const sent = json.data?.sent ?? 0;
            const checkedAssignments = json.data?.checkedAssignments ?? 0;
            const failed = json.data?.failed ?? 0;

            setMessage(`Đã quét ${checkedAssignments} bài tập, gửi ${sent} email${failed ? `, lỗi ${failed}` : ""}.`);
        } catch (jobError) {
            setError(jobError instanceof Error ? jobError.message : "Không thể chạy tác vụ nhắc hạn");
        } finally {
            setRunningReminder(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen overflow-hidden">
                <main className="flex-1 p-8">
                    <div className="mx-auto max-w-5xl space-y-6">
                        <div className="h-24 animate-pulse rounded-3xl bg-white shadow-sm" />
                        <div className="h-60 animate-pulse rounded-3xl bg-white shadow-sm" />
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="h-72 animate-pulse rounded-3xl bg-white shadow-sm" />
                            <div className="h-72 animate-pulse rounded-3xl bg-white shadow-sm" />
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen overflow-hidden">

            <main className="flex-1 overflow-y-auto p-8">
                <div className="mx-auto max-w-5xl space-y-8">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{pageInfo.title}</h1>
                        <p className="mt-2 text-slate-500">{pageInfo.description}</p>
                    </div>

                    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 border-b border-slate-100 p-6">
                            <span className="material-symbols-outlined text-sky-600">api</span>
                            <h2 className="text-lg font-bold">Thông tin kết nối API</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">URL Server Chấm bài</label>
                                <input
                                    type="text"
                                    value={form.judge.serverUrl}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            judge: {
                                                ...prev.judge,
                                                serverUrl: e.target.value,
                                            },
                                        }))
                                    }
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">API Key</label>
                                <div className="relative">
                                    <input
                                        type={showApiKey ? "text" : "password"}
                                        value={form.judge.apiKey}
                                        placeholder={form.judge.hasApiKey ? "Đã lưu API key, để trống nếu không đổi" : "Nhập API key"}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                judge: {
                                                    ...prev.judge,
                                                    apiKey: e.target.value,
                                                },
                                            }))
                                        }
                                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowApiKey((prev) => !prev)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600"
                                    >
                                        <span className="material-symbols-outlined">{showApiKey ? "visibility_off" : "visibility"}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                        <div className="flex items-center gap-3 border-b border-slate-100 p-6">
                            <span className="material-symbols-outlined text-sky-600">timer</span>
                            <h2 className="text-lg font-bold">Thiết lập giới hạn mặc định</h2>
                        </div>

                        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Thời gian chạy tối đa (ms)</label>
                                <input
                                    type="number"
                                    min={100}
                                    value={form.limits.maxRuntimeMs}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            limits: {
                                                ...prev.limits,
                                                maxRuntimeMs: Number(e.target.value || 0),
                                            },
                                        }))
                                    }
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />
                                <p className="text-xs text-slate-500">Giới hạn thời gian thực thi mặc định cho mỗi testcase.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Bộ nhớ tối đa (MB)</label>
                                <input
                                    type="number"
                                    min={64}
                                    value={form.limits.maxMemoryMb}
                                    onChange={(e) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            limits: {
                                                ...prev.limits,
                                                maxMemoryMb: Number(e.target.value || 0),
                                            },
                                        }))
                                    }
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />
                                <p className="text-xs text-slate-500">Giới hạn RAM tối đa mặc định cho server chấm bài.</p>
                            </div>
                        </div>
                    </section>

                    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
                        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-6">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-sky-600">mail</span>
                                    <div>
                                        <h2 className="text-lg font-bold">Email thông báo</h2>
                                        <p className="text-sm text-slate-500">Bật để gửi mail cho sinh viên khi có bài mới và nhắc hạn nộp.</p>
                                    </div>
                                </div>
                                <Toggle
                                    checked={form.email.enabled}
                                    onChange={(value) =>
                                        setForm((prev) => ({
                                            ...prev,
                                            email: {
                                                ...prev.email,
                                                enabled: value,
                                            },
                                        }))
                                    }
                                    label="Bật email thông báo"
                                />
                            </div>

                            <div className="space-y-6 p-6">
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">SMTP Host</label>
                                        <input
                                            type="text"
                                            value={form.email.smtpHost}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    email: {
                                                        ...prev.email,
                                                        smtpHost: e.target.value,
                                                    },
                                                }))
                                            }
                                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">SMTP Port</label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={65535}
                                            value={form.email.smtpPort}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    email: {
                                                        ...prev.email,
                                                        smtpPort: Number(e.target.value || 0),
                                                    },
                                                }))
                                            }
                                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">SMTP Username</label>
                                        <input
                                            type="email"
                                            value={form.email.smtpUser}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    email: {
                                                        ...prev.email,
                                                        smtpUser: e.target.value,
                                                    },
                                                }))
                                            }
                                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">App Password SMTP</label>
                                        <div className="relative">
                                            <input
                                                type={showSmtpPass ? "text" : "password"}
                                                value={form.email.smtpPass}
                                                placeholder={form.email.hasSmtpPass ? "Đã lưu app password, để trống nếu không đổi" : "Nhập app password"}
                                                onChange={(e) =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        email: {
                                                            ...prev.email,
                                                            smtpPass: e.target.value,
                                                        },
                                                    }))
                                                }
                                                className="w-full rounded-2xl border border-slate-200 px-4 py-3 pr-12 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowSmtpPass((prev) => !prev)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-600"
                                            >
                                                <span className="material-symbols-outlined">{showSmtpPass ? "visibility_off" : "visibility"}</span>
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500">Nếu dùng Gmail, hãy dùng App Password thay vì mật khẩu tài khoản.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Tên người gửi</label>
                                        <input
                                            type="text"
                                            value={form.email.senderName}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    email: {
                                                        ...prev.email,
                                                        senderName: e.target.value,
                                                    },
                                                }))
                                            }
                                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Email người gửi</label>
                                        <input
                                            type="email"
                                            value={form.email.senderEmail}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    email: {
                                                        ...prev.email,
                                                        senderEmail: e.target.value,
                                                    },
                                                }))
                                            }
                                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                        />
                                    </div>
                                </div>

                                <div className="rounded-3xl bg-slate-50 p-4">
                                    <div className="mb-4 flex items-center gap-3">
                                        <input
                                            id="smtp-secure"
                                            type="checkbox"
                                            checked={form.email.secure}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    email: {
                                                        ...prev.email,
                                                        secure: e.target.checked,
                                                    },
                                                }))
                                            }
                                            className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                        />
                                        <label htmlFor="smtp-secure" className="text-sm font-medium text-slate-700">
                                            Dùng kết nối bảo mật ngay từ đầu (secure)
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0 flex-1">
                                                    <p className="whitespace-nowrap text-sm font-semibold text-slate-800">
                                                        Bài tập mới
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Gửi ngay khi giáo viên tạo hoặc công bố bài tập
                                                    </p>
                                                </div>
                                                <div className="shrink-0">
                                                    <Toggle
                                                        checked={form.email.notifyOnNewAssignment}
                                                        onChange={(value) =>
                                                            setForm((prev) => ({
                                                                ...prev,
                                                                email: {
                                                                    ...prev.email,
                                                                    notifyOnNewAssignment: value,
                                                                },
                                                            }))
                                                        }
                                                        label="Thông báo bài tập mới"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0 flex-1">
                                                    <p className="whitespace-nowrap text-sm font-semibold text-slate-800">
                                                        Sắp đến hạn
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Nhắc sinh viên chưa nộp trước hạn
                                                    </p>
                                                </div>
                                                <div className="shrink-0">
                                                    <Toggle
                                                        checked={form.email.notifyBeforeDue}
                                                        onChange={(value) =>
                                                            setForm((prev) => ({
                                                                ...prev,
                                                                email: {
                                                                    ...prev.email,
                                                                    notifyBeforeDue: value,
                                                                },
                                                            }))
                                                        }
                                                        label="Nhắc trước hạn"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl bg-white px-4 py-4 shadow-sm">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="min-w-0 flex-1">
                                                    <p className="whitespace-nowrap text-sm font-semibold text-slate-800">
                                                        Đến hạn nộp
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        Gửi khi bài tập vừa đến hạn nộp
                                                    </p>
                                                </div>
                                                <div className="shrink-0">
                                                    <Toggle
                                                        checked={form.email.notifyAtDue}
                                                        onChange={(value) =>
                                                            setForm((prev) => ({
                                                                ...prev,
                                                                email: {
                                                                    ...prev.email,
                                                                    notifyOnDue: value,
                                                                },
                                                            }))
                                                        }
                                                        label="Thông báo đến hạn"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Mốc nhắc trước hạn (giờ)</label>
                                        <input
                                            type="text"
                                            value={reminderHoursText}
                                            onChange={(e) => {
                                                const next = e.target.value
                                                    .split(",")
                                                    .map((item) => Number(item.trim()))
                                                    .filter((item) => Number.isFinite(item) && item > 0);

                                                setForm((prev) => ({
                                                    ...prev,
                                                    email: {
                                                        ...prev.email,
                                                        reminderBeforeHours: next,
                                                    },
                                                }));
                                            }}
                                            placeholder="Ví dụ: 24, 3"
                                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                        />
                                        <p className="text-xs text-slate-500">Hệ thống sẽ gửi một lần ở từng mốc. Ví dụ 24, 3 nghĩa là trước hạn 24 giờ và 3 giờ.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Email nhận thử</label>
                                        <input
                                            type="email"
                                            value={form.email.testReceiverEmail}
                                            onChange={(e) =>
                                                setForm((prev) => ({
                                                    ...prev,
                                                    email: {
                                                        ...prev.email,
                                                        testReceiverEmail: e.target.value,
                                                    },
                                                }))
                                            }
                                            placeholder="example@gmail.com"
                                            className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <button
                                        type="button"
                                        onClick={handleSendTestEmail}
                                        disabled={testing}
                                        className="rounded-2xl border border-sky-200 px-5 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {testing ? "Đang gửi email thử..." : "Gửi email thử"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleRunReminder}
                                        disabled={runningReminder}
                                        className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        {runningReminder ? "Đang chạy nhắc hạn..." : "Chạy kiểm tra nhắc hạn ngay"}
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center gap-3 border-b border-slate-100 p-6">
                                <span className="material-symbols-outlined text-sky-600">cloud_sync</span>
                                <h2 className="text-lg font-bold">Sao lưu dữ liệu</h2>
                            </div>

                            <div className="space-y-5 p-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Tần suất sao lưu</label>
                                    <select
                                        value={form.backup.backupFrequency}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                backup: {
                                                    ...prev.backup,
                                                    backupFrequency: e.target.value,
                                                },
                                            }))
                                        }
                                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    >
                                        <option value="daily_0000">Hàng ngày (00:00)</option>
                                        <option value="weekly_sunday">Hàng tuần (Chủ nhật)</option>
                                        <option value="monthly_1st">Ngày 1 hàng tháng</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-slate-700">Lưu trữ đám mây</label>
                                    <select
                                        value={form.backup.cloudProvider}
                                        onChange={(e) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                backup: {
                                                    ...prev.backup,
                                                    cloudProvider: e.target.value,
                                                },
                                            }))
                                        }
                                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    >
                                        <option value="google_drive">Google Drive</option>
                                        <option value="onedrive">OneDrive</option>
                                        <option value="dropbox">Dropbox</option>
                                        <option value="local">Lưu cục bộ</option>
                                    </select>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
                        <div>
                            <p className="text-sm font-semibold text-slate-800">Lưu cấu hình hệ thống</p>
                            <p className="text-xs text-slate-500">API key và app password đã lưu sẽ được giữ nguyên nếu bạn để trống ô tương ứng.</p>
                        </div>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="rounded-2xl bg-sky-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-sky-600/20 transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {saving ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </div>
                </div>
            </main>

            {(message || error) && (
                <div
                    className={`fixed bottom-6 right-6 z-50 rounded-2xl px-4 py-3 text-sm font-medium text-white shadow-2xl ${
                        error ? "bg-red-500" : "bg-slate-900"
                    }`}
                >
                    {error || message}
                </div>
            )}
        </div>
    );
}
