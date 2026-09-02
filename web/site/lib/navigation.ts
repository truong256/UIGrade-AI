/**
 * lib/navigation.ts
 *
 * Role-aware navigation items.
 *
 * Each role has its own set of nav items. The Admin-only items
 * (server_config) are NOT included in the Lecturer or Student navbars.
 *
 * SECURITY NOTE: Navigation visibility is a UX concern, NOT a security boundary.
 * The server must independently enforce authorization on every route and API.
 * These lists only control what appears in the sidebar — they do not grant access.
 */

export type NavItem = {
    label: string;
    href: string;
    icon: string;
};

/** Navigation items for the Admin role. Includes system administration. */
export const adminNavItems: NavItem[] = [
    { label: "Tổng quan", href: "/ui/dashboard", icon: "dashboard" },
    { label: "Lớp học", href: "/ui/my_classes", icon: "groups" },
    { label: "Bài tập", href: "/ui/assignment_list", icon: "assignment" },
    { label: "Cấu hình", href: "/ui/server_config", icon: "settings" },
    { label: "Người dùng", href: "/ui/server_config/users", icon: "manage_accounts" },
    { label: "Tài khoản", href: "/ui/account", icon: "person" },
];

/** Navigation items for Lecturer (teacher) role. No admin paths. */
export const lecturerNavItems: NavItem[] = [
    { label: "Tổng quan", href: "/ui/dashboard", icon: "dashboard" },
    { label: "Lớp học", href: "/ui/my_classes", icon: "groups" },
    { label: "Bài tập", href: "/ui/assignment_list", icon: "assignment" },
    { label: "Thư viện bài", href: "/ui/assignment_library", icon: "library_books" },
    { label: "Chấm bài", href: "/ui/grading_detail", icon: "grading" },
    { label: "Tài khoản", href: "/ui/account", icon: "person" },
];

/** Navigation items for Student role. No admin or lecturer-only paths. */
export const studentNavItems: NavItem[] = [
    { label: "Tổng quan", href: "/ui/dashboard", icon: "dashboard" },
    { label: "Lớp học", href: "/ui/my_classes", icon: "groups" },
    { label: "Bài tập", href: "/ui/assignment_list", icon: "assignment" },
    { label: "Nộp bài", href: "/ui/submit_assignment", icon: "upload_file" },
    { label: "Kết quả", href: "/ui/my_results", icon: "school" },
    { label: "Tài khoản", href: "/ui/account", icon: "person" },
];

/**
 * Get the appropriate nav items for a given role.
 * Unknown roles default to the most restrictive (student) set.
 */
export function getNavItemsForRole(role: string | undefined | null): NavItem[] {
    if (role === "admin") return adminNavItems;
    if (role === "lecturer" || role === "teacher") return lecturerNavItems;
    return studentNavItems; // safe default
}

export function isActivePath(pathname: string, href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`);
}