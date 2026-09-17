// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import type { CurrentUserPayload } from "@/lib/current-user";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ReportFilters = { classroomId?: string; assignmentId?: string };
type ClassroomRow = { id: string; name: string; class_code: string | null };
type AssignmentRow = { id: string; title: string; class_id: string; due_at: string | null; max_score: number };
type MemberRow = { class_id: string; student_id: string };
type ProfileRow = { id: string; full_name: string | null; student_code: string | null };
type SubmissionRow = { id: string; assignment_id: string; student_id: string; submitted_at: string | null; is_late: boolean | null };
type GradeRow = { submission_id: string; score: number; max_score: number; status: string };

const round2 = (value: number) => Math.round(value * 100) / 100;

function buildInitials(name: string) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "--";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] || ""}${parts.at(-1)?.[0] || ""}`.toUpperCase();
}

function parseGradeLabel(classroom: { name?: string; code?: string }) {
    const source = `${classroom.name || ""} ${classroom.code || ""}`.trim();
    const match = source.match(/(?:^|\b)(10|11|12)(?:[A-Z]|\b)/i);
    return match?.[1] ? `Khối ${match[1]}` : classroom.name || classroom.code || "Khác";
}

function ensureCanViewReport(currentUser: CurrentUserPayload | null): asserts currentUser is CurrentUserPayload {
    if (!currentUser?.userId) throw new Error("Bạn chưa đăng nhập");
    if (!["admin", "lecturer"].includes(currentUser.role)) {
        throw new Error("Chức năng báo cáo chỉ dành cho giáo viên hoặc quản trị viên");
    }
}

function emptyReport(
    classrooms: Array<{ _id: string; name: string; code: string }>,
    filters: ReportFilters,
    assignments: Array<{ _id: string; title: string; classroomId: string }> = []
) {
    return {
        generatedAt: new Date().toISOString(),
        filters: {
            classrooms,
            assignments,
            selectedClassroomId: filters.classroomId || "all",
            selectedAssignmentId: filters.assignmentId || "all",
        },
        stats: {
            averageScore: 0, gradedCount: 0, onTimeRate: 0, onTimeSubmitted: 0,
            expectedSubmissions: 0, totalStudents: 0, totalClasses: classrooms.length,
            warningCount: 0, totalAssignments: assignments.length, totalSubmissions: 0,
        },
        scoreDistribution: [
            { label: "0-3", count: 0, percent: 0 }, { label: "3-5", count: 0, percent: 0 },
            { label: "5-7", count: 0, percent: 0 }, { label: "7-9", count: 0, percent: 0 },
            { label: "9-10", count: 0, percent: 0 },
        ],
        completionByGroup: [] as Array<{ label: string; value: number; submitted: number; expected: number }>,
        highlightStudents: [] as Array<Record<string, unknown>>,
        warningStudents: [] as Array<Record<string, unknown>>,
    };
}

function requireNoError(error: { message: string } | null, label: string) {
    if (error) throw new Error(`${label}: ${error.message}`);
}

export const learningReportService = {
    async getOverview(currentUser: CurrentUserPayload | null, filters: ReportFilters) {
        ensureCanViewReport(currentUser);
        const supabase = await createSupabaseServerClient();

        let classesQuery = supabase.from("classes").select("id,name,class_code").eq("status", "active").order("name");
        if (currentUser.role === "lecturer") classesQuery = classesQuery.eq("lecturer_id", currentUser.userId);
        if (filters.classroomId) classesQuery = classesQuery.eq("id", filters.classroomId);
        const { data: classData, error: classError } = await classesQuery;
        requireNoError(classError, "Không thể tải lớp học");
        const classes = (classData || []) as ClassroomRow[];
        const classroomOptions = classes.map((item) => ({ _id: item.id, name: item.name, code: item.class_code || "" }));
        const classIds = classes.map((item) => item.id);
        if (!classIds.length) return emptyReport(classroomOptions, filters);

        let assignmentQuery = supabase
            .from("assignments")
            .select("id,title,class_id,due_at,max_score")
            .in("class_id", classIds)
            .eq("status", "published")
            .eq("is_active", true)
            .order("due_at", { ascending: false });
        if (filters.assignmentId) assignmentQuery = assignmentQuery.eq("id", filters.assignmentId);
        const { data: assignmentData, error: assignmentError } = await assignmentQuery;
        requireNoError(assignmentError, "Không thể tải bài tập");
        const assignments = (assignmentData || []) as AssignmentRow[];
        const assignmentOptions = assignments.map((item) => ({ _id: item.id, title: item.title, classroomId: item.class_id }));

        const { data: memberData, error: memberError } = await supabase
            .from("class_members").select("class_id,student_id").in("class_id", classIds).eq("status", "active");
        requireNoError(memberError, "Không thể tải thành viên lớp");
        const members = (memberData || []) as MemberRow[];
        const studentIds = [...new Set(members.map((item) => item.student_id))];

        let profiles: ProfileRow[] = [];
        if (studentIds.length) {
            const { data, error } = await supabase.from("profiles").select("id,full_name,student_code").in("id", studentIds);
            requireNoError(error, "Không thể tải hồ sơ học sinh");
            profiles = (data || []) as ProfileRow[];
        }
        const profileById = new Map(profiles.map((item) => [item.id, item]));
        const classById = new Map(classes.map((item) => [item.id, item]));
        const assignmentById = new Map(assignments.map((item) => [item.id, item]));
        const classStudentCount = new Map<string, number>();
        for (const member of members) classStudentCount.set(member.class_id, (classStudentCount.get(member.class_id) || 0) + 1);

        if (!assignments.length) {
            const report = emptyReport(classroomOptions, filters, assignmentOptions);
            report.stats.totalStudents = studentIds.length;
            return report;
        }

        const assignmentIds = assignments.map((item) => item.id);
        const { data: submissionData, error: submissionError } = await supabase
            .from("submissions")
            .select("id,assignment_id,student_id,submitted_at,is_late")
            .in("assignment_id", assignmentIds)
            .eq("is_current", true)
            .neq("status", "draft");
        requireNoError(submissionError, "Không thể tải bài nộp");
        const submissions = (submissionData || []) as SubmissionRow[];

        let grades: GradeRow[] = [];
        const submissionIds = submissions.map((item) => item.id);
        if (submissionIds.length) {
            const { data, error } = await supabase
                .from("grades").select("submission_id,score,max_score,status")
                .in("submission_id", submissionIds).eq("status", "published");
            requireNoError(error, "Không thể tải điểm");
            grades = (data || []) as GradeRow[];
        }
        const gradeBySubmission = new Map(grades.map((item) => [item.submission_id, item]));
        const normalized = submissions.map((submission) => {
            const assignment = assignmentById.get(submission.assignment_id);
            const grade = gradeBySubmission.get(submission.id);
            const maxScore = Number(grade?.max_score || assignment?.max_score || 10) || 10;
            const normalizedScore = grade ? round2((Number(grade.score) / maxScore) * 10) : null;
            const dueAt = assignment?.due_at ? new Date(assignment.due_at) : null;
            const submittedAt = submission.submitted_at ? new Date(submission.submitted_at) : null;
            const onTime = Boolean(submittedAt && !submission.is_late && (!dueAt || submittedAt.getTime() <= dueAt.getTime()));
            return { ...submission, assignment, normalizedScore, onTime };
        });

        const graded = normalized.filter((item) => item.normalizedScore !== null);
        const averageScore = graded.length ? round2(graded.reduce((sum, item) => sum + Number(item.normalizedScore), 0) / graded.length) : 0;
        const onTimeSubmitted = normalized.filter((item) => item.onTime).length;
        const expectedSubmissions = assignments.reduce((sum, item) => sum + (classStudentCount.get(item.class_id) || 0), 0);
        const onTimeRate = expectedSubmissions ? round2((onTimeSubmitted / expectedSubmissions) * 100) : 0;
        const bucketDefs = [
            { label: "0-3", min: 0, max: 3 }, { label: "3-5", min: 3, max: 5 },
            { label: "5-7", min: 5, max: 7 }, { label: "7-9", min: 7, max: 9 },
            { label: "9-10", min: 9, max: 10.0001 },
        ];
        const scoreDistribution = bucketDefs.map((bucket) => {
            const count = graded.filter((item) => Number(item.normalizedScore) >= bucket.min && Number(item.normalizedScore) < bucket.max).length;
            return { label: bucket.label, count, percent: graded.length ? round2((count / graded.length) * 100) : 0 };
        });

        const completionByGroup = classes.map((classroom) => {
            const classAssignments = assignments.filter((item) => item.class_id === classroom.id);
            const expected = classAssignments.length * (classStudentCount.get(classroom.id) || 0);
            const submitted = normalized.filter((item) => item.assignment?.class_id === classroom.id && item.onTime).length;
            return {
                label: parseGradeLabel({ name: classroom.name, code: classroom.class_code || "" }),
                value: expected ? round2((submitted / expected) * 100) : 0,
                submitted,
                expected,
            };
        });

        const classIdsByStudent = new Map<string, Set<string>>();
        for (const member of members) {
            if (!classIdsByStudent.has(member.student_id)) classIdsByStudent.set(member.student_id, new Set());
            classIdsByStudent.get(member.student_id)?.add(member.class_id);
        }
        const studentScores = new Map<string, number[]>();
        for (const item of graded) {
            if (!studentScores.has(item.student_id)) studentScores.set(item.student_id, []);
            studentScores.get(item.student_id)?.push(Number(item.normalizedScore));
        }
        const studentRows = studentIds.map((studentId) => {
            const profile = profileById.get(studentId);
            const scores = studentScores.get(studentId) || [];
            const score = scores.length ? round2(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
            const studentClassIds = [...(classIdsByStudent.get(studentId) || [])];
            const className = studentClassIds.map((id) => classById.get(id)?.name).filter(Boolean).join(", ") || "--";
            const name = profile?.full_name || "Học sinh";
            const assignedCount = assignments.filter((a) => studentClassIds.includes(a.class_id)).length;
            const submittedCount = normalized.filter((s) => s.student_id === studentId).length;
            return { studentId, initials: buildInitials(name), name, className, score, submittedCount, assignedCount };
        });
        const highlightStudents = studentRows
            .filter((item) => item.score >= 8 && item.submittedCount > 0)
            .sort((a, b) => b.score - a.score).slice(0, 5)
            .map((item) => ({ ...item, badge: "Tốt", note: "Điểm trung bình cao và có bài nộp được ghi nhận." }));
        const warningStudents = studentRows
            .filter((item) => item.score < 5 || item.submittedCount < item.assignedCount)
            .sort((a, b) => a.score - b.score).slice(0, 8)
            .map((item) => ({
                studentId: item.studentId, initials: item.initials, name: item.name, className: item.className,
                score: item.score, level: item.score < 3 ? "Cao" : "Trung bình",
                note: item.submittedCount < item.assignedCount ? `Đã nộp ${item.submittedCount}/${item.assignedCount} bài.` : "Điểm trung bình đang dưới ngưỡng cần cải thiện.",
            }));

        return {
            generatedAt: new Date().toISOString(),
            filters: { classrooms: classroomOptions, assignments: assignmentOptions, selectedClassroomId: filters.classroomId || "all", selectedAssignmentId: filters.assignmentId || "all" },
            stats: {
                averageScore, gradedCount: graded.length, onTimeRate, onTimeSubmitted, expectedSubmissions,
                totalStudents: studentIds.length, totalClasses: classes.length, warningCount: warningStudents.length,
                totalAssignments: assignments.length, totalSubmissions: submissions.length,
            },
            scoreDistribution, completionByGroup, highlightStudents, warningStudents,
        };
    },
};
