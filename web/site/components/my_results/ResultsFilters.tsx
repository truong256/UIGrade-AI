import type { SelectOption } from "@/app/ui/my_results/type/my_results.type";

type ResultsFiltersProps = {
    keyword: string;
    classFilter: string;
    statusFilter: string;
    classOptions: SelectOption[];
    onKeywordChange: (value: string) => void;
    onClassFilterChange: (value: string) => void;
    onStatusFilterChange: (value: string) => void;
};

export function ResultsFilters({
    keyword,
    classFilter,
    statusFilter,
    classOptions,
    onKeywordChange,
    onClassFilterChange,
    onStatusFilterChange,
}: ResultsFiltersProps) {
    return (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[2fr,1.2fr,1fr]">
                <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Tìm kiếm bài tập
                    </label>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                            search
                        </span>
                        <input
                            value={keyword}
                            onChange={(event) => onKeywordChange(event.target.value)}
                            placeholder="Nhập tên bài tập hoặc mã lớp..."
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs sm:text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Lớp học
                    </label>
                    <select
                        value={classFilter}
                        onChange={(event) => onClassFilterChange(event.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                        <option value="all">Tất cả lớp học</option>
                        {classOptions.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                        Trạng thái
                    </label>
                    <select
                        value={statusFilter}
                        onChange={(event) => onStatusFilterChange(event.target.value)}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="graded">Đã có điểm</option>
                        <option value="pending">Đang chờ chấm</option>
                        <option value="late">Nộp trễ</option>
                        <option value="submitted">Đã nộp</option>
                    </select>
                </div>
            </div>
        </section>
    );
}
