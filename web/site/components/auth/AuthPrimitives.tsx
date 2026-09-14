"use client";

import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";

type AuthCardProps = {
    children: ReactNode;
    wide?: boolean;
};

export function AuthCard({ children, wide = false }: AuthCardProps) {
    return (
        <section
            className={`auth-card mx-auto w-full ${wide ? "max-w-[460px]" : "max-w-[420px]"}`}
            aria-label="Khu vực xác thực UIGrade AI"
        >
            {children}
        </section>
    );
}

type AuthCardHeaderProps = {
    title: string;
    description: string;
};

export function AuthCardHeader({ title, description }: AuthCardHeaderProps) {
    return (
        <header className="mb-7 text-center">
            <div className="auth-avatar mx-auto mb-5" role="img" aria-label="UIGrade AI">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
                    <path
                        d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.7"
                    />
                </svg>
            </div>
            <h1 className="text-[1.65rem] font-bold tracking-[-0.03em] text-[#26334D] sm:text-[1.8rem]">
                {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#59677F]">{description}</p>
        </header>
    );
}

type AuthInputProps = Omit<ComponentProps<"input">, "id"> & {
    id: string;
    label: string;
    icon: "mail" | "lock" | "person" | "badge";
    error?: string;
    hint?: string;
    labelAccessory?: ReactNode;
    endAdornment?: ReactNode;
};

export function AuthInput({
    id,
    label,
    icon,
    error,
    hint,
    labelAccessory,
    endAdornment,
    required,
    className = "",
    ...inputProps
}: AuthInputProps) {
    const descriptionId = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

    return (
        <div>
            <div className="mb-2 flex min-h-5 items-center justify-between gap-3">
                <label htmlFor={id} className="text-xs font-semibold text-[#44516A]">
                    {label}
                    {required ? <span className="ml-1 text-rose-500" aria-hidden="true">*</span> : null}
                </label>
                {labelAccessory}
            </div>
            <div className={`auth-input-shell ${error ? "auth-input-shell-error" : ""}`}>
                <span className="material-symbols-outlined text-[18px] text-[#68758C]" aria-hidden="true">
                    {icon}
                </span>
                <input
                    {...inputProps}
                    id={id}
                    required={required}
                    aria-label={label}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={descriptionId}
                    className={`min-w-0 flex-1 border-0 bg-transparent py-3.5 text-sm text-[#26334D] outline-none placeholder:text-[#59677F] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
                />
                {endAdornment}
            </div>
            {error ? (
                <p id={`${id}-error`} className="auth-field-message text-rose-700" role="alert">
                    {error}
                </p>
            ) : hint ? (
                <p id={`${id}-hint`} className="auth-field-message text-[#59677F]">
                    {hint}
                </p>
            ) : null}
        </div>
    );
}

type AuthPasswordInputProps = Omit<AuthInputProps, "type" | "icon" | "endAdornment">;

export function AuthPasswordInput(props: AuthPasswordInputProps) {
    const [visible, setVisible] = useState(false);

    return (
        <AuthInput
            {...props}
            type={visible ? "text" : "password"}
            icon="lock"
            endAdornment={(
                <button
                    type="button"
                    onClick={() => setVisible((current) => !current)}
                    aria-label={visible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    className="auth-icon-button"
                    disabled={props.disabled}
                >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                        {visible ? "visibility_off" : "visibility"}
                    </span>
                </button>
            )}
        />
    );
}

type AuthSubmitButtonProps = {
    idleLabel: string;
    loadingLabel: string;
    loading: boolean;
    disabled?: boolean;
};

export function AuthSubmitButton({ idleLabel, loadingLabel, loading, disabled = false }: AuthSubmitButtonProps) {
    return (
        <button type="submit" disabled={loading || disabled} className="auth-primary-button">
            {loading ? (
                <>
                    <span className="auth-spinner" aria-hidden="true" />
                    <span>{loadingLabel}</span>
                </>
            ) : (
                <span>{idleLabel}</span>
            )}
        </button>
    );
}

export function AuthDivider({ label }: { label: string }) {
    return (
        <div className="my-5 flex items-center gap-3" aria-hidden="true">
            <span className="h-px flex-1 bg-[#CDD5E2]" />
            <span className="text-[11px] font-medium text-[#59677F]">{label}</span>
            <span className="h-px flex-1 bg-[#CDD5E2]" />
        </div>
    );
}

export function AuthAlert({
    message,
    title,
    tone = "error",
}: {
    message: string;
    title?: string;
    tone?: "error" | "success";
}) {
    return (
        <div
            role={tone === "error" ? "alert" : "status"}
            className={`auth-alert ${tone === "error" ? "auth-alert-error" : "auth-alert-success"}`}
        >
            {title ? <p className="font-semibold">{title}</p> : null}
            <p>{message}</p>
        </div>
    );
}
