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

    return (
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
            <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    search
                </span>
                <input
                    type="text"
                    value={currentSearch}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Tìm kiếm bài tập theo tiêu đề..."
                    className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-xs sm:text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
                <select
                    value={classFilter}
                    onChange={(e) => handleClass(e.target.value)}
                    className="h-10 rounded-xl border border-slate-200 px-3 text-xs sm:text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white text-slate-700 font-medium"
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
                    className="h-10 rounded-xl border border-slate-200 px-3 text-xs sm:text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white text-slate-700 font-medium"
                >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="published">Đang mở (Published)</option>
                    <option value="draft">Bản nháp (Draft)</option>
                    <option value="closed">Đã đóng (Closed)</option>
                </select>
            </div>
        </div>
    );
};

export default AssignmentListFilters;
