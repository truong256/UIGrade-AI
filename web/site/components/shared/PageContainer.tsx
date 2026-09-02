import type { ReactNode } from "react";

type PageContainerProps = {
    children: ReactNode;
    className?: string;
    maxWidth?: "default" | "full" | "narrow";
};

export function PageContainer({
    children,
    className = "",
    maxWidth = "default",
}: PageContainerProps) {
    const maxWidthClass = {
        default: "max-w-7xl",
        full: "max-w-[1440px]",
        narrow: "max-w-5xl",
    }[maxWidth];

    return (
        <div className={`mx-auto w-full px-4 py-6 sm:px-6 sm:py-8 lg:px-8 ${maxWidthClass} ${className}`}>
            {children}
        </div>
    );
}
