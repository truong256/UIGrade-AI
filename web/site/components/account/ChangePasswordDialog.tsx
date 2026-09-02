"use client";

import { useState } from "react";
import type { ChangePasswordPayload } from "@/app/ui/account/type/account.types";

type Props = {
    open: boolean;
    loading?: boolean;
    onClose: () => void;
    onSubmit: (payload: ChangePasswordPayload) => Promise<void>;
};

const initialForm: ChangePasswordPayload = {
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
};

function ChangePasswordDialogForm({
    loading = false,
    onClose,
    onSubmit,
}: {
    loading?: boolean;
    onClose: () => void;
    onSubmit: (payload: ChangePasswordPayload) => Promise<void>;
}) {
    const [form, setForm] = useState<ChangePasswordPayload>(initialForm);
    const [error, setError] = useState("");

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
            setError("Vui lòng nhập đầy đủ các trường mật khẩu");
            return;
        }

        if (form.newPassword.length < 6) {
            setError("Mật khẩu mới phải có ít nhất 6 ký tự");
            return;
        }

        if (form.newPassword !== form.confirmPassword) {
            setError("Mật khẩu xác nhận không khớp");
            return;
        }

        if (form.currentPassword === form.newPassword) {
            setError("Mật khẩu mới phải khác mật khẩu hiện tại");
            return;
        }

        await onSubmit(form).catch((submitError) => {
            setError(submitError instanceof Error ? submitError.message : "Không thể đổi mật khẩu");
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-md rounded-3xl border border-blue-100 bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between border-b border-blue-100 pb-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                            <span className="material-symbols-outlined text-[20px]">lock_reset</span>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Đổi mật khẩu</h2>
                            <p className="text-xs text-slate-500">Cập nhật mật khẩu để bảo vệ tài khoản</p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Mật khẩu hiện tại</label>
                        <input
                            type="password"
                            value={form.currentPassword}
                            onChange={(e) => setForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="••••••••"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Mật khẩu mới</label>
                        <input
                            type="password"
                            value={form.newPassword}
                            onChange={(e) => setForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="Tối thiểu 6 ký tự"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Xác nhận mật khẩu mới</label>
                        <input
                            type="password"
                            value={form.confirmPassword}
                            onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="Nhập lại mật khẩu mới"
                        />
                    </div>

                    {error && <p className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600">{error}</p>}

                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                        >
                            Hủy
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {loading ? "Đang cập nhật..." : "Xác nhận đổi mật khẩu"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function ChangePasswordDialog({ open, loading = false, onClose, onSubmit }: Props) {
    if (!open) return null;

    return (
        <ChangePasswordDialogForm
            loading={loading}
            onClose={onClose}
            onSubmit={onSubmit}
        />
    );
}
