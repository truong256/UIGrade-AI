"use client";

import type { ReactNode } from "react";

export default function Dialog({
                                   open,
                                   title,
                                   onClose,
                                   children,
                                   maxWidth = "max-w-3xl",
                               }: {
    open: boolean;
    title: string;
    onClose: () => void;
    children: ReactNode;
    maxWidth?: string;
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 p-4">
            <div className={`w-full ${maxWidth} rounded-3xl bg-white shadow-2xl`}>
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="max-h-[75vh] overflow-y-auto px-6 py-5">{children}</div>
            </div>
        </div>
    );
}
