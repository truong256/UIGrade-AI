"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AppSidebar } from "@/components/shared/AppSidebar";
import { AppFooter } from "@/components/shared/AppFooter";
import { getNavItemsForRole, isActivePath } from "@/lib/navigation";

type CurrentUser = {
    id?: string;
    _id?: string;
    name?: string;
    full_name?: string;
    email?: string;
    role?: "admin" | "teacher" | "lecturer" | "student" | "User";
};

type NotificationItem = {
    id: string;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    link?: string;
    created_at: string;
};

export function AppHeader({ children }: { children: ReactNode }) {
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const loadMe = async () => {
            try {
                const res = await fetch("/api/auth/me", { cache: "no-store" });
                if (!res.ok) return;

                const json = await res.json();
                setCurrentUser(json.user || null);
            } catch {}
        };

        const loadNotifications = async () => {
            try {
                const res = await fetch("/api/notifications");
                if (res.ok) {
                    const data = await res.json();
                    const list = data.notifications || [];
                    setNotifications(list);
                    setUnreadCount(list.filter((n: NotificationItem) => !n.is_read).length);
                }
            } catch {}
        };

        void loadMe();
        void loadNotifications();
    }, []);

    // Listen for Ctrl+K / Cmd+K to open search dialog
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setSearchOpen((prev) => !prev);
            }
            if (e.key === "Escape") {
                setSearchOpen(false);
                setNotificationsOpen(false);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    const userRole = (currentUser?.role || "student") as "admin" | "teacher" | "lecturer" | "student" | "User";

    const visibleNavItems = useMemo(() => {
        return getNavItemsForRole(userRole);
    }, [userRole]);

    const displayName = currentUser?.full_name || currentUser?.name || currentUser?.email?.split("@")[0] || "Người dùng";
    const initials = displayName.slice(0, 2).toUpperCase();

    const roleBadgeText = {
        admin: "Quản trị viên",
        teacher: "Giảng viên",
        lecturer: "Giảng viên",
        student: "Sinh viên",
        User: "Người dùng",
    }[userRole] || "Người dùng";

    const searchResults = useMemo(() => {
        if (!searchQuery.trim()) return visibleNavItems;
        const q = searchQuery.toLowerCase();
        return visibleNavItems.filter((item) => item.label.toLowerCase().includes(q));
    }, [searchQuery, visibleNavItems]);

    return (
        <div className="min-h-screen bg-[#F6F9FF] text-[#172033]">
            <AppSidebar
                collapsed={!sidebarExpanded}
                mobileOpen={mobileSidebarOpen}
                onCloseMobile={() => setMobileSidebarOpen(false)}
                onMouseEnter={() => setSidebarExpanded(true)}
                onMouseLeave={() => setSidebarExpanded(false)}
                currentUserRole={userRole}
            />

            <div className="min-h-screen transition-all duration-300 lg:pl-[88px]">
                <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all duration-300">
                    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            {/* Mobile Hamburger Button */}
                            <button
                                type="button"
                                onClick={() => setMobileSidebarOpen(true)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden"
                                aria-label="Mở danh mục điều hướng"
                            >
                                <span className="material-symbols-outlined text-[22px]">menu</span>
                            </button>

                            {/* Breadcrumb / Platform Title on mobile */}
                            <div className="flex items-center gap-2 lg:hidden">
                                <span className="text-base font-bold text-[#172033]">UIGrade AI</span>
                            </div>

                            {/* Desktop Navigation links */}
                            <nav className="hidden items-center gap-1.5 xl:flex">
                                {visibleNavItems.slice(0, 5).map((item) => {
                                    const active = isActivePath(pathname, item.href);

                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={`rounded-xl px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
                                                active
                                                    ? "bg-blue-50 text-blue-600 font-semibold shadow-xs"
                                                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                            }`}
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Search & Actions */}
                        <div className="flex items-center gap-2.5">
                            <button
                                type="button"
                                onClick={() => setSearchOpen(true)}
                                className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 text-sm text-slate-600 transition-all hover:bg-slate-100 hover:border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500"
                                aria-label="Tìm kiếm nhanh trang và bài tập"
                            >
                                <span className="material-symbols-outlined text-[18px] text-blue-600">search</span>
                                <span className="hidden sm:inline">Tìm kiếm...</span>
                                <kbd className="hidden rounded bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 shadow-xs sm:inline border border-slate-200">
                                    Ctrl K
                                </kbd>
                            </button>

                            {/* Notifications Menu */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                                    className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 hover:text-blue-600"
                                    aria-label="Xem thông báo"
                                >
                                    <span className="material-symbols-outlined text-[20px]">notifications</span>
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-xs">
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {notificationsOpen && (
                                    <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                                        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                                            <span className="font-semibold text-slate-900 text-sm">Thông báo ({notifications.length})</span>
                                            <span className="text-xs text-blue-600 font-medium cursor-pointer hover:underline" onClick={() => setUnreadCount(0)}>
                                                Đánh dấu đã đọc
                                            </span>
                                        </div>
                                        <div className="max-h-72 overflow-y-auto space-y-1.5">
                                            {notifications.length === 0 ? (
                                                <div className="py-6 text-center text-xs text-slate-400">
                                                    Không có thông báo mới
                                                </div>
                                            ) : (
                                                notifications.map((n) => (
                                                    <Link
                                                        key={n.id}
                                                        href={n.link || "/ui/dashboard"}
                                                        onClick={() => setNotificationsOpen(false)}
                                                        className="block p-2.5 rounded-xl hover:bg-blue-50/60 transition border border-transparent hover:border-blue-100"
                                                    >
                                                        <div className="font-medium text-xs text-slate-900 line-clamp-1">{n.title}</div>
                                                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</div>
                                                    </Link>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User Avatar & Role Badge */}
                            <Link
                                href="/ui/account"
                                className="flex items-center gap-2.5 rounded-xl p-1 pr-2.5 hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
                                aria-label="Tài khoản cá nhân"
                            >
                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-xs font-bold text-white shadow-xs">
                                    {initials}
                                </div>
                                <div className="hidden text-left sm:block">
                                    <div className="text-xs font-semibold text-[#172033] max-w-[120px] truncate">
                                        {displayName}
                                    </div>
                                    <div className="text-[10px] text-blue-600 font-semibold">
                                        {roleBadgeText}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* Global Search Dialog */}
                {searchOpen && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 backdrop-blur-xs p-4 pt-20">
                        <div
                            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                            role="dialog"
                            aria-modal="true"
                        >
                            <div className="flex items-center border-b border-slate-100 pb-3">
                                <span className="material-symbols-outlined mr-2 text-blue-600">search</span>
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm trang chức năng hoặc bài tập..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    autoFocus
                                    className="w-full bg-transparent text-sm text-[#172033] placeholder:text-slate-400 focus:outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setSearchOpen(false)}
                                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>

                            <div className="mt-3 max-h-64 overflow-y-auto space-y-1">
                                {searchResults.length === 0 ? (
                                    <div className="py-8 text-center text-sm text-slate-400">
                                        Không tìm thấy trang hoặc chức năng phù hợp
                                    </div>
                                ) : (
                                    searchResults.map((item) => (
                                        <button
                                            key={item.href}
                                            type="button"
                                            onClick={() => {
                                                setSearchOpen(false);
                                                router.push(item.href);
                                            }}
                                            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-900 transition"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-[20px] text-blue-600">
                                                    {item.icon}
                                                </span>
                                                <span className="font-medium">{item.label}</span>
                                            </div>
                                            <span className="text-xs text-slate-400">{item.href}</span>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    {children}
                </main>

                <AppFooter />
            </div>
        </div>
    );
}