import Link from "next/link";

type LoginTopBarData = {
    brand?: string;
    helpLabel?: string;
};

type Props = {
    data?: LoginTopBarData;
};

export function LoginTopBar({ data }: Props) {
    const brand = data?.brand || "UIGrade AI";
    const helpLabel = data?.helpLabel || "Trợ giúp";

    return (
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
            <Link
                href="/login"
                className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 transition hover:opacity-90"
            >
                {brand.includes("AI") ? (
                    <>
                        <span className="text-slate-900">{brand.replace(" AI", "")}</span>{" "}
                        <span className="text-sky-600">AI</span>
                    </>
                ) : (
                    <span className="text-sky-600">{brand}</span>
                )}
            </Link>

            <Link
                href="/help"
                className="text-xs sm:text-sm font-semibold text-slate-600 transition hover:text-sky-600"
            >
                {helpLabel}
            </Link>
        </header>
    );
}

export default LoginTopBar;