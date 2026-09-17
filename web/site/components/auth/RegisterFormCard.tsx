"use client";

// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isEducationEmail } from "@/lib/education-email";
import { validateFullName } from "@/validations/name.validation";
import {
    AuthAlert,
    AuthCard,
    AuthCardHeader,
    AuthDivider,
    AuthInput,
    AuthPasswordInput,
    AuthSubmitButton,
} from "./AuthPrimitives";
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

type RegistrationRole = "student" | "lecturer";

export function RegisterFormCard({ data }: Props) {
    const router = useRouter();
    const submitting = useRef(false);
    const oauthStarting = useRef(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [studentCode, setStudentCode] = useState("");
    const [role, setRole] = useState<RegistrationRole>("student");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [acceptedTerms, setAcceptedTerms] = useState(true);
    const [nameError, setNameError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const passwordError = password.length > 0 && password.trim().length < 6
        ? "Mật khẩu cần ít nhất 6 ký tự."
        : "";
    const confirmPasswordError = confirmPassword.length > 0 && password !== confirmPassword
        ? "Mật khẩu xác nhận chưa khớp."
        : "";

    const validateEmail = (value: string): boolean => {
        if (!value.trim()) {
            setEmailError("Vui lòng nhập địa chỉ email");
            return false;
        }
        if (!isEducationEmail(value)) {
            setEmailError("Vui lòng sử dụng email giáo dục có tên miền .edu.vn.");
            return false;
        }
        setEmailError("");
        return true;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (submitting.current || oauthStarting.current) return;
        setError("");
        setSuccess("");

        const nameValidation = validateFullName(name);
        if (!nameValidation.isValid) {
            setNameError(nameValidation.error || "Vui lòng nhập họ và tên của bạn");
            return;
        }
        setNameError("");

        const trimmedEmail = email.trim();
        const trimmedStudentCode = studentCode.trim().toUpperCase();

        const emailIsValid = validateEmail(trimmedEmail);
        if (!emailIsValid) return;
        if (!password) {
            setError("Vui lòng nhập mật khẩu");
            return;
        }
        if (password.trim().length < 6) return;
        if (!confirmPassword) {
            setError("Vui lòng xác nhận mật khẩu");
            return;
        }
        if (password !== confirmPassword) return;
        if (!acceptedTerms) {
            setError("Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật");
            return;
        }

        try {
            submitting.current = true;
            setLoading(true);
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: nameValidation.normalizedName,
                    email: trimmedEmail,
                    password,
                    confirmPassword,
                    studentCode: role === "student" && trimmedStudentCode ? trimmedStudentCode : undefined,
                    role,
                }),
            });
            const result = await response.json();

            if (!response.ok) {
                setError(result.message || "Đăng ký tài khoản không thành công");
                return;
            }
            if (result.requiresEmailConfirmation) {
                setSuccess(result.message);
                return;
            }

            router.push(result.redirectTo || "/ui/dashboard");
            router.refresh();
        } catch {
            setError("Không thể kết nối đến hệ thống. Vui lòng thử lại.");
        } finally {
            submitting.current = false;
            setLoading(false);
        }
    };

    return (
        <AuthCard wide>
            <AuthCardHeader
                title={data?.title || "Tạo tài khoản"}
                description={data?.description || "Bắt đầu với UIGrade AI"}
            />

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <AuthInput
                    id="register-name"
                    type="text"
                    label={data?.fullNameLabel || "Họ và tên"}
                    placeholder={data?.fullNamePlaceholder || "Nhập họ và tên"}
                    autoComplete="name"
                    value={name}
                    onChange={(event) => {
                        setName(event.target.value);
                        if (nameError) {
                            const val = validateFullName(event.target.value);
                            if (val.isValid) setNameError("");
                        }
                    }}
                    onBlur={() => {
                        if (name) {
                            const val = validateFullName(name);
                            if (!val.isValid) setNameError(val.error || "");
                        }
                    }}
                    disabled={loading || socialLoading}
                    error={nameError}
                    required
                />

                <AuthInput
                    id="register-email"
                    type="email"
                    label={data?.emailLabel || "Email"}
                    placeholder={data?.emailPlaceholder || "student@university.edu.vn"}
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(event) => {
                        setEmail(event.target.value);
                        if (emailError) validateEmail(event.target.value);
                    }}
                    onBlur={() => {
                        if (email) validateEmail(email);
                    }}
                    disabled={loading || socialLoading}
                    error={emailError}
                    hint={emailError ? undefined : "Chỉ dùng email giáo dục thuộc tên miền .edu.vn."}
                    required
                />

                <fieldset>
                    <legend className="mb-2 text-xs font-semibold text-[#44516A]">
                        Vai trò <span className="text-rose-500" aria-hidden="true">*</span>
                    </legend>
                    <div className="auth-role-selector grid grid-cols-2 gap-1.5">
                        {(["student", "lecturer"] as const).map((value) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setRole(value)}
                                disabled={loading || socialLoading}
                                aria-pressed={role === value}
                                className={role === value ? "auth-role-option auth-role-option-selected" : "auth-role-option"}
                            >
                                {value === "student" ? "Sinh viên" : "Giảng viên"}
                            </button>
                        ))}
                    </div>
                </fieldset>

                {role === "student" ? (
                    <AuthInput
                        id="register-student-code"
                        type="text"
                        label={data?.studentCodeLabel || "Mã sinh viên / MSSV (nếu có)"}
                        placeholder={data?.studentCodePlaceholder || "Ví dụ: SV2026001"}
                        autoComplete="off"
                        value={studentCode}
                        onChange={(event) => setStudentCode(event.target.value.toUpperCase())}
                        disabled={loading || socialLoading}
                        className="font-mono uppercase"
                    />
                ) : null}

                <AuthPasswordInput
                    id="register-password"
                    label={data?.passwordLabel || "Mật khẩu"}
                    placeholder={data?.passwordPlaceholder || "Tối thiểu 6 ký tự"}
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={loading || socialLoading}
                    error={passwordError}
                    hint={password ? (passwordError ? undefined : "Mật khẩu đạt yêu cầu.") : "Tối thiểu 6 ký tự."}
                    required
                />

                <AuthPasswordInput
                    id="register-confirm-password"
                    label={data?.confirmPasswordLabel || "Xác nhận mật khẩu"}
                    placeholder={data?.confirmPasswordPlaceholder || "Nhập lại mật khẩu"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    disabled={loading || socialLoading}
                    error={confirmPasswordError}
                    required
                />

                <div className="flex items-start gap-3 pt-1">
                    <input
                        id="register-terms"
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(event) => setAcceptedTerms(event.target.checked)}
                        disabled={loading || socialLoading}
                        className="auth-checkbox mt-0.5"
                    />
                    <label htmlFor="register-terms" className="cursor-pointer text-xs leading-5 text-[#59677F]">
                        {data?.termsTextStart || "Tôi đồng ý với"}{" "}
                        <Link href="/terms" className="auth-text-link">
                            {data?.termsLink1 || "Điều khoản dịch vụ"}
                        </Link>{" "}
                        {data?.termsTextMiddle || "và"}{" "}
                        <Link href="/privacy" className="auth-text-link">
                            {data?.termsLink2 || "Chính sách bảo mật"}
                        </Link>{" "}
                        {data?.termsTextEnd || "của UIGrade AI."}
                    </label>
                </div>

                {error ? <AuthAlert message={error} /> : null}
                {success ? <AuthAlert message={success} tone="success" /> : null}

                <AuthSubmitButton
                    idleLabel={data?.submitLabel || "Đăng ký tài khoản"}
                    loadingLabel="Đang tạo tài khoản..."
                    loading={loading}
                    disabled={socialLoading}
                />
            </form>

            <AuthDivider label={data?.dividerLabel || "Hoặc"} />
            <SocialLoginButtons
                disabled={loading}
                onError={setError}
                onLoadingChange={(isLoading) => {
                    oauthStarting.current = isLoading;
                    setSocialLoading(isLoading);
                }}
            />

            <p className="mt-6 text-center text-sm text-[#59677F]">
                {data?.loginText || "Đã có tài khoản?"}{" "}
                <Link href="/login" className="auth-text-link text-sm">
                    {data?.loginLabel || "Đăng nhập"}
                </Link>
            </p>
        </AuthCard>
    );
}

export default RegisterFormCard;
