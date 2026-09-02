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
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200/60 bg-blue-50 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-blue-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                    {data.eyebrow || "Hệ thống Đánh giá Android UI"}
                </span>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-[#172033]">
                    {data.brand || "UIGrade AI"} <span className="text-blue-600">.</span>
                </h1>
            </div>

            <p className="max-w-md text-sm leading-relaxed text-[#4A5568]">
                {data.description || "Nền tảng tự động chấm điểm bài tập giao diện Android với độ chính xác cao theo pixel và tiêu chí Rubric."}
            </p>

            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-blue-100 shadow-xs bg-gradient-to-br from-blue-600/10 to-blue-700/20 p-6 flex flex-col justify-end">
                <div className="relative z-10 rounded-xl bg-white/95 backdrop-blur-md p-4 border border-white/60 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
                            <span className="material-symbols-outlined text-[20px]">verified</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-[#172033]">Chuẩn hóa Rubric tự động</p>
                            <p className="text-[11px] text-[#4A5568]">Đánh giá layout, component, color & spacing</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}