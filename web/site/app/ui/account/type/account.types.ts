export type CurrentUser = {
    _id: string;
    name: string;
    email: string;
    role: "admin" | "teacher" | "User";
    studentCode?: string;
    avatar?: string;
    phone?: string;
    department?: string;
    cohort?: string;
    bio?: string;
    notificationSettings?: {
        emailAssignments?: boolean;
        pushReminders?: boolean;
    };
};

export type EditProfilePayload = {
    name: string;
    email: string;
    studentCode: string;
    phone: string;
    department: string;
    cohort: string;
    bio: string;
    avatar: string;
};

export type NotificationSettingsPayload = {
    emailAssignments: boolean;
    pushReminders: boolean;
};

export type ChangePasswordPayload = {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
};

export type AccountCourseItem = {
    _id: string;
    title: string;
    subtitle: string;
    code: string;
    teacherName: string;
    studentCount: number;
};

export type SubmissionHistoryItem = {
    _id: string;
    title: string;
    submittedAt: string;
    status: string;
    score: string;
    statusColor: "green" | "orange" | "slate";
    icon: string;
    secondary: string;
};
