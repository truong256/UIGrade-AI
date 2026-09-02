type LoginHeroData = {
    eyebrow?: string;
    title?: string;
    description?: string;
};

type Props = {
    data?: LoginHeroData;
};

export function LoginHero({ data }: Props) {
    const eyebrow = data?.eyebrow || "HỆ THỐNG CHẤM ĐIỂM THÔNG MINH";
    const title = data?.title || "Chào mừng trở lại";
    const description = data?.description || "Đăng nhập để tiếp tục học tập và quản lý công việc của bạn.";

    return (
        <div className="text-center">
            <div className="inline-block rounded-lg border border-blue-200/60 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-700 mb-2.5">
                {eyebrow}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172033]">
                {title}
            </h1>

            <p className="mt-1 text-xs sm:text-sm text-[#4A5568] max-w-sm mx-auto">
                {description}
            </p>
        </div>
    );
}

export default LoginHero;