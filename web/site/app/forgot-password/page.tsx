"use client";

import { useState } from "react";
import Link from "next/link";
import { LoginTopBar } from "@/components/auth/LoginTopBar";
import { LoginFooter } from "@/components/auth/LoginFooter";
import { topBarData, footerLinks } from "@/lib/login-data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const validateEmail = (val: string): boolean => {
        const trimmed = val.trim();
        if (!trimmed) {
            setEmailError("Vui lòng nhập địa chỉ email");
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
            setEmailError("Địa chỉ email không hợp lệ");
            return false;
        }
        setEmailError("");
        return true;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        const isValid = validateEmail(email);
        if (!isValid) return;

        try {
            setLoading(true);
            const supabase = getSupabaseBrowserClient();
            const redirectTo = `${window.location.origin}/auth/callback?type=recovery`;

            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
                redirectTo,
            });

            if (resetError) {
                setError(resetError.message || "Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.");
                return;
            }

            setSuccess(true);
        } catch {
            setError("Đã xảy ra lỗi khi gửi yêu cầu. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-sky-50/40 text-slate-900">
            <LoginTopBar data={topBarData} />

            <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
                <div className="w-full max-w-[440px] space-y-5">
                    <div className="text-center">
                        <div className="inline-block rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-700 mb-2.5">
                            KHÔI PHỤC TÀI KHOẢN
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                            Quên mật khẩu?
                        </h1>
                        <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                            Nhập địa chỉ email để nhận hướng dẫn và liên kết đặt lại mật khẩu.
                        </p>
                    </div>

                    <div className="rounded-3xl border border-sky-100 bg-white p-7 sm:p-8 shadow-xl shadow-sky-950/5">
                        {success ? (
                            <div className="text-center space-y-4 py-2">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                                    <span className="material-symbols-outlined text-[28px]">mark_email_read</span>
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-slate-900">Kiểm tra hộp thư đến</h2>
                                    <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                                        Chúng tôi đã gửi liên kết đặt lại mật khẩu đến email{" "}
                                        <span className="font-semibold text-slate-800">{email}</span>. Vui lòng kiểm tra và làm theo hướng dẫn.
                                    </p>
                                </div>

                                <div className="pt-2">
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-600/20 transition hover:bg-sky-700 active:scale-95"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                                        Quay lại Đăng nhập
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                                        Email tài khoản <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        placeholder="Nhập địa chỉ email của bạn"
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (emailError) validateEmail(e.target.value);
                                        }}
                                        disabled={loading}
                                        className={`h-11 w-full rounded-xl border px-3.5 text-xs outline-none transition focus:ring-2 disabled:bg-slate-50 ${
                                            emailError
                                                ? "border-rose-300 bg-rose-50/30 text-slate-900 focus:border-rose-500 focus:ring-rose-100"
                                                : "border-slate-200 bg-white text-slate-900 focus:border-sky-500 focus:ring-sky-100"
                                        }`}
                                        required
                                    />
                                    {emailError && (
                                        <p className="mt-1 text-[11px] font-medium text-rose-600">
                                            {emailError}
                                        </p>
                                    )}
                                </div>

                                {error && (
                                    <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-600 font-medium flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                                        <span>{error}</span>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full rounded-xl bg-sky-600 py-3 text-xs font-bold text-white shadow-md shadow-sky-600/20 transition hover:bg-sky-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                                            <span>Đang gửi liên kết...</span>
                                        </>
                                    ) : (
                                        <span>Gửi liên kết đặt lại</span>
                                    )}
                                </button>

                                <div className="pt-2 text-center">
                                    <Link
                                        href="/login"
                                        className="text-xs font-semibold text-sky-600 hover:text-sky-800 transition inline-flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                                        Quay lại trang Đăng nhập
                                    </Link>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </main>

            <LoginFooter links={footerLinks} />
        </div>
    );
}
