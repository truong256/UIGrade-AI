export type Trend = {
    delta: number;
    direction: "up" | "down" | "flat";
    absolute: number;
};

export type RangeDays = 7 | 30 | 90;

export type DashboardUserRole = "admin" | "teacher" | "User";

export type DashboardData = {
    generatedAt: string;
    rangeDays: number;
    user: {
        role: DashboardUserRole;
        name: string;
        greeting: string;
    };
    summary: {
        totalClasses: number;
        totalAssignments: number;
        totalStudents: number;
        totalSubmissions: number;
    };
    stats: {
        totalSubmissions: {
            current: number;
            previous: number;
            trend: Trend;
            subtitle: string;
        };
        completionRate: {
            current: number;
            previous: number;
            trend: Trend;
            subtitle: string;
        };
        averageScore: {
            current: number;
            previous: number;
            trend: Trend;
            subtitle: string;
        };
        needsAttention: {
            current: number;
            previous: number;
            trend: Trend;
            subtitle: string;
        };
    };
    charts: {
        submissionsByDay: Array<{
            date: string;
            label: string;
            value: number;
        }>;
        averageScoreByClass: Array<{
            label: string;
            value: number;
        }>;
    };
    notifications: Array<{
        id: string;
        type: "warning" | "info" | "success";
        title: string;
        description: string;
        occurredAt: string;
    }>;
    recentActivities: Array<{
        submissionId: string;
        studentName: string;
        className: string;
        assignmentTitle: string;
        score: number | null;
        scoreClassName: string;
        status: string;
        submittedAt: string | null;
        actionHref: string;
    }>;
};
