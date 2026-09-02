type FilterOption = {
    label: string;
    value: string;
};

type FilterData = {
    subjectOptions: FilterOption[];
    classOptions: FilterOption[];
};

type Props = {
    data: FilterData;
};

export function SearchFilterBar({ data }: Props) {
    return (
        <section className="mb-6 flex flex-col gap-3 rounded-2xl border border-blue-100 bg-white p-3.5 shadow-xs lg:flex-row">
            <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                    search
                </span>

                <input
                    type="text"
                    placeholder="Tìm kiếm tên bài tập, mã bài..."
                    className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
            </div>

            <div className="flex flex-wrap gap-2.5">
                <select className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                    {data.subjectOptions.map((item) => (
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

                <div className="flex rounded-xl bg-slate-100 p-1">
                    <button type="button" className="rounded-lg bg-white p-1.5 text-blue-600 shadow-xs">
                        <span className="material-symbols-outlined block text-[18px]">grid_view</span>
                    </button>
                    <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600">
                        <span className="material-symbols-outlined block text-[18px]">view_list</span>
                    </button>
                </div>
            </div>
        </section>
    );
}