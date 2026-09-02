"use client";

import { useState } from "react";
import type { CurrentUser, EditProfilePayload } from "@/app/ui/account/type/account.types";

type Props = {
    open: boolean;
    user: CurrentUser | null;
    loading?: boolean;
    onClose: () => void;
    onSubmit: (payload: EditProfilePayload) => Promise<void>;
};

function EditProfileDialogForm({
    user,
    loading = false,
    onClose,
    onSubmit,
}: {
    user: CurrentUser;
    loading?: boolean;
    onClose: () => void;
    onSubmit: (payload: EditProfilePayload) => Promise<void>;
}) {
    const [form, setForm] = useState<EditProfilePayload>({
        name: user.name || "",
        email: user.email || "",
        studentCode: user.studentCode || "",
        phone: user.phone || "",
        department: user.department || "",
        cohort: user.cohort || "",
        bio: user.bio || "",
        avatar: user.avatar || "",
    });
    const [error, setError] = useState("");

    const handleChange = (key: keyof EditProfilePayload, value: string) => {
        setForm((prev) => ({
            ...prev,
            [key]: key === "studentCode" ? value.toUpperCase() : value,
        }));
    };

    const handleSave = async () => {
        setError("");

        if (!form.name.trim()) {
            setError("Vui lòng nhập họ và tên");
            return;
        }

        if (!form.email.trim()) {
            setError("Vui lòng nhập email");
            return;
        }

        await onSubmit(form).catch((saveError) => {
            setError(saveError instanceof Error ? saveError.message : "Không thể cập nhật hồ sơ");
        });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-blue-100 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-blue-100 px-6 py-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
                            <span className="material-symbols-outlined text-[20px]">manage_accounts</span>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Chỉnh sửa hồ sơ</h2>
                            <p className="text-xs text-slate-500">Cập nhật thông tin cá nhân và tài khoản</p>
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

                <div className="space-y-4 px-6 py-5">
                    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Họ và tên</label>
                            <input
                                value={form.name}
                                onChange={(e) => handleChange("name", e.target.value)}
                                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                placeholder="Nguyễn Văn A"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Email</label>
                            <input
                                value={form.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                placeholder="example@university.edu.vn"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                                Mã người dùng / MSSV
                            </label>
                            <input
                                value={form.studentCode}
                                onChange={(e) => handleChange("studentCode", e.target.value)}
                                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs font-mono font-bold uppercase outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                placeholder="SV001"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Số điện thoại</label>
                            <input
                                value={form.phone}
                                onChange={(e) => handleChange("phone", e.target.value)}
                                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                placeholder="0912345678"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Khoa / bộ môn</label>
                            <input
                                value={form.department}
                                onChange={(e) => handleChange("department", e.target.value)}
                                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                placeholder="Công nghệ thông tin"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Khóa</label>
                            <input
                                value={form.cohort}
                                onChange={(e) => handleChange("cohort", e.target.value)}
                                className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                placeholder="Khóa 2021"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">URL ảnh đại diện</label>
                        <input
                            value={form.avatar}
                            onChange={(e) => handleChange("avatar", e.target.value)}
                            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="/avatars/default.png hoặc https://..."
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Giới thiệu</label>
                        <textarea
                            value={form.bio}
                            onChange={(e) => handleChange("bio", e.target.value)}
                            rows={3}
                            className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            placeholder="Mô tả ngắn về bạn..."
                        />
                    </div>

                    {error && (
                        <p className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600">
                            {error}
                        </p>
                    )}

                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                        >
                            Hủy
                        </button>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={loading}
                            className="rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {loading ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function EditProfileDialog({
    open,
    user,
    loading = false,
    onClose,
    onSubmit,
}: Props) {
    if (!open || !user) return null;

    return (
        <EditProfileDialogForm
            key={(user as any).id || (user as any)._id || "edit-profile"}
            user={user}
            loading={loading}
            onClose={onClose}
            onSubmit={onSubmit}
        />
    );
}