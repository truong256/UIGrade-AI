import type { ReactNode } from "react";
import { AppHeader } from "@/components/shared/AppHeader";

export default function UiLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-[#F6F9FF] text-[#172033]">
            <AppHeader>{children}</AppHeader>
        </div>
    );
}