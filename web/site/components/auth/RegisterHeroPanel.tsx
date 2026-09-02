type RegisterHeroData = {
    eyebrow: string;
    brand: string;
    description: string;
    imageUrl: string;
};

type Props = {
    data: RegisterHeroData;
};

export function RegisterHeroPanel({ data }: Props) {
    return (
        <section className="flex flex-col space-y-6 pr-6 lg:pr-12">
            <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-sky-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                    {data.eyebrow || "Hệ thống Đánh giá Android UI"}
                </span>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight text-slate-900">
                    {data.brand || "UIGrade AI"} <span className="text-sky-600">.</span>
                </h1>
            </div>

            <p className="max-w-md text-sm leading-relaxed text-slate-500">
                {data.description || "Nền tảng tự động chấm điểm bài tập giao diện Android với độ chính xác cao theo pixel và tiêu chí Rubric."}
            </p>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-sky-100 shadow-xl shadow-sky-900/5 bg-gradient-to-br from-sky-500/10 to-sky-700/20 p-6 flex flex-col justify-end">
                <div className="relative z-10 rounded-2xl bg-white/90 backdrop-blur-md p-4 border border-white/60 shadow-lg">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-600 text-white font-bold">
                            <span className="material-symbols-outlined text-[20px]">verified</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-900">Chuẩn hóa Rubric tự động</p>
                            <p className="text-[11px] text-slate-500">Đánh giá layout, component, color & spacing</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}