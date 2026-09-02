export type StatItem = {
    title: string;
    value: string;
    trend: string;
    trendUp: boolean;
    subtitle: string;
    icon: string;
    iconClassName: string;
};

export type ClassScoreItem = {
    label: string;
    value: number;
    highlight?: boolean;
};

export type NotificationItem = {
    title: string;
    description: string;
    time: string;
    icon: string;
    iconClassName: string;
    borderClassName: string;
};

export type ActivityItem = {
    name: string;
    className: string;
    subject: string;
    score: string;
    scoreClassName: string;
};

export const stats: StatItem[] = [
    {
        title: "Tổng bài nộp",
        value: "1,250",
        trend: "12%",
        trendUp: true,
        subtitle: "So với tháng trước",
        icon: "description",
        iconClassName: "bg-orange-100 text-orange-600",
    },
    {
        title: "Tỷ lệ hoàn thành",
        value: "85.4%",
        trend: "2.1%",
        trendUp: false,
        subtitle: "Đã chấm thành công",
        icon: "task_alt",
        iconClassName: "bg-blue-100 text-blue-600",
    },
    {
        title: "Điểm trung bình",
        value: "7.8/10",
        trend: "0.5%",
        trendUp: true,
        subtitle: "Toàn hệ thống",
        icon: "star",
        iconClassName: "bg-yellow-100 text-yellow-600",
    },
    {
        title: "Thời gian chấm",
        value: "1.2s",
        trend: "0.1s",
        trendUp: true,
        subtitle: "Mỗi bài làm",
        icon: "speed",
        iconClassName: "bg-purple-100 text-purple-600",
    },
];

export const classScores: ClassScoreItem[] = [
    { label: "Lớp 12A1", value: 85, highlight: true },
    { label: "Lớp 12A2", value: 70 },
    { label: "Lớp 11B1", value: 92, highlight: true },
    { label: "Lớp 10C2", value: 45 },
    { label: "Lớp 11D3", value: 60 },
];

export const notifications: NotificationItem[] = [
    {
        title: "Hết hạn nộp bài tập Toán",
        description: "Lớp 12A1 có 5 học sinh chưa nộp bài.",
        time: "10 phút trước",
        icon: "warning",
        iconClassName: "text-orange-500",
        borderClassName: "border-orange-500",
    },
    {
        title: "Cập nhật hệ thống",
        description: "AI được nâng cấp độ chính xác lên 99.5%.",
        time: "2 giờ trước",
        icon: "info",
        iconClassName: "text-blue-500",
        borderClassName: "border-blue-500",
    },
    {
        title: "Hoàn tất chấm bài",
        description: "Đã hoàn thành 150 bài kiểm tra Lí lớp 10.",
        time: "5 giờ trước",
        icon: "check_circle",
        iconClassName: "text-green-500",
        borderClassName: "border-green-500",
    },
];

export const recentActivities: ActivityItem[] = [
    {
        name: "Nguyễn Văn A",
        className: "12A1",
        subject: "Toán học",
        score: "9.5/10",
        scoreClassName: "bg-green-100 text-green-700",
    },
    {
        name: "Trần Thị B",
        className: "11B2",
        subject: "Vật lí",
        score: "7.0/10",
        scoreClassName: "bg-yellow-100 text-yellow-700",
    },
    {
        name: "Lê Hoàng C",
        className: "12A1",
        subject: "Toán học",
        score: "4.5/10",
        scoreClassName: "bg-red-100 text-red-700",
    },
    {
        name: "Phạm Minh D",
        className: "10C3",
        subject: "Hóa học",
        score: "8.0/10",
        scoreClassName: "bg-green-100 text-green-700",
    },
];