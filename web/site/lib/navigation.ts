export const navItems = [
    { label: "Tổng quan", href: "/ui/dashboard", icon: "dashboard" },
    { label: "Lớp học", href: "/ui/my_classes", icon: "groups" },
    { label: "Bài tập", href: "/ui/assignment_list", icon: "assignment" },
    // { label: "Tạo bài", href: "/ui/create_assignment", icon: "edit_note" },
    // { label: "Báo cáo", href: "/ui/learning_reports", icon: "assessment" },
    { label: "Cấu hình", href: "/ui/server_config", icon: "settings" },
    { label: "Nộp bài", href: "/ui/submit_assignment", icon: "upload_file" },
    {label: "kết quả học tập", href: "/ui/my_results", icon: "school" },
    { label: "Chấm bài", href: "/ui/grading_detail", icon: "grading" },
    { label: "Tài khoản", href: "/ui/account", icon: "person" },
];

export function isActivePath(pathname: string, href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
}