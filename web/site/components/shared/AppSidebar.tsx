"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getNavItemsForRole, isActivePath } from "@/lib/navigation";
import { useMemo, useState } from "react";

type AppSidebarProps = {
    collapsed: boolean;
    mobileOpen: boolean;
    onCloseMobile: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    currentUserRole?: "admin" | "teacher" | "lecturer" | "student" | "User";
};

export function AppSidebar({
    collapsed,
    mobileOpen,
    onCloseMobile,
    onMouseEnter,
    onMouseLeave,
    currentUserRole,
}: AppSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);

    // Role-aware navigation: each role sees only items appropriate to their permissions.
    const visibleNavItems = useMemo(() => {
        return getNavItemsForRole(currentUserRole);
    }, [currentUserRole]);

    const handleLogout = async () => {
        try {
            setLoggingOut(true);

            const res = await fetch("/api/auth/logout", {
                method: "POST",
            });

            const result = await res.json();

            if (!res.ok) {
                alert(result.message || "Đăng xuất thất bại");
                return;
            }

            onCloseMobile?.();
            router.push("/login");
            router.refresh();
        } catch {
            alert("Có lỗi xảy ra khi đăng xuất");
        } finally {
            setLoggingOut(false);
        }

        localStorage.removeItem("token");
        localStorage.removeItem("user");
    };

    return (
        <>
            <div
                onClick={onCloseMobile}
                className={`fixed inset-0 z-[45] bg-slate-900/40 backdrop-blur-xs transition-opacity lg:hidden ${
                    mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
                aria-hidden={!mobileOpen}
            />

            <aside
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                className={`fixed left-0 top-0 z-40 h-screen border-r border-slate-200/80 bg-white/98 backdrop-blur-md shadow-xs transition-[width,transform] duration-300 ease-out will-change-[width]
                ${collapsed ? "lg:w-[88px]" : "lg:w-[272px]"}
                ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                w-[272px]`}
            >
                <div className="flex h-16 items-center border-b border-slate-200/80 px-3">
                    <Link
                        href="/ui/dashboard"
                        className="grid w-full grid-cols-[56px_minmax(0,1fr)] items-center group"
                        aria-label="Về trang tổng quan UIGrade AI"
                    >
                        <div className="flex h-12 w-12 items-center justify-center">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-xs group-hover:scale-105 transition-transform duration-200">
                                <span className="material-symbols-outlined text-[22px]">
                                    auto_stories
                                </span>
                            </div>
                        </div>

                        <div
                            className={`min-w-0 overflow-hidden transition-all duration-300 ease-out ${
                                collapsed
                                    ? "max-w-0 translate-x-2 opacity-0"
                                    : "max-w-[180px] translate-x-0 opacity-100"
                            }`}
                        >
                            <p className="truncate text-base font-bold text-[#172033] flex items-center gap-1.5">
                                UIGrade <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 font-bold uppercase tracking-wider">AI</span>
                            </p>
                            <p className="truncate text-[11px] text-[#4A5568]">
                                Chấm điểm Android Rubric
                            </p>
                        </div>
                    </Link>
                </div>

                <nav className="space-y-1 p-3">
                    {visibleNavItems.map((item) => {
                        const active = isActivePath(pathname, item.href);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onCloseMobile}
                                title={collapsed ? item.label : undefined}
                                className={`grid h-11 grid-cols-[44px_minmax(0,1fr)] items-center rounded-xl px-1.5 text-sm font-medium transition-all duration-200 ${
                                    active
                                        ? "bg-blue-50 text-blue-600 font-semibold shadow-xs"
                                        : "text-slate-600 hover:bg-slate-100/70 hover:text-[#172033]"
                                }`}
                            >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center">
                                    <span className={`material-symbols-outlined text-[20px] ${active ? "text-blue-600" : "text-slate-500"}`}>
                                        {item.icon}
                                    </span>
                                </span>

                                <span
                                    className={`overflow-hidden whitespace-nowrap transition-all duration-300 ease-out ${
                                        collapsed
                                            ? "max-w-0 translate-x-2 opacity-0"
                                            : "max-w-[180px] translate-x-0 opacity-100"
                                    }`}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}

                    <div className="pt-2 border-t border-slate-200/80 my-2" />

                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        title={collapsed ? "Đăng xuất" : undefined}
                        className="grid h-11 w-full grid-cols-[44px_minmax(0,1fr)] items-center rounded-xl px-1.5 text-left text-red-600 transition-all duration-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center">
                            <span className="material-symbols-outlined text-[20px]">
                                logout
                            </span>
                        </span>

                        <span
                            className={`overflow-hidden whitespace-nowrap font-medium text-sm transition-all duration-300 ease-out ${
                                collapsed
                                    ? "max-w-0 translate-x-2 opacity-0"
                                    : "max-w-[180px] translate-x-0 opacity-100"
                            }`}
                        >
                            {loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
                        </span>
                    </button>
                </nav>

                {collapsed && (
                    <div className="pointer-events-none absolute left-full top-0 hidden h-full w-6 lg:block" />
                )}
            </aside>
        </>
    );
}