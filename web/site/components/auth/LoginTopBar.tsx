// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

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
        <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
            <Link
                href="/login"
                className="rounded-lg text-lg font-bold tracking-[-0.03em] text-[#26334D] transition hover:-translate-y-px hover:opacity-90 sm:text-xl"
            >
                {brand.includes("AI") ? (
                    <>
                        <span>{brand.replace(" AI", "")}</span>{" "}
                        <span className="text-blue-600">AI</span>
                    </>
                ) : (
                    <span className="text-blue-600">{brand}</span>
                )}
            </Link>

            <Link
                href="/help"
                className="auth-text-link rounded-lg px-2 py-1 text-xs sm:text-sm"
            >
                {helpLabel}
            </Link>
        </header>
    );
}

export default LoginTopBar;
