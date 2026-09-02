"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function UiError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("UI route error:", error);
    }, [error]);

    return (
        <div className="mx-auto max-w-lg rounded-2xl border border-rose-200 bg-white p-8 shadow-xs text-center my-12">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4">
                <span className="material-symbols-outlined text-[32px]">error</span>
            </div>

            <span className="rounded-lg bg-rose-50 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-rose-700">
                Sự cố giao diện
            </span>

            <h2 className="mt-3 text-xl font-bold tracking-tight text-[#172033]">
                Không thể tải nội dung phần này
            </h2>

            <p className="mt-1 text-xs sm:text-sm text-[#4A5568]">
                {error.message || "Đã xảy ra lỗi khi kết nối dữ liệu. Vui lòng nhấn nút thử lại bên dưới."}
            </p>

            <div className="mt-6 flex items-center justify-center gap-3">
                <button
                    type="button"
                    onClick={() => reset()}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 active:scale-98"
                >
                    <span className="material-symbols-outlined text-[16px]">refresh</span>
                    Tải lại dữ liệu
                </button>

                <Link
                    href="/ui/dashboard"
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                >
                    Về Dashboard
                </Link>
            </div>
        </div>
    );
}
