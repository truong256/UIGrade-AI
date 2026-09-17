// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

export function AlertMessages({ error, success }: { error: string; success: string }) {
    return (
        <>
            {error ? (
                <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            ) : null}

            {success ? (
                <div role="status" className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    {success}
                </div>
            ) : null}
        </>
    );
}
