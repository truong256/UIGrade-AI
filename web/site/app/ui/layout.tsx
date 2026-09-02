import type { ReactNode } from "react";
import { AppHeader } from "@/components/shared/AppHeader";

export default function UiLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-[#F0F9FF] text-[#0F172A]">
            <AppHeader>{children}</AppHeader>
        </div>
    );
}