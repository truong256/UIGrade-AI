import type { ReactNode } from "react";

type EmptyStateProps = {
    title: string;
    description?: string;
    icon?: string;
    action?: ReactNode;
    className?: string;
};

export function EmptyState({
    title,
    description,
    icon = "search_off",
    action,
    className = "",
}: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 p-8 text-center sm:p-12 ${className}`}>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 mb-4">
                <span className="material-symbols-outlined text-[32px]">{icon}</span>
            </div>
            <h3 className="text-base font-semibold text-slate-800 sm:text-lg">
                {title}
            </h3>
            {description && (
                <p className="mt-1.5 max-w-md text-sm text-slate-500 leading-relaxed">
                    {description}
                </p>
            )}
            {action && <div className="mt-6">{action}</div>}
        </div>
    );
}

type ErrorStateProps = {
    title?: string;
    message: string;
    onRetry?: () => void;
    className?: string;
};

export function ErrorState({
    title = "Không thể tải dữ liệu",
    message,
    onRetry,
    className = "",
}: ErrorStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/40 p-8 text-center sm:p-12 ${className}`}>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600 mb-4">
                <span className="material-symbols-outlined text-[32px]">error_outline</span>
            </div>
            <h3 className="text-base font-semibold text-red-900 sm:text-lg">
                {title}
            </h3>
            <p className="mt-1.5 max-w-md text-sm text-red-600 leading-relaxed">
                {message}
            </p>
            {onRetry && (
                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-xs hover:bg-red-700 transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    Thử lại
                </button>
            )}
        </div>
    );
}
