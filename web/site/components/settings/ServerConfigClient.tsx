"use client";

import { useEffect, useMemo, useState } from "react";
import { pageInfo } from "@/lib/server-config-data";

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

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            aria-pressed={checked}
            aria-label={label}
            className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-slate-300"}`}
        >
            <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-transform ${checked ? "translate-x-5.5" : "translate-x-0.5"}`}
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

                setForm({
                    judge: {
                        serverUrl: json.data.judge?.serverUrl || defaultValue.judge.serverUrl,
                        apiKey: "",
                        hasApiKey: Boolean(json.data.judge?.hasApiKey),
                    },
                    limits: {
                        maxRuntimeMs: json.data.limits?.maxRuntimeMs ?? defaultValue.limits.maxRuntimeMs,
                        maxMemoryMb: json.data.limits?.maxMemoryMb ?? defaultValue.limits.maxMemoryMb,
                    },
                    email: {
                        enabled: Boolean(json.data.email?.enabled),
                        smtpHost: json.data.email?.smtpHost || defaultValue.email.smtpHost,
                        smtpPort: json.data.email?.smtpPort || defaultValue.email.smtpPort,
                        secure: Boolean(json.data.email?.secure),
                        smtpUser: json.data.email?.smtpUser || "",
                        smtpPass: "",
                        hasSmtpPass: Boolean(json.data.email?.hasSmtpPass),
                        senderName: json.data.email?.senderName || defaultValue.email.senderName,
                        senderEmail: json.data.email?.senderEmail || "",
                        notifyOnNewAssignment: json.data.email?.notifyOnNewAssignment ?? defaultValue.email.notifyOnNewAssignment,
                        notifyBeforeDue: json.data.email?.notifyBeforeDue ?? defaultValue.email.notifyBeforeDue,
                        reminderBeforeHours: json.data.email?.reminderBeforeHours || defaultValue.email.reminderBeforeHours,
                        notifyAtDue: json.data.email?.notifyAtDue ?? defaultValue.email.notifyAtDue,
                        testReceiverEmail: json.data.email?.testReceiverEmail || "",
                    },
                    backup: {
                        backupFrequency: json.data.backup?.backupFrequency || defaultValue.backup.backupFrequency,
                        cloudProvider: json.data.backup?.cloudProvider || defaultValue.backup.cloudProvider,
                    },
                    updatedAt: json.data.updatedAt,
                });
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : "Không thể tải cấu hình hệ thống");
            } finally {
                setLoading(false);
            }
        };

        void loadData();
    }, []);

    const reminderHoursText = useMemo(() => {
        return (form.email.reminderBeforeHours || []).join(", ");
    }, [form.email.reminderBeforeHours]);

    const handleSave = async () => {
        try {
            setSaving(true);
            setError("");
            setMessage("");

            const payload = {
                judge: {
                    serverUrl: form.judge.serverUrl,
                    ...(form.judge.apiKey ? { apiKey: form.judge.apiKey } : {}),
                },
                limits: form.limits,
                email: {
                    enabled: form.email.enabled,
                    smtpHost: form.email.smtpHost,
                    smtpPort: Number(form.email.smtpPort),
                    secure: form.email.secure,
                    smtpUser: form.email.smtpUser,
                    ...(form.email.smtpPass ? { smtpPass: form.email.smtpPass } : {}),
                    senderName: form.email.senderName,
                    senderEmail: form.email.senderEmail,
                    notifyOnNewAssignment: form.email.notifyOnNewAssignment,
                    notifyBeforeDue: form.email.notifyBeforeDue,
                    reminderBeforeHours: form.email.reminderBeforeHours,
                    notifyAtDue: form.email.notifyAtDue,
                    testReceiverEmail: form.email.testReceiverEmail,
                },
                backup: form.backup,
            };

            const response = await fetch("/api/server-config", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const json = (await parseJsonSafe<ApiResponse<ServerConfigValue>>(response)) as ApiResponse<ServerConfigValue>;

            if (!response.ok || !json.success || !json.data) {
                throw new Error(json.message || "Không thể lưu cấu hình hệ thống");
            }

            setForm((prev) => ({
                ...prev,
                judge: {
                    ...prev.judge,
                    apiKey: "",
                    hasApiKey: Boolean(json.data?.judge?.hasApiKey),
                },
                email: {
                    ...prev.email,
                    smtpPass: "",
                    hasSmtpPass: Boolean(json.data?.email?.hasSmtpPass),
                },
                updatedAt: json.data?.updatedAt,
            }));

            setMessage(json.message || "Lưu cấu hình hệ thống thành công");
        } catch (saveError) {
            setError(saveError instanceof Error ? saveError.message : "Không thể lưu cấu hình hệ thống");
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
                <main className="flex-1 space-y-6">
                    <div className="h-24 animate-pulse rounded-2xl bg-white shadow-xs" />
                    <div className="h-60 animate-pulse rounded-2xl bg-white shadow-xs" />
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="h-72 animate-pulse rounded-2xl bg-white shadow-xs" />
                        <div className="h-72 animate-pulse rounded-2xl bg-white shadow-xs" />
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen overflow-hidden">
            <main className="flex-1 space-y-6">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172033]">{pageInfo.title}</h1>
                    <p className="mt-1 text-sm text-[#4A5568]">{pageInfo.description}</p>
                </div>

                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                    <div className="flex items-center gap-2.5 border-b border-slate-100 p-5">
                        <span className="material-symbols-outlined text-blue-600 text-[22px]">api</span>
                        <h2 className="text-base font-bold text-[#172033]">Thông tin kết nối API</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">URL Server Chấm bài</label>
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
                                className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">API Key</label>
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
                                    className="h-10 w-full rounded-xl border border-slate-200 px-3.5 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowApiKey((prev) => !prev)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                                >
                                    <span className="material-symbols-outlined text-[18px]">{showApiKey ? "visibility_off" : "visibility"}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                    <div className="flex items-center gap-2.5 border-b border-slate-100 p-5">
                        <span className="material-symbols-outlined text-blue-600 text-[22px]">timer</span>
                        <h2 className="text-base font-bold text-[#172033]">Thiết lập giới hạn mặc định</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Thời gian chạy tối đa (ms)</label>
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
                                className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                            <p className="text-[11px] text-slate-500">Giới hạn thời gian thực thi mặc định cho mỗi testcase.</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700">Bộ nhớ tối đa (MB)</label>
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
                                className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                            <p className="text-[11px] text-slate-500">Giới hạn RAM tối đa mặc định cho server chấm bài.</p>
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.6fr_1fr]">
                    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                        <div className="flex items-center justify-between gap-3 border-b border-slate-100 p-5">
                            <div className="flex items-center gap-2.5">
                                <span className="material-symbols-outlined text-blue-600 text-[22px]">mail</span>
                                <div>
                                    <h2 className="text-base font-bold text-[#172033]">Email thông báo</h2>
                                    <p className="text-xs text-[#4A5568]">Bật để gửi mail cho sinh viên khi có bài mới và nhắc hạn nộp.</p>
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

                        <div className="space-y-5 p-5">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700">SMTP Host</label>
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
                                        className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700">SMTP Port</label>
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
                                        className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700">SMTP Username</label>
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
                                        className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700">App Password SMTP</label>
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
                                            className="h-10 w-full rounded-xl border border-slate-200 px-3.5 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowSmtpPass((prev) => !prev)}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">{showSmtpPass ? "visibility_off" : "visibility"}</span>
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-slate-500">Nếu dùng Gmail, hãy dùng App Password thay vì mật khẩu tài khoản.</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700">Tên người gửi</label>
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
                                        className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700">Email người gửi</label>
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
                                        className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/60">
                                <div className="mb-3 flex items-center gap-2.5">
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
                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="smtp-secure" className="text-xs font-medium text-slate-700">
                                        Dùng kết nối bảo mật ngay từ đầu (secure)
                                    </label>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <div className="rounded-xl bg-white px-4 py-3 border border-slate-200/60 shadow-2xs">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-semibold text-[#172033]">
                                                    Bài tập mới
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-[#4A5568]">
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

                                    <div className="rounded-xl bg-white px-4 py-3 border border-slate-200/60 shadow-2xs">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-semibold text-[#172033]">
                                                    Sắp đến hạn
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-[#4A5568]">
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

                                    <div className="rounded-xl bg-white px-4 py-3 border border-slate-200/60 shadow-2xs">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-semibold text-[#172033]">
                                                    Đến hạn nộp
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-[#4A5568]">
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
                                                                notifyAtDue: value,
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

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700">Mốc nhắc trước hạn (giờ)</label>
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
                                        className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                    <p className="text-[11px] text-slate-500">Hệ thống sẽ gửi một lần ở từng mốc. Ví dụ 24, 3 nghĩa là trước hạn 24 giờ và 3 giờ.</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-slate-700">Email nhận thử</label>
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
                                        className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2.5">
                                <button
                                    type="button"
                                    onClick={handleSendTestEmail}
                                    disabled={testing}
                                    className="h-10 rounded-xl border border-blue-200 bg-blue-50/60 px-4 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {testing ? "Đang gửi email thử..." : "Gửi email thử"}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleRunReminder}
                                    disabled={runningReminder}
                                    className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {runningReminder ? "Đang chạy nhắc hạn..." : "Chạy kiểm tra nhắc hạn ngay"}
                                </button>
                            </div>
                        </div>
                    </section>

                    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
                        <div className="flex items-center gap-2.5 border-b border-slate-100 p-5">
                            <span className="material-symbols-outlined text-blue-600 text-[22px]">cloud_sync</span>
                            <h2 className="text-base font-bold text-[#172033]">Sao lưu dữ liệu</h2>
                        </div>

                        <div className="space-y-4 p-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700">Tần suất sao lưu</label>
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
                                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                                >
                                    <option value="daily_0000">Hàng ngày (00:00)</option>
                                    <option value="weekly_sunday">Hàng tuần (Chủ nhật)</option>
                                    <option value="monthly_1st">Ngày 1 hàng tháng</option>
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-700">Lưu trữ đám mây</label>
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
                                    className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
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

                <div className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white/95 p-4 shadow-lg backdrop-blur-md">
                    <div>
                        <p className="text-sm font-semibold text-[#172033]">Lưu cấu hình hệ thống</p>
                        <p className="text-xs text-[#4A5568]">API key và app password đã lưu sẽ được giữ nguyên nếu bạn để trống ô tương ứng.</p>
                    </div>

                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex h-10 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 active:scale-98 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                </div>
            </main>

            {(message || error) && (
                <div
                    className={`fixed bottom-6 right-6 z-50 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-2xl ${
                        error ? "bg-red-600" : "bg-slate-900"
                    }`}
                >
                    {error || message}
                </div>
            )}
        </div>
    );
}
