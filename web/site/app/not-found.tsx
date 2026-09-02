import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-[#F6F9FF] px-4 text-center text-[#172033]">
            <div className="mx-auto max-w-md rounded-2xl border border-slate-200/80 bg-white p-8 shadow-xs sm:p-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-5">
                    <span className="material-symbols-outlined text-[36px]">search_off</span>
                </div>

                <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
                    404 - Không tìm thấy
                </span>

                <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#172033]">
                    Trang không tồn tại
                </h1>

                <p className="mt-2 text-xs sm:text-sm text-[#4A5568] leading-relaxed">
                    Địa chỉ bạn đang truy cập không tồn tại hoặc đã được chuyển sang đường dẫn khác.
                </p>

                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                        href="/ui/dashboard"
                        className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 active:scale-98"
                    >
                        <span className="material-symbols-outlined text-[18px]">dashboard</span>
                        Về bảng điều khiển
                    </Link>

                    <Link
                        href="/login"
                        className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-xs sm:text-sm font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50"
                    >
                        Đăng nhập
                    </Link>
                </div>
            </div>
        </div>
    );
}
