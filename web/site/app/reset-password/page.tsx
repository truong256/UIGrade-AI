"use client";

// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import Link from "next/link";
import { useEffect, useState } from "react";
import { LoginFooter } from "@/components/auth/LoginFooter";
import { LoginTopBar } from "@/components/auth/LoginTopBar";
import { footerLinks, topBarData } from "@/lib/login-data";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { mapSupabaseErrorToVietnamese } from "@/lib/supabase/errors";

export default function ResetPasswordPage() {
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [checkingSession, setCheckingSession] = useState(true);
    const [sessionValid, setSessionValid] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        void getSupabaseBrowserClient().auth.getUser().then(({ data, error: userError }) => {
            if (!active) return;
            setSessionValid(Boolean(data.user) && !userError);
            setCheckingSession(false);
        }).catch(() => {
            if (!active) return;
            setSessionValid(false);
            setCheckingSession(false);
        });
        return () => { active = false; };
    }, []);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (submitting) return;
        setError("");

        if (password.length < 8) {
            setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
            return;
        }
        if (password !== confirmation) {
            setError("Mật khẩu xác nhận không khớp.");
            return;
        }

        setSubmitting(true);
        try {
            const supabase = getSupabaseBrowserClient();
            const { error: updateError } = await supabase.auth.updateUser({ password });
            if (updateError) {
                setError(mapSupabaseErrorToVietnamese(updateError));
                return;
            }

            // A recovery session must never become a normal application session.
            // Require the user to authenticate again with the new password.
            const { error: signOutError } = await supabase.auth.signOut({ scope: "global" })
                .catch(() => ({ error: new Error("sign-out unavailable") }));
            if (signOutError) {
                // The logout endpoint clears project cookies even when the remote
                // revocation service is temporarily unavailable.
                const response = await fetch("/api/auth/logout", { method: "POST" });
                if (!response.ok) {
                    setError("Mật khẩu đã đổi nhưng chưa thể kết thúc phiên. Vui lòng đóng trang và đăng nhập lại.");
                    return;
                }
            }
            setSuccess(true);
            setPassword("");
            setConfirmation("");
        } catch {
            setError("Không thể đặt lại mật khẩu. Vui lòng yêu cầu một liên kết mới.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-screen flex-col bg-blue-50/40 text-slate-900">
            <LoginTopBar data={topBarData} />
            <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
                <div className="w-full max-w-[440px] rounded-3xl border border-blue-100 bg-white p-7 shadow-xl shadow-blue-950/5 sm:p-8">
                    <h1 className="text-center text-2xl font-black tracking-tight">Đặt lại mật khẩu</h1>

                    {checkingSession ? (
                        <p className="mt-5 text-center text-sm text-slate-500" role="status">
                            Đang xác minh liên kết khôi phục...
                        </p>
                    ) : success ? (
                        <div className="mt-5 space-y-4 text-center" role="status">
                            <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-700">
                                Mật khẩu đã được cập nhật. Phiên khôi phục đã kết thúc.
                            </p>
                            <Link className="inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700" href="/login">
                                Đăng nhập lại
                            </Link>
                        </div>
                    ) : !sessionValid ? (
                        <div className="mt-5 space-y-4 text-center">
                            <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-medium text-rose-700" role="alert">
                                Liên kết khôi phục không hợp lệ hoặc đã hết hạn.
                            </p>
                            <Link className="font-semibold text-blue-600 hover:text-blue-800" href="/forgot-password">
                                Yêu cầu liên kết mới
                            </Link>
                        </div>
                    ) : (
                        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-slate-700" htmlFor="new-password">
                                    Mật khẩu mới
                                </label>
                                <input
                                    id="new-password"
                                    type="password"
                                    autoComplete="new-password"
                                    minLength={8}
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    disabled={submitting}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-bold text-slate-700" htmlFor="confirm-password">
                                    Xác nhận mật khẩu mới
                                </label>
                                <input
                                    id="confirm-password"
                                    type="password"
                                    autoComplete="new-password"
                                    minLength={8}
                                    value={confirmation}
                                    onChange={(event) => setConfirmation(event.target.value)}
                                    disabled={submitting}
                                    className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                                    required
                                />
                            </div>
                            {error ? (
                                <p className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700" role="alert">
                                    {error}
                                </p>
                            ) : null}
                            <button
                                type="submit"
                                disabled={submitting}
                                className="h-11 w-full rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submitting ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                            </button>
                        </form>
                    )}
                </div>
            </main>
            <LoginFooter links={footerLinks} />
        </div>
    );
}
