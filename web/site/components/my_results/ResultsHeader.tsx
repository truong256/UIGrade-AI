import type { CurrentUser } from "@/app/ui/my_results/type/my_results.type";

type ResultsHeaderProps = { currentUser: CurrentUser | null };

export function ResultsHeader({ currentUser }: ResultsHeaderProps) {
    return (
        <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm md:p-7">
            <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr] lg:items-center">
                <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                        Báo cáo kết quả học tập
                    </div>
                    <h1 className="mt-3 text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                        Điểm số và nhận xét bài tập của bạn
                    </h1>
                    <p className="mt-1 text-xs text-slate-500">
                        Theo dõi chi tiết đánh giá UI Android, điểm AI đề xuất và nhận xét chính thức từ giảng viên.
                    </p>
                </div>

                <div className="rounded-3xl border border-sky-100 bg-gradient-to-br from-sky-50/80 to-sky-100/50 p-5 shadow-xs">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-lg font-black text-white shadow-md shadow-sky-600/20">
                            {currentUser?.name?.slice(0, 2)?.toUpperCase() || "SV"}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-base font-bold text-slate-900">
                                {currentUser?.name || "Chưa có tên"}
                            </p>
                            <p className="text-[11px] font-mono font-semibold text-sky-700 mt-0.5">
                                MSSV: {currentUser?.studentCode || "Chưa cập nhật"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
