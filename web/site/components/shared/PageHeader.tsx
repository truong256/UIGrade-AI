import type { ReactNode } from "react";
import Link from "next/link";

type PageHeaderProps = {
    title: ReactNode;
    description?: ReactNode;
    badge?: ReactNode;
    icon?: string;
    backHref?: string;
    onBack?: () => void;
    actions?: ReactNode;
    className?: string;
};

export function PageHeader({
    title,
    description,
    badge,
    icon,
    backHref,
    onBack,
    actions,
    className = "",
}: PageHeaderProps) {
    return (
        <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
            <div className="flex items-start gap-3 min-w-0">
                {backHref && (
                    <Link
                        href={backHref}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
                        aria-label="Quay lại"
                    >
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    </Link>
                )}

                {onBack && !backHref && (
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
                        aria-label="Quay lại"
                    >
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    </button>
                )}

                {icon && (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                        <span className="material-symbols-outlined text-[24px]">{icon}</span>
                    </div>
                )}

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-2xl font-bold tracking-tight text-[#172033] sm:text-3xl">
                            {title}
                        </h1>
                        {badge && <div className="inline-flex items-center">{badge}</div>}
                    </div>

                    {description && (
                        <p className="mt-1 text-sm text-[#4A5568] leading-relaxed">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {actions && (
                <div className="flex flex-wrap items-center gap-2.5 sm:shrink-0">
                    {actions}
                </div>
            )}
        </div>
    );
}
