"use client";

import { useState, type FormEvent } from "react";

type JoinClassDialogProps = {
    open: boolean;
    onClose: () => void;
    onJoin?: (code: string) => Promise<boolean>;
    onSuccess?: () => void | Promise<void>;
    loading?: boolean;
};

export function JoinClassDialog({
                                    open,
                                    onClose,
                                    onJoin,
                                    onSuccess,
                                    loading: externalLoading = false,
                                }: JoinClassDialogProps) {
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [internalLoading, setInternalLoading] = useState(false);

    if (!open) return null;

    const loading = externalLoading || internalLoading;

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        const trimmedCode = code.trim().toUpperCase();

        if (!trimmedCode) {
            setError("Vui lòng nhập mã lớp học do giảng viên cung cấp");
            return;
        }

        try {
            setInternalLoading(true);
            if (onJoin) {
                const success = await onJoin(trimmedCode);
                if (success) {
                    setCode("");
                    onClose();
                    if (onSuccess) await onSuccess();
                }
            } else {
                const response = await fetch("/api/classes/join", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code: trimmedCode }),
                });
                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.message || "Không thể tham gia lớp học");
                }
                setCode("");
                onClose();
                if (onSuccess) await onSuccess();
            }
        } catch (err: any) {
            setError(err.message || "Đã xảy ra lỗi khi tham gia lớp");
        } finally {
            setInternalLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div
                className="w-full max-w-md rounded-3xl border border-sky-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sky-600 text-[22px]">login</span>
                        Tham gia Lớp học
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 transition"
                        aria-label="Đóng dialog"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Mã tham gia lớp học *
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="VD: ANDR2026-L01"
                            autoFocus
                            className="h-12 w-full rounded-2xl border border-slate-200 px-4 text-center text-base font-bold uppercase tracking-widest text-sky-950 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                        />
                        <p className="mt-1 text-[11px] text-slate-500">
                            Nhập mã lớp 6-12 ký tự do giảng viên cung cấp để ghi danh vào lớp.
                        </p>
                    </div>

                    {error ? (
                        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-xs text-red-600 font-medium flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">error</span>
                            {error}
                        </div>
                    ) : null}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                        >
                            Hủy bỏ
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-600/20 hover:bg-sky-700 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
                            {loading ? "Đang tham gia..." : "Ghi danh vào lớp"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default JoinClassDialog;