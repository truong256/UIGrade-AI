"use client";

import { useEffect, useMemo, useState } from "react";
import { ProfileHero } from "@/components/account/ProfileHero";
import { NotificationSettings } from "@/components/account/NotificationSettings";
import { CurrentCoursesSection } from "@/components/account/CurrentCoursesSection";
import { SubmissionHistory } from "@/components/account/SubmissionHistory";
import { EditProfileDialog } from "@/components/account/EditProfileDialog";
import { ChangePasswordDialog } from "@/components/account/ChangePasswordDialog";
import { accountService }  from "@/services/account.service";
import type {
    AccountCourseItem,
    ChangePasswordPayload,
    CurrentUser,
    EditProfilePayload,
    NotificationSettingsPayload,
    SubmissionHistoryItem,
} from "@/app/ui/account/type/account.types";

type AnyObject = Record<string, any>;

type ClassroomResponse = {
    _id?: string;
    name?: string;
    code?: string;
    semester?: string;
    academicYear?: string;
    teacher?: {
        name?: string;
    };
    approvedStudentCount?: number;
    studentCount?: number;
    studentIds?: unknown[];
};

type SubmissionResponse = {
    _id?: string;
    assignmentId?: AnyObject;
    classroomId?: AnyObject;
    studentId?: AnyObject;
    submittedAt?: string;
    status?: string;
    gradeStatus?: string;
    finalScore?: number | null;
    autoGrade?: AnyObject;
};

function asObject(value: unknown): AnyObject {
    return typeof value === "object" && value !== null ? (value as AnyObject) : {};
}

function toText(value: unknown, fallback = "") {
    if (typeof value === "string") return value;
    if (value === null || value === undefined) return fallback;
    return String(value);
}

function toNumberValue(value: unknown, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function formatDateTime(value?: string) {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function formatScore(value: number | null | undefined, maxScore: number) {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return "--/--";
    }

    const scoreValue = Number(value);
    const maxValue = Number.isFinite(Number(maxScore)) ? Number(maxScore) : 10;
    return `${Number.isInteger(scoreValue) ? scoreValue : scoreValue.toFixed(1)}/${maxValue}`;
}

function mapNotificationSettings(user: CurrentUser | null): NotificationSettingsPayload {
    return {
        emailAssignments: Boolean(user?.notificationSettings?.emailAssignments),
        pushReminders: Boolean(user?.notificationSettings?.pushReminders),
    };
}

function mapCourses(classrooms: ClassroomResponse[]): AccountCourseItem[] {
    return classrooms.map((item) => ({
        _id: toText(item._id),
        title: toText(item.name, "Lớp học chưa đặt tên"),
        subtitle:
            [toText(item.semester), toText(item.academicYear)]
                .filter(Boolean)
                .join(" • ") || "Chưa cập nhật học kỳ",
        code: toText(item.code),
        teacherName: toText(item.teacher?.name, "Chưa cập nhật"),
        studentCount:
            typeof item.approvedStudentCount === "number"
                ? item.approvedStudentCount
                : typeof item.studentCount === "number"
                    ? item.studentCount
                    : Array.isArray(item.studentIds)
                        ? item.studentIds.length
                        : 0,
    }));
}

function mapSubmissions(submissions: SubmissionResponse[], role?: CurrentUser["role"]): SubmissionHistoryItem[] {
    return submissions.map((entry) => {
        const assignment = asObject(entry.assignmentId);
        const classroom = asObject(entry.classroomId);
        const student = asObject(entry.studentId);
        const autoGrade = asObject(entry.autoGrade);

        const scoreValue =
            entry.finalScore === null || entry.finalScore === undefined
                ? autoGrade.score === null || autoGrade.score === undefined
                    ? null
                    : toNumberValue(autoGrade.score, 0)
                : toNumberValue(entry.finalScore, 0);

        const maxScore = toNumberValue(assignment.maxScore || autoGrade.maxScore, 10);
        const gradeStatus = toText(entry.gradeStatus, "pending");
        const submissionStatus = toText(entry.status, "submitted");

        let status = "Chưa chấm";
        let statusColor: SubmissionHistoryItem["statusColor"] = "slate";
        let icon = "schedule";

        if (gradeStatus === "overridden" || gradeStatus === "auto_graded") {
            status = "Đã chấm";
            statusColor = "green";
            icon = "task_alt";
        } else if (submissionStatus === "late") {
            status = "Nộp muộn";
            statusColor = "orange";
            icon = "warning";
        } else if (submissionStatus === "submitted") {
            status = "Đang chấm";
            statusColor = "orange";
            icon = "schedule";
        }

        const secondary =
            role === "teacher" || role === "admin"
                ? `${toText(student.name, "Sinh viên")} • ${toText(classroom.name, "Chưa có lớp")}`
                : `${toText(classroom.name, "Chưa có lớp")} • ${toText(assignment.title, "Bài tập")}`;

        return {
            _id: toText(entry._id),
            title: toText(assignment.title, "Bài tập chưa đặt tên"),
            submittedAt: `Cập nhật ${formatDateTime(toText(entry.submittedAt))}`,
            status,
            score: formatScore(scoreValue, maxScore),
            statusColor,
            icon,
            secondary,
        };
    });
}

export function AccountPageClient() {
    const [user, setUser] = useState<CurrentUser | null>(null);
    const [courses, setCourses] = useState<AccountCourseItem[]>([]);
    const [history, setHistory] = useState<SubmissionHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState("");
    const [savingProfile, setSavingProfile] = useState(false);
    const [savingPassword, setSavingPassword] = useState(false);
    const [savingPreferences, setSavingPreferences] = useState(false);
    const [editProfileOpen, setEditProfileOpen] = useState(false);
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError("");

                const [profileRes, classesRes, submissionsRes] = await Promise.all([
                    accountService.getProfile(),
                    fetch("/api/classes", { cache: "no-store" }).then(async (res) => ({ ok: res.ok, json: await res.json().catch(() => ({})) })),
                    fetch("/api/submissions", { cache: "no-store" }).then(async (res) => ({ ok: res.ok, json: await res.json().catch(() => ({})) })),
                ]);

                const currentUser = profileRes.user || null;
                setUser(currentUser);

                if (classesRes.ok && Array.isArray(classesRes.json.data)) {
                    setCourses(mapCourses(classesRes.json.data as ClassroomResponse[]));
                } else {
                    setCourses([]);
                }

                if (submissionsRes.ok && Array.isArray(submissionsRes.json.data)) {
                    setHistory(mapSubmissions(submissionsRes.json.data as SubmissionResponse[], currentUser?.role));
                } else {
                    setHistory([]);
                }
            } catch (loadError) {
                setError(loadError instanceof Error ? loadError.message : "Không thể tải trang tài khoản");
            } finally {
                setLoading(false);
            }
        };

        void loadData();
    }, []);

    useEffect(() => {
        if (!toast) return;
        const timer = window.setTimeout(() => setToast(""), 2500);
        return () => window.clearTimeout(timer);
    }, [toast]);

    const notificationSettings = useMemo(
        () => mapNotificationSettings(user),
        [user]
    );

    const handleUpdateProfile = async (payload: EditProfilePayload) => {
        try {
            setSavingProfile(true);

            await accountService.updateProfile(payload);
            const profileRes = await accountService.getProfile();

            setUser(profileRes.user);
            setEditProfileOpen(false);
            setToast("Cập nhật hồ sơ thành công");
        } catch (profileError) {
            setToast(
                profileError instanceof Error
                    ? profileError.message
                    : "Không thể cập nhật hồ sơ"
            );
            throw profileError;
        } finally {
            setSavingProfile(false);
        }
    };

    const handleChangePassword = async (payload: ChangePasswordPayload) => {
        try {
            setSavingPassword(true);
            const result = await accountService.changePassword(payload);
            setChangePasswordOpen(false);
            setToast(result.message || "Đổi mật khẩu thành công");
        } finally {
            setSavingPassword(false);
        }
    };

    const handleUpdatePreferences = async (next: NotificationSettingsPayload) => {
        const previousUser = user;

        setUser((prev) =>
            prev
                ? {
                    ...prev,
                    notificationSettings: next,
                }
                : prev
        );

        try {
            setSavingPreferences(true);
            const result = await accountService.updatePreferences(next);
            setUser((prev) =>
                prev
                    ? {
                        ...prev,
                        notificationSettings: result.notificationSettings,
                    }
                    : prev
            );
            setToast(result.message || "Đã lưu cài đặt thông báo");
        } catch (preferenceError) {
            setUser(previousUser);
            setToast(preferenceError instanceof Error ? preferenceError.message : "Không thể lưu cài đặt thông báo");
        } finally {
            setSavingPreferences(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="rounded-2xl bg-white p-8 shadow-sm">
                    <div className="animate-pulse space-y-4">
                        <div className="mx-auto h-32 w-32 rounded-full bg-slate-200" />
                        <div className="mx-auto h-6 w-48 rounded bg-slate-200" />
                        <div className="mx-auto h-4 w-64 rounded bg-slate-200" />
                    </div>
                </div>
                <div className="rounded-2xl bg-white p-8 shadow-sm">
                    <div className="h-40 animate-pulse rounded-2xl bg-slate-100" />
                </div>
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
                <p className="text-lg font-semibold text-red-600">Không tải được trang tài khoản</p>
                <p className="mt-2 text-sm text-slate-500">{error || "Bạn cần đăng nhập lại để tiếp tục."}</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <ProfileHero
                    user={user}
                    onEditProfile={() => setEditProfileOpen(true)}
                    onChangePassword={() => setChangePasswordOpen(true)}
                />

                <NotificationSettings
                    value={notificationSettings}
                    loading={savingPreferences}
                    onChange={handleUpdatePreferences}
                />

                <CurrentCoursesSection items={courses} />
                <SubmissionHistory items={history} />
            </div>

            {toast && (
                <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-2xl">
                    {toast}
                </div>
            )}

            <EditProfileDialog
                open={editProfileOpen}
                user={user}
                loading={savingProfile}
                onClose={() => setEditProfileOpen(false)}
                onSubmit={handleUpdateProfile}
            />

            <ChangePasswordDialog
                open={changePasswordOpen}
                loading={savingPassword}
                onClose={() => setChangePasswordOpen(false)}
                onSubmit={handleChangePassword}
            />
        </>
    );
}
