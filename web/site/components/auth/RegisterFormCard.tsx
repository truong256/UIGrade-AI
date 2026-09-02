"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SocialLoginButtons } from "./SocialLoginButtons";

type RegisterFormData = {
    title?: string;
    description?: string;
    fullNameLabel?: string;
    fullNamePlaceholder?: string;
    emailLabel?: string;
    emailPlaceholder?: string;
    studentCodeLabel?: string;
    studentCodePlaceholder?: string;
    passwordLabel?: string;
    passwordPlaceholder?: string;
    confirmPasswordLabel?: string;
    confirmPasswordPlaceholder?: string;
    termsTextStart?: string;
    termsLink1?: string;
    termsTextMiddle?: string;
    termsLink2?: string;
    termsTextEnd?: string;
    submitLabel?: string;
    dividerLabel?: string;
    loginText?: string;
    loginLabel?: string;
};

type Props = {
    data?: RegisterFormData;
};

export function RegisterFormCard({ data }: Props) {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [studentCode, setStudentCode] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(true);
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
            setEmailError("Địa chỉ email không hợp lệ");
            return false;
        }
        setEmailError("");
        return true;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        const trimmedName = name.trim();
        const trimmedEmail = email.trim();
        const trimmedStudentCode = studentCode.trim().toUpperCase();

        if (!trimmedName) {
            setError("Vui lòng nhập họ và tên của bạn");
            return;
        }

        const isEmailValid = validateEmail(trimmedEmail);
        if (!isEmailValid) return;

        if (!password.trim()) {
            setError("Vui lòng nhập mật khẩu");
            return;
        }

        if (password.length < 6) {
            setError("Mật khẩu phải có tối thiểu 6 ký tự");
            return;
        }

        if (password !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp");
            return;
        }

        if (!acceptedTerms) {
            setError("Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: trimmedName,
                    email: trimmedEmail,
                    password,
                    confirmPassword,
                    studentCode: trimmedStudentCode || undefined,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                setError(result.message || "Đăng ký tài khoản không thành công");
                return;
            }

            router.push("/ui/dashboard");
            router.refresh();
        } catch {
            setError("Có lỗi xảy ra trong quá trình tạo tài khoản. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-[460px] mx-auto">
            <div className="rounded-3xl border border-blue-100 bg-white p-7 sm:p-8 shadow-xl shadow-blue-950/5">
                <div className="text-center mb-6">
                    <div className="inline-block rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 mb-2">
                        HỆ THỐNG CHẤM ĐIỂM THÔNG MINH
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                        {data?.title || "Tạo tài khoản mới"}
                    </h1>
                    <p className="mt-1.5 text-xs text-slate-500 max-w-sm mx-auto">
                        {data?.description || "Đăng ký tài khoản để bắt đầu trải nghiệm chấm điểm UI Android thông minh."}
                    </p>
                </div>

                <form className="space-y-3.5" onSubmit={handleSubmit} noValidate>
                    {/* Full Name */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            {data?.fullNameLabel || "Họ và tên"} <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder={data?.fullNamePlaceholder || "Nhập họ và tên"}
                            autoComplete="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={loading}
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                            required
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            {data?.emailLabel || "Email"} <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="email"
                            placeholder={data?.emailPlaceholder || "Nhập địa chỉ email"}
                            autoComplete="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (emailError) validateEmail(e.target.value);
                            }}
                            onBlur={() => {
                                if (email) validateEmail(email);
                            }}
                            disabled={loading}
                            className={`h-10 w-full rounded-xl border px-3.5 text-xs outline-none transition focus:ring-2 disabled:bg-slate-50 ${
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

                    {/* Student Code */}
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                            {data?.studentCodeLabel || "Mã sinh viên / MSSV (Nếu có)"}
                        </label>
                        <input
                            type="text"
                            placeholder={data?.studentCodePlaceholder || "Ví dụ: SV2026001"}
                            value={studentCode}
                            onChange={(e) => setStudentCode(e.target.value.toUpperCase())}
                            disabled={loading}
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 font-mono text-xs uppercase text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                        />
                    </div>

                    {/* Password & Confirm */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                {data?.passwordLabel || "Mật khẩu"} <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder={data?.passwordPlaceholder || "Tối thiểu 6 ký tự"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-9 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center text-slate-400 hover:text-slate-600 focus:outline-none transition"
                                >
                                    <span className="material-symbols-outlined text-[16px]">
                                        {showPassword ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                {data?.confirmPasswordLabel || "Xác nhận mật khẩu"} <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder={data?.confirmPasswordPlaceholder || "Nhập lại mật khẩu"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={loading}
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 pr-9 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center text-slate-400 hover:text-slate-600 focus:outline-none transition"
                                >
                                    <span className="material-symbols-outlined text-[16px]">
                                        {showConfirmPassword ? "visibility_off" : "visibility"}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Terms Checkbox */}
                    <div className="flex items-start gap-2 pt-1">
                        <input
                            id="terms"
                            type="checkbox"
                            checked={acceptedTerms}
                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                            className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="terms" className="cursor-pointer text-xs text-slate-600 leading-tight">
                            {data?.termsTextStart || "Tôi đồng ý với"}{" "}
                            <Link href="/terms" className="font-semibold text-blue-600 hover:underline">
                                {data?.termsLink1 || "Điều khoản dịch vụ"}
                            </Link>{" "}
                            {data?.termsTextMiddle || "và"}{" "}
                            <Link href="/privacy" className="font-semibold text-blue-600 hover:underline">
                                {data?.termsLink2 || "Chính sách bảo mật"}
                            </Link>{" "}
                            {data?.termsTextEnd || "của UIGrade AI."}
                        </label>
                    </div>

                    {/* Error Box */}
                    {error && (
                        <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-600 font-medium flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full rounded-xl bg-blue-600 py-3 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                                <span>Đang tạo tài khoản...</span>
                            </>
                        ) : (
                            <span>{data?.submitLabel || "Đăng ký tài khoản"}</span>
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative my-4">
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

                {/* Login Link - Placed DIRECTLY below Google */}
                <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-600">
                        {data?.loginText || "Đã có tài khoản?"}{" "}
                        <Link
                            href="/login"
                            className="font-bold text-blue-600 hover:text-blue-700 transition"
                        >
                            {data?.loginLabel || "Đăng nhập ngay"}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default RegisterFormCard;