export const libraryHeaderData = {
    title: "Kho bài tập",
    description: "Quản lý và theo dõi tiến độ các bài tập của học sinh.",
};

export const filterData = {
    subjectOptions: [
        { label: "Tất cả môn học", value: "all" },
        { label: "Toán học", value: "math" },
        { label: "Vật lý", value: "physics" },
        { label: "Tin học", value: "it" },
    ],
    classOptions: [
        { label: "Tất cả lớp", value: "all" },
        { label: "Lớp 12A1", value: "12a1" },
        { label: "Lớp 11B2", value: "11b2" },
        { label: "Lớp 10C5", value: "10c5" },
    ],
};

export const tabItems = [
    { label: "Tất cả bài tập", active: true },
    { label: "Đang mở (12)" },
    { label: "Đã đóng (45)" },
    { label: "Bản nháp" },
];

export const assignmentItems = [
    {
        title: "Kiểm tra Đại số chương 3 - Đạo hàm",
        subject: "Toán học",
        duration: "45 phút",
        status: "Đang mở",
        statusClassName: "bg-green-100 text-green-700",
        gradientClassName: "bg-gradient-to-br from-orange-100 to-orange-50",
        icon: "functions",
        iconColorClassName: "text-orange-500",
        iconBgClassName: "bg-white/80",
        classBadges: ["A1", "A2"],
        classText: "Lớp 12A1, 12A2",
        createdAt: "12/10/2023",
        actionIcon: "edit",
    },
    {
        title: "Thực hành lập trình C++ cơ bản",
        subject: "Tin học",
        duration: "90 phút",
        status: "Đã đóng",
        statusClassName: "bg-slate-200 text-slate-600",
        gradientClassName: "bg-gradient-to-br from-slate-200 to-slate-100",
        icon: "terminal",
        iconColorClassName: "text-blue-500",
        iconBgClassName: "bg-white/80",
        classBadges: ["C5"],
        classText: "Lớp 11C5",
        createdAt: "05/10/2023",
        actionIcon: "bar_chart",
    },
    {
        title: "Vật lý 10: Cơ học chất lưu",
        subject: "Vật lý",
        duration: "30 phút",
        status: "Đang mở",
        statusClassName: "bg-green-100 text-green-700",
        gradientClassName: "bg-gradient-to-br from-orange-100 to-amber-50",
        icon: "bolt",
        iconColorClassName: "text-orange-500",
        iconBgClassName: "bg-white/80",
        classBadges: ["10A", "10B"],
        classText: "Lớp 10A, 10B",
        createdAt: "10/10/2023",
        actionIcon: "edit",
    },
];

export const paginationData = {
    summary: "Hiển thị 3 trong tổng số 57 bài tập",
    pages: [1, 2, 3],
    currentPage: 1,
};