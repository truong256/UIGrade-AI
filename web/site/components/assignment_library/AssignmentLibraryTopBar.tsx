import Link from "next/link";

const navItems = [
    { label: "Bảng điều khiển", href: "/ui/dashboard" },
    { label: "Kho bài tập", href: "/ui/assignment_list", active: true },
    { label: "Lớp học", href: "/ui/my_classes" },
    { label: "Báo cáo", href: "/ui/my_results" },
];

export function AssignmentLibraryTopBar() {
    return (
        <header className="sticky top-0 z-50 h-16 border-b border-slate-200/80 bg-white/95 px-6 backdrop-blur-md lg:px-20">
            <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between">
                <Link href="/ui/dashboard" className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                        <span className="material-symbols-outlined text-[20px]">school</span>
                    </div>

                    <h1 className="text-base font-bold tracking-tight text-[#172033]">
                        UIGrade <span className="text-blue-600 font-bold">AI</span>
                    </h1>
                </Link>

                <nav className="hidden items-center gap-8 md:flex">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`pb-1 text-xs transition-colors ${
                                item.active
                                    ? "border-b-2 border-blue-600 font-bold text-blue-600"
                                    : "font-semibold text-slate-600 hover:text-blue-600"
                            }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                </nav>

                <div className="flex items-center gap-3">
                    <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100">
                        <span className="material-symbols-outlined text-[20px]">notifications</span>
                    </button>

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white text-xs font-bold shadow-xs">
                        GV
                    </div>
                </div>
            </div>
        </header>
    );
}