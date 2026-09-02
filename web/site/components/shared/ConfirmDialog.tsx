"use client";

import { useEffect, useRef } from "react";

type ConfirmDialogProps = {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    loading?: boolean;
    onConfirm: () => void | Promise<void>;
    onClose: () => void;
};

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = "Xác nhận",
    cancelLabel = "Hủy",
    isDestructive = false,
    loading = false,
    onConfirm,
    onClose,
}: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !loading) {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [open, loading, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
        >
            <div
                ref={dialogRef}
                className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150"
            >
                <div className="flex items-start gap-4">
                    <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                            isDestructive
                                ? "bg-rose-50 text-rose-600"
                                : "bg-blue-50 text-blue-600"
                        }`}
                    >
                        <span className="material-symbols-outlined text-[24px]">
                            {isDestructive ? "warning" : "help"}
                        </span>
                    </div>

                    <div className="flex-1">
                        <h3 id="confirm-dialog-title" className="text-base font-bold text-[#172033]">
                            {title}
                        </h3>
                        <p className="mt-1 text-xs sm:text-sm text-[#4A5568] leading-relaxed">
                            {description}
                        </p>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-2.5">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-semibold text-white shadow-xs transition active:scale-98 disabled:opacity-60 ${
                            isDestructive
                                ? "bg-rose-600 hover:bg-rose-700 focus:ring-2 focus:ring-rose-200"
                                : "bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-200"
                        }`}
                    >
                        {loading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                                <span>Đang xử lý...</span>
                            </>
                        ) : (
                            confirmLabel
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDialog;
