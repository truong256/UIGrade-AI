// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

type DashboardErrorProps = {
    error: string;
    onRetry: () => void;
};

export default function DashboardError({ error, onRetry }: DashboardErrorProps) {
    return (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
            <div className="flex items-start gap-3">
                <span className="material-symbols-outlined">error</span>
                <div className="flex-1">
                    <p className="font-semibold">Không tải được dashboard</p>
                    <p className="mt-1 text-sm">{error}</p>
                    <button
                        type="button"
                        onClick={onRetry}
                        className="mt-4 inline-flex h-9 items-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        </div>
    );
}
