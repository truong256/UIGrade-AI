// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

type Props = {
    error: string;
    notice: string;
};

export function AlertMessages({ error, notice }: Props) {
    if (!error && !notice) return null;

    return (
        <div className="mt-4 space-y-2">
            {error && (
                <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                </div>
            )}
            {notice && (
                <div role="status" className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {notice}
                </div>
            )}
        </div>
    );
}
