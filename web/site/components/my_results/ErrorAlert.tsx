// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

type ErrorAlertProps = { message: string };

export function ErrorAlert({ message }: ErrorAlertProps) {
    if (!message) return null;

    return (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {message}
        </div>
    );
}
