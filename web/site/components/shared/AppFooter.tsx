import Link from "next/link";
import { getNavItemsForRole, type NavItem } from "@/lib/navigation";

type AppFooterProps = {
    userRole?: "admin" | "teacher" | "lecturer" | "student" | "User" | string;
};

export function AppFooter({ userRole = "student" }: AppFooterProps) {
    const roleNavItems = getNavItemsForRole(userRole);

    // Pick unique primary nav items for footer (strictly no duplicate href or label)
    const seenHrefs = new Set<string>();
    const seenLabels = new Set<string>();
    const footerNavItems: NavItem[] = [];

    for (const item of roleNavItems) {
        if (!seenHrefs.has(item.href) && !seenLabels.has(item.label) && footerNavItems.length < 5) {
            seenHrefs.add(item.href);
            seenLabels.add(item.label);
            footerNavItems.push(item);
        }
    }

    return (
        <footer className="shrink-0 border-t border-slate-200/80 bg-white/80 backdrop-blur-xs">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-[#4A5568] sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
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

                <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium">
                    {footerNavItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="text-[#4A5568] hover:text-blue-600 transition"
                        >
                            {item.label}
                        </Link>
                    ))}
                    <Link href="/help" className="text-[#4A5568] hover:text-blue-600 transition">
                        Trợ giúp
                    </Link>
                    <Link href="/privacy" className="text-[#4A5568] hover:text-blue-600 transition">
                        Bảo mật
                    </Link>
                    <Link href="/terms" className="text-[#4A5568] hover:text-blue-600 transition">
                        Điều khoản
                    </Link>
                </nav>
            </div>
        </footer>
    );
}

export default AppFooter;