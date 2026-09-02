"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service safely
        console.error("Global application error:", error);
    }, [error]);

    return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-[#F6F9FF] px-4 text-center text-[#172033]">
            <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-white p-8 shadow-xs sm:p-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-5">
                    <span className="material-symbols-outlined text-[36px]">error</span>
                </div>

                <span className="rounded-lg bg-rose-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-rose-700">
                    Đã xảy ra lỗi
                </span>

                <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#172033]">
                    Không thể tải trang
                </h1>

                <p className="mt-2 text-xs sm:text-sm text-[#4A5568] leading-relaxed">
                    Hệ thống gặp sự cố trong quá trình xử lý yêu cầu. Vui lòng thử tải lại trang hoặc liên hệ quản trị viên.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                        type="button"
                        onClick={() => reset()}
                        className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 active:scale-98"
                    >
                        <span className="material-symbols-outlined text-[18px]">refresh</span>
                        Thử lại
                    </button>

                    <Link
                        href="/ui/dashboard"
                        className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                    >
                        Về trang chủ
                    </Link>
                </div>
            </div>
        </div>
    );
}
