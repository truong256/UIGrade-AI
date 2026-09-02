export type SettingsSidebarMatchMode = "exact" | "prefix";

export type SettingsSidebarItem = {
    label: string;
    icon: string;
    href?: string;
    matchMode?: SettingsSidebarMatchMode;
};

export type SettingsSidebarGroup = {
    title: string;
    items: SettingsSidebarItem[];
};

export const pageInfo = {
    title: "Cấu hình Server Chấm bài",
    description:
        "Thiết lập các thông số kỹ thuật cho các node chấm bài tự động và kết nối API.",
};

export const sidebarGroups: SettingsSidebarGroup[] = [
    {
        title: "Hệ thống",
        items: [
            {
                label: "Quản lý người dùng",
                icon: "group",
                href: "/ui/server_config/users",
                matchMode: "prefix",
            },
            {
                label: "Server Chấm bài",
                icon: "database",
                href: "/ui/server_config",
                matchMode: "exact",
            },
            {
                label: "Tạo bài",
                href: "/ui/server_config/create_assignment",
                icon: "edit_note",
            },
            {
                label: "Báo cáo",
                href: "/ui/server_config/learning_reports",
                icon: "bar_chart",
            },

        ],
    },
];

export const versionInfo = {
    version: "v2.1.0-Stable",
    updatedAt: "Đã cập nhật: 12 phút trước",
};