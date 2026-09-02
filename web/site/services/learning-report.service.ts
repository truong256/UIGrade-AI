import { assignmentRepository } from "@/repositories/assignment.repository";
import { classroomRepository } from "@/repositories/classroom.repository";
import * as classroomMemberRepo from "@/repositories/classroom-member.repository";
import { ClassroomMemberModel } from "@/models/Classroom-member.model";
import Submission from "@/models/Submission.model";
import type { CurrentUserPayload } from "@/lib/current-user";

type UnknownRecord = Record<string, unknown>;

type ReportFilters = {
    classroomId?: string;
    assignmentId?: string;
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
    if (typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
        return String(value);
    }

    if (typeof value === "object" && value !== null) {
        const maybeObject = value as { _id?: unknown; toString?: () => string };

        if ("_id" in maybeObject && maybeObject._id && maybeObject._id !== value) {
            return toStringId(maybeObject._id);
        }

        if (typeof maybeObject.toString === "function") {
            const text = maybeObject.toString();
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

function round2(value: number) {
    return Math.round(value * 100) / 100;
}

function safeDate(value: unknown): Date | null {
    if (!value) return null;
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? null : date;
}

function buildInitials(name: string) {
    const parts = name
        .trim()
        .split(/\s+/)
        .filter(Boolean);

    if (!parts.length) return "--";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
}

function parseGradeLabel(classroom: { name?: string; code?: string }) {
    const source = `${classroom.name || ""} ${classroom.code || ""}`.trim();
    const match = source.match(/(?:^|\b)(10|11|12)(?:[A-Z]|\b)/i);

    if (match?.[1]) {
        return `Khối ${match[1]}`;
    }

    return classroom.name || classroom.code || "Khác";
}

function ensureCanViewReport(currentUser: CurrentUserPayload | null) {
    if (!currentUser?.userId) {
        throw new Error("Bạn chưa đăng nhập");
    }

    if (!["admin", "teacher"].includes(currentUser.role)) {
        throw new Error("Chức năng báo cáo chỉ dành cho giáo viên hoặc quản trị viên");
    }
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

export const learningReportService = {
    async getOverview(currentUser: CurrentUserPayload | null, filters: ReportFilters) {
        ensureCanViewReport(currentUser);

        const allAccessibleClasses = await getAccessibleClassrooms(currentUser as CurrentUserPayload);
        const normalizedAllClasses = allAccessibleClasses
            .map((raw) => {
                const item = toObject(raw);
                return {
                    _id: toStringId(item._id),
                    name: toText(item.name, "Lớp học"),
                    code: toText(item.code),
                };
            })
            .filter((item) => item._id);

        const selectedClassIds = filters.classroomId
            ? normalizedAllClasses
                .filter((item) => item._id === filters.classroomId)
                .map((item) => item._id)
            : normalizedAllClasses.map((item) => item._id);

        if (!selectedClassIds.length) {
            return {
                generatedAt: new Date().toISOString(),
                filters: {
                    classrooms: normalizedAllClasses,
                    assignments: [],
                    selectedClassroomId: filters.classroomId || "all",
                    selectedAssignmentId: filters.assignmentId || "all",
                },
                stats: {
                    averageScore: 0,
                    gradedCount: 0,
                    onTimeRate: 0,
                    onTimeSubmitted: 0,
                    expectedSubmissions: 0,
                    totalStudents: 0,
                    totalClasses: 0,
                    warningCount: 0,
                    totalAssignments: 0,
                    totalSubmissions: 0,
                },
                scoreDistribution: [
                    { label: "0-3", count: 0, percent: 0 },
                    { label: "3-5", count: 0, percent: 0 },
                    { label: "5-7", count: 0, percent: 0 },
                    { label: "7-9", count: 0, percent: 0 },
                    { label: "9-10", count: 0, percent: 0 },
                ],
                completionByGroup: [],
                highlightStudents: [],
                warningStudents: [],
            };
        }

        const memberships = await ClassroomMemberModel.find({
            classroomId: { $in: selectedClassIds },
            roleInClass: "student",
            status: "active",
        })
            .populate("userId", "name email studentCode")
            .lean();

        const classroomStudentCounts = memberships.reduce<Record<string, number>>((acc, raw) => {
            const item = toObject(raw);
            const classroomId = toStringId(item.classroomId);
            if (!classroomId) return acc;
            acc[classroomId] = (acc[classroomId] || 0) + 1;
            return acc;
        }, {});

        const uniqueStudents = new Map<
            string,
            {
                studentId: string;
                name: string;
                studentCode: string;
                initials: string;
                classroomIds: Set<string>;
            }
        >();

        for (const raw of memberships) {
            const item = toObject(raw);
            const classroomId = toStringId(item.classroomId);
            const user = toObject(item.userId);
            const studentId = toStringId(user._id);
            if (!studentId) continue;

            const existing = uniqueStudents.get(studentId) || {
                studentId,
                name: toText(user.name, "Học sinh"),
                studentCode: toText(user.studentCode),
                initials: buildInitials(toText(user.name, "HS")),
                classroomIds: new Set<string>(),
            };

            if (classroomId) {
                existing.classroomIds.add(classroomId);
            }

            uniqueStudents.set(studentId, existing);
        }

        const assignmentDocs = await assignmentRepository.findManyByClassroomIds(selectedClassIds, {
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
                    classroomName: toText(classroom.name),
                    classroomCode: toText(classroom.code),
                    dueAt: safeDate(item.dueAt),
                    maxScore: Math.max(0.0001, toNumberValue(item.maxScore, 10)),
                };
            })
            .filter((item) => item._id);

        const visibleAssignments = filters.assignmentId
            ? normalizedAssignments.filter((item) => item._id === filters.assignmentId)
            : normalizedAssignments;

        const assignmentIds = visibleAssignments.map((item) => item._id);
        const now = new Date();

        const submissionFilter: Record<string, unknown> = {
            classroomId: { $in: selectedClassIds },
            latest: true,
        };

        if (assignmentIds.length) {
            submissionFilter.assignmentId = { $in: assignmentIds };
        }

        const submissionDocs = assignmentIds.length
            ? await Submission.find(submissionFilter)
                .populate("studentId", "name email studentCode")
                .populate("assignmentId", "title maxScore dueAt classroomId")
                .sort({ submittedAt: -1 })
                .lean()
            : [];

        const normalizedSubmissions = (submissionDocs as unknown[]).map((raw) => {
            const item = toObject(raw);
            const student = toObject(item.studentId);
            const assignmentRaw = toObject(item.assignmentId);
            const assignmentId = toStringId(assignmentRaw._id || item.assignmentId);
            const assignment =
                visibleAssignments.find((entry) => entry._id === assignmentId) || {
                    _id: assignmentId,
                    title: toText(assignmentRaw.title, "Bài tập"),
                    classroomId: toStringId(assignmentRaw.classroomId || item.classroomId),
                    classroomName: "",
                    classroomCode: "",
                    dueAt: safeDate(assignmentRaw.dueAt),
                    maxScore: Math.max(0.0001, toNumberValue(assignmentRaw.maxScore, 10)),
                };

            const rawScore = item.finalScore ?? toObject(item.autoGrade).score ?? null;
            const finalScore = rawScore === null || rawScore === undefined ? null : toNumberValue(rawScore, 0);
            const normalizedScore =
                finalScore === null ? null : round2((finalScore / assignment.maxScore) * 10);

            return {
                _id: toStringId(item._id),
                assignmentId,
                classroomId: assignment.classroomId,
                studentId: toStringId(student._id || item.studentId),
                studentName: toText(student.name, "Học sinh"),
                studentCode: toText(student.studentCode),
                submittedAt: safeDate(item.submittedAt),
                dueAt: assignment.dueAt,
                isLate: Boolean(item.isLate),
                status: toText(item.status, "submitted"),
                gradeStatus: toText(item.gradeStatus, "pending"),
                finalScore,
                normalizedScore,
            };
        });

        const gradedSubmissions = normalizedSubmissions.filter(
            (item) => item.normalizedScore !== null
        );

        const averageScore = gradedSubmissions.length
            ? round2(
                gradedSubmissions.reduce(
                    (sum, item) => sum + Number(item.normalizedScore || 0),
                    0
                ) / gradedSubmissions.length
            )
            : 0;

        const onTimeSubmitted = normalizedSubmissions.filter((item) => {
            if (!item.submittedAt) return false;
            if (!item.dueAt) return !item.isLate;
            return !item.isLate && item.submittedAt.getTime() <= item.dueAt.getTime();
        }).length;

        const expectedSubmissions = visibleAssignments.reduce((sum, item) => {
            return sum + (classroomStudentCounts[item.classroomId] || 0);
        }, 0);

        const onTimeRate = expectedSubmissions
            ? round2((onTimeSubmitted / expectedSubmissions) * 100)
            : 0;

        const bucketDefs = [
            { label: "0-3", min: 0, max: 3 },
            { label: "3-5", min: 3, max: 5 },
            { label: "5-7", min: 5, max: 7 },
            { label: "7-9", min: 7, max: 9 },
            { label: "9-10", min: 9, max: 10.0001 },
        ];

        const scoreDistribution = bucketDefs.map((bucket) => {
            const count = gradedSubmissions.filter((item) => {
                const score = Number(item.normalizedScore || 0);
                return score >= bucket.min && score < bucket.max;
            }).length;

            return {
                label: bucket.label,
                count,
                percent: gradedSubmissions.length
                    ? round2((count / gradedSubmissions.length) * 100)
                    : 0,
            };
        });

        const groupMap = new Map<
            string,
            {
                label: string;
                expected: number;
                onTime: number;
            }
        >();

        for (const assignment of visibleAssignments) {
            const groupLabel = parseGradeLabel({
                name: assignment.classroomName,
                code: assignment.classroomCode,
            });

            const existing = groupMap.get(groupLabel) || {
                label: groupLabel,
                expected: 0,
                onTime: 0,
            };

            existing.expected += classroomStudentCounts[assignment.classroomId] || 0;
            existing.onTime += normalizedSubmissions.filter((item) => {
                if (item.assignmentId !== assignment._id) return false;
                if (!item.submittedAt) return false;
                if (!assignment.dueAt) return !item.isLate;
                return !item.isLate && item.submittedAt.getTime() <= assignment.dueAt.getTime();
            }).length;

            groupMap.set(groupLabel, existing);
        }

        const completionByGroup = Array.from(groupMap.values())
            .map((item) => ({
                label: item.label,
                value: item.expected ? round2((item.onTime / item.expected) * 100) : 0,
                submitted: item.onTime,
                expected: item.expected,
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 6);

        const submissionsByStudent = normalizedSubmissions.reduce<Record<string, typeof normalizedSubmissions>>((acc, item) => {
            if (!item.studentId) return acc;
            if (!acc[item.studentId]) {
                acc[item.studentId] = [];
            }
            acc[item.studentId].push(item);
            return acc;
        }, {});

        const assignmentsByClassroom = visibleAssignments.reduce<Record<string, typeof visibleAssignments>>((acc, item) => {
            if (!acc[item.classroomId]) {
                acc[item.classroomId] = [];
            }
            acc[item.classroomId].push(item);
            return acc;
        }, {});

        const studentRows = Array.from(uniqueStudents.values()).map((student) => {
            const studentSubmissions = submissionsByStudent[student.studentId] || [];
            const allAssignmentsForStudent = Array.from(student.classroomIds).flatMap(
                (classroomId) => assignmentsByClassroom[classroomId] || []
            );

            const scoreList = studentSubmissions
                .map((item) => item.normalizedScore)
                .filter((item): item is number => item !== null);

            const average = scoreList.length
                ? round2(scoreList.reduce((sum, value) => sum + value, 0) / scoreList.length)
                : 0;

            const overdueMissing = allAssignmentsForStudent.filter((assignment) => {
                if (!assignment.dueAt || assignment.dueAt.getTime() > now.getTime()) {
                    return false;
                }

                return !studentSubmissions.some((item) => item.assignmentId === assignment._id);
            }).length;

            const lateSubmitted = studentSubmissions.filter((item) => {
                if (!item.submittedAt || !item.dueAt) {
                    return Boolean(item.isLate);
                }
                return item.isLate || item.submittedAt.getTime() > item.dueAt.getTime();
            }).length;

            const classroomNames = Array.from(student.classroomIds)
                .map((classroomId) => normalizedAllClasses.find((entry) => entry._id === classroomId))
                .filter(Boolean)
                .map((entry) => entry?.name || entry?.code || "Lớp")
                .slice(0, 2)
                .join(", ");

            return {
                studentId: student.studentId,
                initials: student.initials,
                name: student.name,
                className: classroomNames || "Lớp đang học",
                score: average,
                submissionCount: studentSubmissions.length,
                overdueMissing,
                lateSubmitted,
                badge: average >= 8.5 ? "Xuất sắc" : average >= 7 ? "Tốt" : "Ổn định",
                note:
                    overdueMissing > 0
                        ? `Thiếu ${overdueMissing} bài quá hạn`
                        : lateSubmitted > 0
                            ? `Nộp muộn ${lateSubmitted} bài`
                            : scoreList.length
                                ? `Đã chấm ${scoreList.length} bài`
                                : "Chưa có điểm",
            };
        });

        const highlightStudents = studentRows
            .filter((item) => item.submissionCount > 0 && item.score >= 0)
            .sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                if (a.overdueMissing !== b.overdueMissing) return a.overdueMissing - b.overdueMissing;
                return b.submissionCount - a.submissionCount;
            })
            .slice(0, 5);

        const warningCandidates = studentRows
            .filter((item) => item.score < 5 || item.overdueMissing > 0 || item.lateSubmitted >= 2)
            .sort((a, b) => {
                if (a.score !== b.score) return a.score - b.score;
                if (b.overdueMissing !== a.overdueMissing) return b.overdueMissing - a.overdueMissing;
                return b.lateSubmitted - a.lateSubmitted;
            });

        const warningStudents = warningCandidates.slice(0, 5).map((item) => ({
            ...item,
            level: item.score < 5 ? "Yếu" : item.overdueMissing > 0 ? "Thiếu bài" : "Cần theo dõi",
        }));

        return {
            generatedAt: new Date().toISOString(),
            filters: {
                classrooms: normalizedAllClasses,
                assignments: normalizedAssignments
                    .filter((item) => {
                        if (!filters.classroomId) return true;
                        return item.classroomId === filters.classroomId;
                    })
                    .map((item) => ({
                        _id: item._id,
                        title: item.title,
                        classroomId: item.classroomId,
                    })),
                selectedClassroomId: filters.classroomId || "all",
                selectedAssignmentId: filters.assignmentId || "all",
            },
            stats: {
                averageScore,
                gradedCount: gradedSubmissions.length,
                onTimeRate,
                onTimeSubmitted,
                expectedSubmissions,
                totalStudents: uniqueStudents.size,
                totalClasses: selectedClassIds.length,
                warningCount: warningCandidates.length,
                totalAssignments: visibleAssignments.length,
                totalSubmissions: normalizedSubmissions.length,
            },
            scoreDistribution,
            completionByGroup,
            highlightStudents,
            warningStudents,
        };
    },
};
