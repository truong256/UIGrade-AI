"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SocialLoginButtons } from "./SocialLoginButtons";

type LoginFormData = {
    emailLabel?: string;
    emailPlaceholder?: string;
    passwordLabel?: string;
    passwordPlaceholder?: string;
    forgotPasswordLabel?: string;
    submitLabel?: string;
    dividerLabel?: string;
    signupText?: string;
    signupLabel?: string;
};

type Props = {
    data?: LoginFormData;
};

export function LoginFormCard({ data }: Props) {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [emailError, setEmailError] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const validateEmail = (val: string): boolean => {
        const trimmed = val.trim();
        if (!trimmed) {
            setEmailError("Vui lòng nhập địa chỉ email");
            return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmed)) {
            setEmailError("Địa chỉ email không đúng định dạng (Ví dụ: name@university.edu.vn)");
            return false;
        }
        setEmailError("");
        return true;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        const isEmailValid = validateEmail(email);
        if (!isEmailValid) return;

        if (!password.trim()) {
            setError("Vui lòng nhập mật khẩu");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                setError(result.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
                return;
            }

            router.push("/ui/dashboard");
            router.refresh();
        } catch {
            setError("Có lỗi xảy ra trong quá trình đăng nhập. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[440px] mx-auto">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-7 sm:p-8 shadow-xs">
                <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                    {/* Email Field */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            {data?.emailLabel || "Email"} <span className="text-rose-500">*</span>
                        </label>

                        <input
                            type="email"
                            placeholder={data?.emailPlaceholder || "Nhập địa chỉ email"}
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (emailError) validateEmail(e.target.value);
                            }}
                            onBlur={() => {
                                if (email) validateEmail(email);
                            }}
                            disabled={loading}
                            className={`h-11 w-full rounded-xl border px-3.5 text-sm outline-none transition focus:ring-2 disabled:bg-slate-50 ${
                                emailError
                                    ? "border-rose-300 bg-rose-50/30 text-slate-900 focus:border-rose-500 focus:ring-rose-100"
                                    : "border-slate-200 bg-white text-slate-900 focus:border-blue-500 focus:ring-blue-100"
                            }`}
                            required
                        />

                        {emailError && (
                            <p className="mt-1 text-[11px] font-medium text-rose-600">
                                {emailError}
                            </p>
                        )}
                    </div>

                    {/* Password Field */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold text-slate-700">
                                {data?.passwordLabel || "Mật khẩu"} <span className="text-rose-500">*</span>
                            </label>

                            <Link
                                href="/forgot-password"
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition"
                            >
                                {data?.forgotPasswordLabel || "Quên mật khẩu?"}
                            </Link>
                        </div>

                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder={data?.passwordPlaceholder || "Nhập mật khẩu"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-10 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                                required
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
                            >
                                <span className="material-symbols-outlined text-[18px]">
                                    {showPassword ? "visibility_off" : "visibility"}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Error Box */}
                    {error && (
                        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px] text-rose-600 shrink-0">error</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                                <span>Đang đăng nhập...</span>
                            </>
                        ) : (
                            <span>{data?.submitLabel || "Đăng nhập"}</span>
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-100" />
                    </div>

                    <div className="relative flex justify-center text-xs">
                        <span className="bg-white px-3 font-medium text-slate-400 text-[11px]">
                            {data?.dividerLabel || "Hoặc tiếp tục với"}
                        </span>
                    </div>
                </div>

                {/* Google Sign-In */}
                <SocialLoginButtons disabled={loading} onError={(msg) => setError(msg)} />

                {/* Signup Link */}
                <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                    <p className="text-xs text-[#4A5568]">
                        {data?.signupText || "Chưa có tài khoản?"}{" "}
                        <Link
                            href="/register"
                            className="font-semibold text-blue-600 hover:text-blue-700 transition"
                        >
                            {data?.signupLabel || "Đăng ký ngay"}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default LoginFormCard;