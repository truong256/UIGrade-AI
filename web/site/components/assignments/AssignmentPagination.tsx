type PaginationData = {
    summary: string;
    pages: number[];
    currentPage: number;
};

type Props = {
    data: PaginationData;
};

export function AssignmentPagination({ data }: Props) {
    return (
        <div className="flex flex-col items-center justify-between gap-3 rounded-b-2xl border border-t-0 border-blue-100 bg-white px-4 py-3 md:flex-row">
            <p className="text-xs text-slate-500">{data.summary}</p>

            <div className="flex items-center gap-1.5">
                <button type="button" className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100">
                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>

                {data.pages.map((page) => (
                    <button
                        key={page}
                        type="button"
                        className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold transition ${
                            data.currentPage === page
                                ? "bg-blue-600 text-white shadow-xs"
                                : "text-slate-600 hover:bg-slate-100"
                        }`}
                    >
                        {page}
                    </button>
                ))}

                <button type="button" className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100">
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
            </div>
        </div>
    );
}