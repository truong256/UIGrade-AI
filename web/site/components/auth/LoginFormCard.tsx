"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { getAuthErrorMessage, type AuthAlert as AuthErrorAlert } from "@/lib/auth-errors";

type LoginFormData = {
    title?: string;
    description?: string;
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
    initialError?: string;
    initialErrorCode?: string;
    initialErrorMessage?: string;
};

export function LoginFormCard({
    data,
    initialError = "",
    initialErrorCode,
    initialErrorMessage,
}: Props) {
    const router = useRouter();
    const submitting = useRef(false);
    const oauthStarting = useRef(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [loading, setLoading] = useState(false);
    const [socialLoading, setSocialLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(initialError || null);
    const [urlAlert, setUrlAlert] = useState<AuthErrorAlert | null>(() =>
        getAuthErrorMessage(initialErrorCode, initialErrorMessage)
    );

    useEffect(() => {
        if (initialErrorCode) {
            setUrlAlert(getAuthErrorMessage(initialErrorCode, initialErrorMessage));
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const errorCode = params.get("error");
        if (errorCode) {
            setUrlAlert(getAuthErrorMessage(errorCode, params.get("message")));
        }
    }, [initialErrorCode, initialErrorMessage]);

    const validateEmail = (value: string): boolean => {
        const trimmed = value.trim();
        if (!trimmed) {
            setEmailError("Vui lòng nhập địa chỉ email");
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            setEmailError("Địa chỉ email không đúng định dạng (Ví dụ: name@university.edu.vn)");
            return false;
        }
        setEmailError("");
        return true;
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (submitting.current || oauthStarting.current) return;
        setFormError(null);
        setUrlAlert(null);

        const emailIsValid = validateEmail(email);
        const passwordIsValid = Boolean(password.trim());
        setPasswordError(passwordIsValid ? "" : "Vui lòng nhập mật khẩu");
        if (!emailIsValid || !passwordIsValid) return;

        try {
            submitting.current = true;
            setLoading(true);
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim(), password }),
            });
            const result = await response.json();

            if (!response.ok) {
                setFormError(result.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
                return;
            }

            router.push(result.redirectTo || "/ui/dashboard");
            router.refresh();
        } catch {
            setFormError("Không thể kết nối đến hệ thống. Vui lòng thử lại.");
        } finally {
            submitting.current = false;
            setLoading(false);
        }
    };

    const activeAlert: AuthErrorAlert | null = formError
        ? formError.includes("Không thể đăng nhập Google")
            ? { message: "Hãy đăng nhập tài khoản Gmail .edu.vn" }
            : { message: formError }
        : urlAlert;

    return (
        <AuthCard>
            <AuthCardHeader
                title={data?.title || "Chào mừng trở lại"}
                description={data?.description || "Đăng nhập để tiếp tục"}
            />

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <AuthInput
                    id="login-email"
                    type="email"
                    icon="mail"
                    label={data?.emailLabel || "Email"}
                    placeholder={data?.emailPlaceholder || "Nhập địa chỉ email"}
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
                    required
                />

                <AuthPasswordInput
                    id="login-password"
                    label={data?.passwordLabel || "Mật khẩu"}
                    placeholder={data?.passwordPlaceholder || "Nhập mật khẩu"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => {
                        setPassword(event.target.value);
                        if (passwordError && event.target.value.trim()) setPasswordError("");
                    }}
                    disabled={loading || socialLoading}
                    error={passwordError}
                    labelAccessory={
                        <Link href="/forgot-password" className="auth-text-link">
                            {data?.forgotPasswordLabel || "Quên mật khẩu?"}
                        </Link>
                    }
                    required
                />

                {activeAlert ? (
                    <AuthAlert title={activeAlert.title} message={activeAlert.message} />
                ) : null}

                <AuthSubmitButton
                    idleLabel={data?.submitLabel || "Đăng nhập"}
                    loadingLabel="Đang đăng nhập..."
                    loading={loading}
                    disabled={socialLoading}
                />
            </form>

            <AuthDivider label={data?.dividerLabel || "Hoặc"} />
            <SocialLoginButtons
                disabled={loading}
                onError={(message) => {
                    setFormError(message);
                    setUrlAlert(null);
                }}
                onLoadingChange={(isLoading) => {
                    oauthStarting.current = isLoading;
                    setSocialLoading(isLoading);
                }}
            />

            <p className="mt-6 text-center text-sm text-[#59677F]">
                {data?.signupText || "Chưa có tài khoản?"}{" "}
                <Link href="/register" className="auth-text-link text-sm">
                    {data?.signupLabel || "Đăng ký"}
                </Link>
            </p>
        </AuthCard>
    );
}

export default LoginFormCard;
