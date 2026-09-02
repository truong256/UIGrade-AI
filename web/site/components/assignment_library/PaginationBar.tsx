type PaginationData = {
    summary: string;
    pages: number[];
    currentPage: number;
};

type Props = {
    data: PaginationData;
};

export function PaginationBar({ data }: Props) {
    return (
        <div className="mt-8 flex flex-col items-center justify-between gap-3 md:flex-row">
            <p className="text-xs text-slate-500">{data.summary}</p>

            <div className="flex items-center gap-1.5">
                <button type="button" className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50">
                    <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>

                {data.pages.map((page) => (
                    <button
                        key={page}
                        type="button"
                        className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs ${
                            data.currentPage === page
                                ? "bg-blue-600 font-bold text-white shadow-xs"
                                : "text-slate-600 hover:bg-slate-100 font-medium"
                        }`}
                    >
                        {page}
                    </button>
                ))}

                <button type="button" className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-400 hover:bg-slate-50">
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
            </div>
        </div>
    );
}