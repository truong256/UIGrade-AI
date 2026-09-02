type FilterOption = {
    label: string;
    value: string;
};

type AssignmentSearchFilters = {
    statusOptions: FilterOption[];
    classOptions: FilterOption[];
};

type Props = {
    data: AssignmentSearchFilters;
};

export function AssignmentSearchBar({ data }: Props) {
    return (
        <section className="mb-6 rounded-2xl border border-blue-100 bg-white p-3.5 shadow-xs">
            <div className="flex flex-col gap-3 lg:flex-row">
                <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Tìm kiếm tên bài tập, mã lớp..."
                        className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <div className="flex flex-wrap gap-2.5">
                    <select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                        {data.statusOptions.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>

                    <select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                        {data.classOptions.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>

                    <button type="button" className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50">
                        <span className="material-symbols-outlined text-[18px]">filter_list</span>
                    </button>
                </div>
            </div>
        </section>
    );
}