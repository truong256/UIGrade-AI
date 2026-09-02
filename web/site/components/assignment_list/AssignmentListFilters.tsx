import type { FC, Dispatch, SetStateAction } from "react";

type AssignmentListFiltersProps = {
    search?: string;
    onSearchChange?: (value: string) => void;
    keyword?: string;
    onKeywordChange?: Dispatch<SetStateAction<string>> | ((value: string) => void);
    statusFilter: string;
    onStatusFilterChange: Dispatch<SetStateAction<string>> | ((value: string) => void);
    classFilter: string;
    onClassFilterChange: Dispatch<SetStateAction<string>> | ((value: string) => void);
    classes?: Array<{ id: string; name: string }>;
    classOptions?: Array<{ value: string; label: string }>;
    onResetFilters?: () => void;
};

export const AssignmentListFilters: FC<AssignmentListFiltersProps> = ({
    search,
    onSearchChange,
    keyword,
    onKeywordChange,
    statusFilter,
    onStatusFilterChange,
    classFilter,
    onClassFilterChange,
    classes,
    classOptions,
    onResetFilters,
}) => {
    const currentSearch = keyword !== undefined ? keyword : (search || "");
    const handleSearch = (val: string) => {
        if (onKeywordChange) {
            (onKeywordChange as (val: string) => void)(val);
        } else if (onSearchChange) {
            onSearchChange(val);
        }
    };

    const handleStatus = (val: string) => {
        (onStatusFilterChange as (val: string) => void)(val);
    };

    const handleClass = (val: string) => {
        (onClassFilterChange as (val: string) => void)(val);
    };

    const optionsList = classOptions || (classes || []).map((c) => ({ value: c.id, label: c.name }));
    const hasActiveFilters = Boolean(currentSearch.trim() || statusFilter !== "all" || classFilter !== "all");

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    search
                </span>
                <input
                    type="text"
                    value={currentSearch}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Tìm kiếm bài tập theo tiêu đề, mô tả, mã lớp..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-xs sm:text-sm text-[#172033] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400"
                />
            </div>

            {/* Select Dropdowns & Filter Reset */}
            <div className="flex flex-wrap items-center gap-3">
                <select
                    value={classFilter}
                    onChange={(e) => handleClass(e.target.value)}
                    aria-label="Lọc theo lớp học"
                    className="h-11 w-full sm:w-48 lg:w-56 rounded-xl border border-slate-200 bg-white px-3.5 text-xs sm:text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer"
                >
                    <option value="all">Tất cả lớp học</option>
                    {optionsList.map((c) => (
                        <option key={c.value} value={c.value}>
                            {c.label}
                        </option>
                    ))}
                </select>

                <select
                    value={statusFilter}
                    onChange={(e) => handleStatus(e.target.value)}
                    aria-label="Lọc theo trạng thái"
                    className="h-11 w-full sm:w-44 lg:w-48 rounded-xl border border-slate-200 bg-white px-3.5 text-xs sm:text-sm font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer"
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="published">Đang mở (Published)</option>
                    <option value="draft">Bản nháp (Draft)</option>
                    <option value="closed">Đã đóng (Closed)</option>
                </select>

                {hasActiveFilters && onResetFilters && (
                    <button
                        type="button"
                        onClick={onResetFilters}
                        className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 shrink-0"
                    >
                        <span className="material-symbols-outlined text-[16px]">filter_alt_off</span>
                        <span>Xóa lọc</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default AssignmentListFilters;
