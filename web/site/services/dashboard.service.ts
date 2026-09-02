import User from "@/models/User.model";
import Submission from "@/models/Submission.model";
import { assignmentRepository } from "@/repositories/assignment.repository";
import { classroomRepository } from "@/repositories/classroom.repository";
import * as classroomMemberRepo from "@/repositories/classroom-member.repository";
import { ClassroomMemberModel } from "@/models/Classroom-member.model";
import type { CurrentUserPayload } from "@/lib/current-user";

type UnknownRecord = Record<string, unknown>;

type DashboardFilters = {
    rangeDays?: number;
};

type NormalizedClassroom = {
    _id: string;
    name: string;
    code: string;
};

type NormalizedAssignment = {
    _id: string;
    title: string;
    classroomId: string;
    classroomName: string;
    classroomCode: string;
    dueAt: Date | null;
    createdAt: Date | null;
    maxScore: number;
};

type NormalizedSubmission = {
    _id: string;
    assignmentId: string;
    assignmentTitle: string;
    classroomId: string;
    classroomName: string;
    classroomCode: string;
    studentId: string;
    studentName: string;
    submittedAt: Date | null;
    finalScore: number | null;
    normalizedScore: number | null;
    gradeStatus: string;
    status: string;
    isLate: boolean;
};

function isObject(value: unknown): value is UnknownRecord {
    return typeof value === "object" && value !== null;
}

function toObject(value: unknown): UnknownRecord {
    return isObject(value) ? value : {};
}

function toStringId(value: unknown): string {
    if (!value) return "";

    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") {
        return String(value);
    }

    if (typeof value === "object" && value !== null) {
        const typed = value as { _id?: unknown; toString?: () => string };

        if (typed._id && typed._id !== value) {
            return toStringId(typed._id);
        }

        if (typeof typed.toString === "function") {
            const text = typed.toString();
            if (text && text !== "[object Object]") {
                return text;
            }
        }
    }

    return String(value);
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

function safeDate(value: unknown): Date | null {
    if (!value) return null;
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
}

function round1(value: number) {
    return Math.round(value * 10) / 10;
}

function round2(value: number) {
    return Math.round(value * 100) / 100;
}

function startOfDay(value: Date) {
    const next = new Date(value);
    next.setHours(0, 0, 0, 0);
    return next;
}

function endOfDay(value: Date) {
    const next = new Date(value);
    next.setHours(23, 59, 59, 999);
    return next;
}

function addDays(value: Date, days: number) {
    const next = new Date(value);
    next.setDate(next.getDate() + days);
    return next;
}

function isBetween(date: Date | null, start: Date, end: Date) {
    if (!date) return false;
    const time = date.getTime();
    return time >= start.getTime() && time <= end.getTime();
}

function getGreeting() {
    const hour = new Date().getHours();

    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
}

function formatDayLabel(date: Date) {
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
    }).format(date);
}

function ensureCanViewDashboard(currentUser: CurrentUserPayload | null) {
    if (!currentUser?.userId) {
        throw new Error("Bạn chưa đăng nhập");
    }
}

function buildTrend(current: number, previous: number, digits = 1) {
    const delta = round1(current - previous);
    return {
        delta,
        direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
        absolute: Number(Math.abs(delta).toFixed(digits)),
    };
}

function scoreBadgeClass(score: number | null) {
    if (score === null || score === undefined) {
        return "bg-slate-100 text-slate-600";
    }

    if (score >= 8) return "bg-emerald-100 text-emerald-700";
    if (score >= 6.5) return "bg-amber-100 text-amber-700";
    return "bg-red-100 text-red-700";
}

function uniqueById<T>(items: T[], getId: (item: T) => string) {
    const map = new Map<string, T>();

    for (const item of items) {
        const id = getId(item);
        if (!id) continue;
        map.set(id, item);
    }

    return Array.from(map.values());
}

async function getAccessibleClassrooms(currentUser: CurrentUserPayload) {
    if (currentUser.role === "admin") {
        const docs = await classroomRepository.findAll();
        return docs as unknown[];
    }

    if (currentUser.role === "lecturer") {
        const [ownedClasses, supportedClassIds] = await Promise.all([
            classroomRepository.findAllByTeacherId(currentUser.userId),
            classroomMemberRepo.findClassroomIdsByUserId(currentUser.userId, {
                status: "active",
                roleInClass: "teacher",
            }),
        ]);

        const supportedClasses = supportedClassIds.length
            ? await classroomRepository.findAllByIds(supportedClassIds)
            : [];

        return uniqueById(
            [...(ownedClasses as unknown[]), ...(supportedClasses as unknown[])],
            (item) => toStringId(toObject(item)._id)
        );
    }

    const joinedClassIds = await classroomMemberRepo.findClassroomIdsByUserId(
        currentUser.userId,
        { status: "active" }
    );

    if (!joinedClassIds.length) {
        return [];
    }

    const docs = await classroomRepository.findAllByIds(joinedClassIds);
    return docs as unknown[];
}

function createEmptyDashboard(currentUser: CurrentUserPayload, name: string, rangeDays: number) {
    return {
        generatedAt: new Date().toISOString(),
        rangeDays,
        user: {
            role: currentUser.role,
            name,
            greeting: `${getGreeting()}, ${name || "bạn"}!`,
        },
        summary: {
            totalClasses: 0,
            totalAssignments: 0,
            totalStudents: currentUser.role === "student" ? 1 : 0,
            totalSubmissions: 0,
        },
        stats: {
            totalSubmissions: { current: 0, previous: 0, trend: buildTrend(0, 0), subtitle: `Trong ${rangeDays} ngày qua` },
            completionRate: { current: 0, previous: 0, trend: buildTrend(0, 0), subtitle: "Tỷ lệ bài đã được chấm" },
            averageScore: { current: 0, previous: 0, trend: buildTrend(0, 0), subtitle: "Điểm trung bình bài đã chấm" },
            needsAttention: { current: 0, previous: 0, trend: buildTrend(0, 0), subtitle: currentUser.role === "student" ? "Bài đang chờ chấm" : "Bài cần xử lý" },
        },
        charts: {
            submissionsByDay: [],
            averageScoreByClass: [],
        },
        notifications: [],
        recentActivities: [],
    };
}

export const dashboardService = {
    async getOverview(currentUser: CurrentUserPayload | null, filters: DashboardFilters) {
        ensureCanViewDashboard(currentUser);

        const rangeDays = [7, 30, 90].includes(Number(filters.rangeDays))
            ? Number(filters.rangeDays)
            : 7;

        const userDoc = await User.findById(currentUser?.userId)
            .select("name role")
            .lean();

        const userName = toText(toObject(userDoc).name, currentUser?.role === "admin" ? "Admin" : currentUser?.role === "lecturer" ? "Giáo viên" : "Học viên");
        const accessibleClasses = await getAccessibleClassrooms(currentUser as CurrentUserPayload);
        const normalizedClasses = accessibleClasses
            .map((raw) => {
                const item = toObject(raw);
                return {
                    _id: toStringId(item._id),
                    name: toText(item.name, "Lớp học"),
                    code: toText(item.code),
                } satisfies NormalizedClassroom;
            })
            .filter((item) => item._id);

        if (!normalizedClasses.length) {
            return createEmptyDashboard(currentUser as CurrentUserPayload, userName, rangeDays);
        }

        const classIds = normalizedClasses.map((item) => item._id);

        const studentMemberships = await ClassroomMemberModel.find({
            classroomId: { $in: classIds },
            roleInClass: "student",
            status: "active",
        })
            .populate("userId", "name studentCode")
            .lean();

        const classroomStudentCounts = studentMemberships.reduce<Record<string, number>>((acc, raw) => {
            const item = toObject(raw);
            const classroomId = toStringId(item.classroomId);
            if (!classroomId) return acc;
            acc[classroomId] = (acc[classroomId] || 0) + 1;
            return acc;
        }, {});

        const uniqueStudents = new Set<string>();
        for (const raw of studentMemberships) {
            const user = toObject(toObject(raw).userId);
            const userId = toStringId(user._id);
            if (userId) uniqueStudents.add(userId);
        }

        const assignmentDocs = await assignmentRepository.findManyByClassroomIds(classIds, {
            includeDraft: false,
        });

        const normalizedAssignments = (assignmentDocs as unknown[])
            .map((raw) => {
                const item = toObject(raw);
                const classroom = toObject(item.classroomId);
                return {
                    _id: toStringId(item._id),
                    title: toText(item.title, "Bài tập"),
                    classroomId: toStringId(classroom._id || item.classroomId),
                    classroomName: toText(classroom.name, "Lớp học"),
                    classroomCode: toText(classroom.code),
                    dueAt: safeDate(item.dueAt),
                    createdAt: safeDate(item.createdAt),
                    maxScore: Math.max(0.0001, toNumberValue(item.maxScore, 10)),
                } satisfies NormalizedAssignment;
            })
            .filter((item) => item._id);

        const assignmentMap = new Map<string, NormalizedAssignment>(
            normalizedAssignments.map((item) => [item._id, item])
        );

        const submissionFilter: Record<string, unknown> = {
            classroomId: { $in: classIds },
            latest: true,
        };

        if (currentUser?.role === "student") {
            submissionFilter.studentId = currentUser.userId;
        }

        const submissionDocs = await Submission.find(submissionFilter)
            .populate("studentId", "name email studentCode")
            .populate("assignmentId", "title maxScore dueAt classroomId")
            .populate("classroomId", "name code")
            .sort({ submittedAt: -1 })
            .lean();

        const normalizedSubmissions = (submissionDocs as unknown[]).map((raw) => {
            const item = toObject(raw);
            const student = toObject(item.studentId);
            const assignmentRaw = toObject(item.assignmentId);
            const classroomRaw = toObject(item.classroomId);
            const assignmentId = toStringId(assignmentRaw._id || item.assignmentId);
            const assignment = assignmentMap.get(assignmentId);
            const maxScore = assignment?.maxScore || Math.max(0.0001, toNumberValue(assignmentRaw.maxScore, 10));
            const rawScore = item.finalScore ?? toObject(item.autoGrade).score ?? null;
            const finalScore = rawScore === null || rawScore === undefined ? null : toNumberValue(rawScore, 0);
            const normalizedScore = finalScore === null ? null : round2((finalScore / maxScore) * 10);

            return {
                _id: toStringId(item._id),
                assignmentId,
                assignmentTitle: assignment?.title || toText(assignmentRaw.title, "Bài tập"),
                classroomId: assignment?.classroomId || toStringId(classroomRaw._id || item.classroomId),
                classroomName: assignment?.classroomName || toText(classroomRaw.name, "Lớp học"),
                classroomCode: assignment?.classroomCode || toText(classroomRaw.code),
                studentId: toStringId(student._id || item.studentId),
                studentName: toText(student.name, "Học sinh"),
                submittedAt: safeDate(item.submittedAt),
                finalScore,
                normalizedScore,
                gradeStatus: toText(item.gradeStatus, "pending"),
                status: toText(item.status, "submitted"),
                isLate: Boolean(item.isLate),
            } satisfies NormalizedSubmission;
        });

        const now = new Date();
        const currentStart = startOfDay(addDays(now, -(rangeDays - 1)));
        const currentEnd = endOfDay(now);
        const previousEnd = endOfDay(addDays(currentStart, -1));
        const previousStart = startOfDay(addDays(previousEnd, -(rangeDays - 1)));

        const currentSubmissions = normalizedSubmissions.filter((item) =>
            isBetween(item.submittedAt, currentStart, currentEnd)
        );
        const previousSubmissions = normalizedSubmissions.filter((item) =>
            isBetween(item.submittedAt, previousStart, previousEnd)
        );

        const currentGraded = currentSubmissions.filter((item) => item.normalizedScore !== null);
        const previousGraded = previousSubmissions.filter((item) => item.normalizedScore !== null);

        const currentCompletionRate = currentSubmissions.length
            ? round1((currentGraded.length / currentSubmissions.length) * 100)
            : 0;
        const previousCompletionRate = previousSubmissions.length
            ? round1((previousGraded.length / previousSubmissions.length) * 100)
            : 0;

        const currentAverageScore = currentGraded.length
            ? round2(
                currentGraded.reduce((sum, item) => sum + Number(item.normalizedScore || 0), 0) /
                currentGraded.length
            )
            : 0;
        const previousAverageScore = previousGraded.length
            ? round2(
                previousGraded.reduce((sum, item) => sum + Number(item.normalizedScore || 0), 0) /
                previousGraded.length
            )
            : 0;

        const attentionStatuses = currentUser?.role === "student"
            ? ["pending"]
            : ["pending", "needs_teacher_review"];

        const currentNeedsAttention = currentSubmissions.filter((item) =>
            attentionStatuses.includes(item.gradeStatus)
        ).length;
        const previousNeedsAttention = previousSubmissions.filter((item) =>
            attentionStatuses.includes(item.gradeStatus)
        ).length;

        const dayBuckets = Array.from({ length: rangeDays }).map((_, index) => {
            const date = startOfDay(addDays(currentStart, index));
            const nextDate = endOfDay(date);
            const items = currentSubmissions.filter((submission) =>
                isBetween(submission.submittedAt, date, nextDate)
            );

            return {
                date: date.toISOString(),
                label: formatDayLabel(date),
                value: items.length,
            };
        });

        const byClassMap = new Map<
            string,
            {
                label: string;
                total: number;
                count: number;
            }
        >();

        for (const item of currentGraded) {
            const label = item.classroomCode || item.classroomName || "Lớp học";
            const existing = byClassMap.get(item.classroomId) || {
                label,
                total: 0,
                count: 0,
            };

            existing.total += Number(item.normalizedScore || 0);
            existing.count += 1;
            byClassMap.set(item.classroomId, existing);
        }

        const averageScoreByClass = Array.from(byClassMap.values())
            .map((item) => ({
                label: item.label,
                value: item.count ? round2(item.total / item.count) : 0,
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);

        const submissionKeySet = new Set(
            normalizedSubmissions.map((item) => `${item.assignmentId}:${item.studentId}`)
        );

        const notifications: Array<{
            id: string;
            type: "warning" | "info" | "success";
            title: string;
            description: string;
            occurredAt: string;
        }> = [];

        if (currentUser?.role === "student") {
            const myAssignmentIds = new Set(normalizedSubmissions.map((item) => item.assignmentId));

            const dueSoon = normalizedAssignments
                .filter((item) => {
                    if (!item.dueAt) return false;
                    if (item.dueAt.getTime() < now.getTime()) return false;
                    if (item.dueAt.getTime() > addDays(now, 2).getTime()) return false;
                    return !myAssignmentIds.has(item._id);
                })
                .sort((a, b) => (a.dueAt?.getTime() || 0) - (b.dueAt?.getTime() || 0))
                .slice(0, 2);

            for (const item of dueSoon) {
                notifications.push({
                    id: `due-${item._id}`,
                    type: "warning",
                    title: `Sắp đến hạn nộp ${item.title}`,
                    description: `${item.classroomCode || item.classroomName} đến hạn trong 48 giờ tới.`,
                    occurredAt: (item.dueAt || now).toISOString(),
                });
            }

            const gradedBack = normalizedSubmissions
                .filter((item) => item.normalizedScore !== null)
                .slice(0, 2);

            for (const item of gradedBack) {
                notifications.push({
                    id: `graded-${item._id}`,
                    type: "success",
                    title: `Bài ${item.assignmentTitle} đã có điểm`,
                    description: `Bạn nhận được ${round2(item.normalizedScore || 0)}/10 cho bài nộp gần đây.`,
                    occurredAt: (item.submittedAt || now).toISOString(),
                });
            }
        } else {
            for (const assignment of normalizedAssignments) {
                const expected = classroomStudentCounts[assignment.classroomId] || 0;
                if (!expected) continue;

                let submittedCount = 0;
                for (const studentRawId of uniqueStudents) {
                    if (submissionKeySet.has(`${assignment._id}:${studentRawId}`)) {
                        submittedCount += 1;
                    }
                }

                const missingCount = Math.max(expected - submittedCount, 0);
                if (!missingCount || !assignment.dueAt) continue;

                if (assignment.dueAt.getTime() < now.getTime()) {
                    notifications.push({
                        id: `overdue-${assignment._id}`,
                        type: "warning",
                        title: `Đã quá hạn ${assignment.title}`,
                        description: `${assignment.classroomCode || assignment.classroomName} còn ${missingCount} học sinh chưa nộp bài.`,
                        occurredAt: assignment.dueAt.toISOString(),
                    });
                    continue;
                }

                if (assignment.dueAt.getTime() <= addDays(now, 2).getTime()) {
                    notifications.push({
                        id: `soon-${assignment._id}`,
                        type: "info",
                        title: `Sắp đến hạn ${assignment.title}`,
                        description: `${assignment.classroomCode || assignment.classroomName} còn ${missingCount} học sinh chưa nộp.`,
                        occurredAt: assignment.dueAt.toISOString(),
                    });
                }
            }

            const needReviewCount = normalizedSubmissions.filter((item) =>
                ["pending", "needs_teacher_review"].includes(item.gradeStatus)
            ).length;

            if (needReviewCount > 0) {
                notifications.push({
                    id: "review-needed",
                    type: "warning",
                    title: "Có bài nộp cần xử lý",
                    description: `${needReviewCount} bài đang ở trạng thái chờ chấm hoặc cần giáo viên xem lại.`,
                    occurredAt: now.toISOString(),
                });
            }

            const newAssignments = normalizedAssignments.filter((item) =>
                isBetween(item.createdAt, currentStart, currentEnd)
            ).length;

            if (newAssignments > 0) {
                notifications.push({
                    id: "new-assignments",
                    type: "success",
                    title: "Bài tập mới đã được tạo",
                    description: `${newAssignments} bài tập mới được tạo trong ${rangeDays} ngày qua.`,
                    occurredAt: now.toISOString(),
                });
            }
        }

        const dedupedNotifications = uniqueById(notifications, (item) => item.id)
            .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
            .slice(0, 5);

        const recentActivities = normalizedSubmissions.slice(0, 8).map((item) => ({
            submissionId: item._id,
            studentName: item.studentName,
            className: item.classroomCode || item.classroomName || "Lớp học",
            assignmentTitle: item.assignmentTitle,
            score: item.normalizedScore === null ? null : round2(item.normalizedScore),
            scoreClassName: scoreBadgeClass(item.normalizedScore),
            status: item.gradeStatus,
            submittedAt: item.submittedAt?.toISOString() || null,
            actionHref:
                currentUser?.role === "student"
                    ? "/ui/my_results"
                    : `/ui/grading_detail?submissionId=${item._id}`,
        }));

        return {
            generatedAt: new Date().toISOString(),
            rangeDays,
            user: {
                role: currentUser?.role,
                name: userName,
                greeting: `${getGreeting()}, ${userName}!`,
            },
            summary: {
                totalClasses: normalizedClasses.length,
                totalAssignments: normalizedAssignments.length,
                totalStudents: currentUser?.role === "student" ? 1 : uniqueStudents.size,
                totalSubmissions: normalizedSubmissions.length,
            },
            stats: {
                totalSubmissions: {
                    current: currentSubmissions.length,
                    previous: previousSubmissions.length,
                    trend: buildTrend(currentSubmissions.length, previousSubmissions.length, 0),
                    subtitle: `Trong ${rangeDays} ngày qua`,
                },
                completionRate: {
                    current: currentCompletionRate,
                    previous: previousCompletionRate,
                    trend: buildTrend(currentCompletionRate, previousCompletionRate, 1),
                    subtitle: "Tỷ lệ bài đã được chấm",
                },
                averageScore: {
                    current: currentAverageScore,
                    previous: previousAverageScore,
                    trend: buildTrend(currentAverageScore, previousAverageScore, 2),
                    subtitle: "Điểm trung bình bài đã chấm",
                },
                needsAttention: {
                    current: currentNeedsAttention,
                    previous: previousNeedsAttention,
                    trend: buildTrend(currentNeedsAttention, previousNeedsAttention, 0),
                    subtitle:
                        currentUser?.role === "student"
                            ? "Bài đang chờ chấm"
                            : "Bài cần chấm hoặc xem lại",
                },
            },
            charts: {
                submissionsByDay: dayBuckets,
                averageScoreByClass,
            },
            notifications: dedupedNotifications,
            recentActivities,
        };
    },
};
