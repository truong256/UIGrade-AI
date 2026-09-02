import type { CurrentUser } from "@/app/ui/my_results/type/my_results.type";

type ResultsHeaderProps = { currentUser: CurrentUser | null };

export function ResultsHeader({ currentUser }: ResultsHeaderProps) {
    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="grid gap-6 lg:grid-cols-[1.6fr_0.9fr] lg:items-center">
                <div>
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200/60 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                        Báo cáo kết quả học tập
                    </div>
                    <h1 className="mt-2.5 text-2xl sm:text-3xl font-bold tracking-tight text-[#172033]">
                        Điểm số và nhận xét bài tập của bạn
                    </h1>
                    <p className="mt-1 text-xs sm:text-sm text-[#4A5568]">
                        Theo dõi chi tiết đánh giá UI Android, điểm AI đề xuất và nhận xét chính thức từ giảng viên.
                    </p>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 shadow-2xs">
                    <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-sm font-bold text-white shadow-xs">
                            {currentUser?.name?.slice(0, 2)?.toUpperCase() || "SV"}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-[#172033]">
                                {currentUser?.name || "Chưa có tên"}
                            </p>
                            <p className="text-xs font-mono font-semibold text-blue-700 mt-0.5">
                                MSSV: {currentUser?.studentCode || "Chưa cập nhật"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
