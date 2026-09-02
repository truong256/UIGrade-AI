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
    // This is a UX control — server-side authorization independently enforces access.
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
                className={`fixed left-0 top-0 z-40 h-screen border-r border-sky-100 bg-white/95 backdrop-blur-md shadow-sm transition-[width,transform] duration-300 ease-out will-change-[width]
                ${collapsed ? "lg:w-[92px]" : "lg:w-[272px]"}
                ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
                w-[272px]`}
            >
                <div className="flex h-20 items-center border-b border-sky-100 px-3">
                    <Link
                        href="/ui/dashboard"
                        className="grid w-full grid-cols-[56px_minmax(0,1fr)] items-center group"
                        aria-label="Về trang tổng quan UIGrade AI"
                    >
                        <div className="flex h-14 w-14 items-center justify-center">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform duration-200">
                                <span className="material-symbols-outlined text-[26px]">
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
                            <p className="truncate text-lg font-bold text-sky-950 flex items-center gap-1.5">
                                UIGrade <span className="text-xs px-1.5 py-0.5 rounded-md bg-sky-100 text-sky-700 font-semibold uppercase tracking-wider">AI</span>
                            </p>
                            <p className="truncate text-xs text-slate-500">
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
                                className={`grid grid-cols-[44px_minmax(0,1fr)] items-center rounded-xl px-2 py-2.5 text-sm font-medium transition-all duration-200 ${
                                    active
                                        ? "bg-sky-50 text-sky-700 font-semibold shadow-xs"
                                        : "text-slate-600 hover:bg-sky-50/60 hover:text-sky-900"
                                }`}
                            >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center">
                                    <span className={`material-symbols-outlined text-[22px] ${active ? "text-sky-600" : "text-slate-500"}`}>
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

                    <div className="pt-2 border-t border-sky-100 my-2" />

                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        title={collapsed ? "Đăng xuất" : undefined}
                        className="grid w-full grid-cols-[44px_minmax(0,1fr)] items-center rounded-xl px-2 py-2.5 text-left text-red-600 transition-all duration-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center">
                            <span className="material-symbols-outlined">
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