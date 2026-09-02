import type { ReactNode } from "react";

type InfoCardProps = {
    title: string;
    children: ReactNode;
    className?: string;
};

export function InfoCard({ title, children, className = "" }: InfoCardProps) {
    return (
        <div className={`rounded-2xl border p-4 ${className}`}>
            <p className="text-xs font-bold uppercase tracking-wide">{title}</p>
            {children}
        </div>
    );
}
