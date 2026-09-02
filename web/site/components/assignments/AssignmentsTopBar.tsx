import Link from "next/link";

const navItems = [
    { label: "Trang chủ", href: "/ui/dashboard" },
    { label: "Lớp học", href: "/ui/my_classes" },
    { label: "Bài tập", href: "/ui/assignment_list", active: true },
    { label: "Kết quả", href: "/ui/my_results" },
    { label: "Cài đặt", href: "/ui/settings" },
];

export function AssignmentsTopBar() {
    return (
        <header className="sticky top-0 z-50 border-b border-sky-100 bg-white/95 backdrop-blur-md px-6 py-3">
            <div className="mx-auto flex max-w-[1200px] items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/ui/dashboard" className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600 text-white shadow-md shadow-sky-600/20">
                            <span className="material-symbols-outlined text-[20px]">school</span>
                        </div>
                        <h2 className="text-lg font-black tracking-tight text-slate-900">
                            UIGrade <span className="text-sky-600 font-extrabold">AI</span>
                        </h2>
                    </Link>

                    <nav className="hidden items-center gap-6 md:flex">
                        {navItems.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`text-xs transition-colors ${
                                    item.active
                                        ? "font-bold text-sky-700"
                                        : "font-semibold text-slate-600 hover:text-sky-600"
                                }`}
                            >
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-3">
                    <button type="button" className="rounded-full p-2 text-slate-500 transition-colors hover:bg-sky-50 hover:text-sky-600">
                        <span className="material-symbols-outlined text-[20px]">notifications</span>
                    </button>

                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-600 to-sky-400 text-white text-xs font-bold shadow-xs">
                        GV
                    </div>
                </div>
            </div>
        </header>
    );
}