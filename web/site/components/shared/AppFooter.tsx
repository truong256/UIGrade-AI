import Link from "next/link";
import { studentNavItems } from "@/lib/navigation";

export function AppFooter() {
    return (
        <footer className="mt-12 border-t border-slate-200/80 bg-white/80 backdrop-blur-xs">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-[#4A5568] sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-xs">
                            UI
                        </span>
                        <p className="font-bold text-[#172033]">UIGrade AI</p>
                    </div>
                    <p className="mt-1 text-xs text-[#4A5568]">
                        Hệ thống chấm điểm và phân tích giao diện ứng dụng Android tự động theo Rubric.
                    </p>
                </div>

                <nav className="flex flex-wrap gap-4 text-xs">
                    {studentNavItems.slice(0, 6).map((item: { href: string; label: string }) => (
                        <Link key={item.href} href={item.href} className="text-[#4A5568] hover:text-blue-600 transition">
                            {item.label}
                        </Link>
                    ))}
                    <Link href="/ui/account" className="text-[#4A5568] hover:text-blue-600 transition">
                        Tài khoản
                    </Link>
                </nav>
            </div>
        </footer>
    );
}