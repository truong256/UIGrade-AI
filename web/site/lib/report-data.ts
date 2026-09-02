export const pageHeaderData = {
    breadcrumbStart: "Trang chủ",
    breadcrumbCurrent: "Báo cáo chi tiết",
    title: "Báo cáo Kết quả Học tập",
    description: "Dữ liệu tổng hợp từ học kỳ 1 - Cập nhật lúc 10:30, 24/05/2024",
};

export const stats = [
    {
        title: "Điểm trung bình",
        value: "7.85",
        subValue: "+0.2",
        subValueColor: "text-green-500",
        subtitle: "So với tháng trước",
        icon: "grade",
        iconClassName: "bg-orange-100 text-orange-500",
    },
    {
        title: "Hoàn thành bài tập",
        value: "92.4%",
        subValue: "+5.1%",
        subValueColor: "text-green-500",
        subtitle: "Tỷ lệ nộp bài đúng hạn",
        icon: "task_alt",
        iconClassName: "bg-blue-100 text-blue-500",
    },
    {
        title: "Sĩ số học sinh",
        value: "1,240",
        subValue: "Tổng số",
        subValueColor: "text-slate-400",
        subtitle: "Toàn bộ các khối lớp",
        icon: "group",
        iconClassName: "bg-purple-100 text-purple-500",
    },
    {
        title: "Học sinh cần lưu ý",
        value: "12",
        subValue: "+2",
        subValueColor: "text-red-500",
        subtitle: "Điểm dưới trung bình",
        icon: "warning",
        iconClassName: "bg-red-100 text-red-500",
    },
];

export const scoreDistribution = {
    title: "Phổ điểm học sinh",
    filterLabel: "Tất cả các môn",
    items: [
        { label: "0-3", value: 15, className: "bg-orange-200" },
        { label: "4-5", value: 25, className: "bg-orange-200" },
        { label: "5-7", value: 60, className: "bg-orange-300" },
        { label: "7-9", value: 90, className: "bg-orange-400" },
        { label: "9-10", value: 45, className: "bg-orange-500" },
    ],
};

export const completionByGrade = [
    { label: "Khối 10", value: 96 },
    { label: "Khối 11", value: 88 },
    { label: "Khối 12", value: 91 },
];

export const highlightStudents = [
    {
        initials: "LH",
        name: "Lê Hoàng Nam",
        className: "Lớp 12A1",
        score: "9.6",
        badge: "Xuất sắc",
    },
    {
        initials: "PT",
        name: "Phạm Thu Thảo",
        className: "Lớp 11B2",
        score: "9.4",
        badge: "Xuất sắc",
    },
    {
        initials: "NM",
        name: "Nguyễn Minh Anh",
        className: "Lớp 10A5",
        score: "9.2",
        badge: "Xuất sắc",
    },
];

export const warningStudents = [
    {
        initials: "TD",
        name: "Trần Duy Mạnh",
        className: "Lớp 12C3",
        score: "4.2",
        level: "Yếu",
        note: "Thiếu 4 bài tập",
    },
    {
        initials: "HV",
        name: "Hoàng Văn Bình",
        className: "Lớp 11D1",
        score: "4.8",
        level: "Yếu",
        note: "Thiếu 2 bài tập",
    },
    {
        initials: "NT",
        name: "Nguyễn Thanh Sơn",
        className: "Lớp 10A1",
        score: "3.5",
        level: "Yếu",
        note: "Thiếu 7 bài tập",
    },
];