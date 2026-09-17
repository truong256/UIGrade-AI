// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { emailService } from "@/services/email.service";
import { systemConfigService } from "@/services/system-config.service";
import type { Json } from "@/types/database.types";

type StudentRecipient = { id: string; name: string; email: string };
type AssignmentRow = {
    id: string;
    class_id: string;
    lecturer_id: string;
    title: string;
    description: string | null;
    due_at: string;
    status: string;
    is_active: boolean;
};

const WINDOW_MINUTES = 30;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000";

function escapeHtml(value: string) {
    return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
}

function formatDateTime(value: unknown) {
    const date = new Date(String(value || ""));
    if (Number.isNaN(date.getTime())) return "--";
    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(date);
}

function excerpt(value: string, maxLength = 220) {
    const clean = value.trim();
    if (!clean) return "";
    return clean.length <= maxLength ? clean : `${clean.slice(0, maxLength).trim()}...`;
}

function buildSubmitUrl() {
    return `${APP_URL}/ui/submit_assignment`;
}

function buildLogKey(type: "new_assignment" | "deadline_before" | "deadline_due", assignmentId: string, studentId: string, extra?: string) {
    return [type, assignmentId, studentId, extra].filter(Boolean).join(":");
}

async function hasSent(uniqueKey: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("email_notification_logs")
        .select("id")
        .eq("unique_key", uniqueKey)
        .maybeSingle();
    if (error) throw new Error(`Không thể kiểm tra lịch sử email: ${error.message}`);
    return Boolean(data);
}

async function markSent(params: {
    uniqueKey: string;
    type: "new_assignment" | "deadline_before" | "deadline_due";
    assignmentId: string;
    studentId: string;
    email: string;
    meta?: Json;
}) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("email_notification_logs").insert({
        unique_key: params.uniqueKey,
        type: params.type,
        assignment_id: params.assignmentId,
        student_id: params.studentId,
        email: params.email,
        meta: params.meta || {},
    });
    if (error && error.code !== "23505") {
        throw new Error(`Không thể lưu lịch sử email: ${error.message}`);
    }
}

async function getAssignment(assignmentId: string): Promise<AssignmentRow | null> {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("assignments")
        .select("id,class_id,lecturer_id,title,description,due_at,status,is_active")
        .eq("id", assignmentId)
        .maybeSingle();
    if (error) throw new Error(`Không thể đọc bài tập: ${error.message}`);
    return data as AssignmentRow | null;
}

async function getClassName(classId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("classes").select("name").eq("id", classId).maybeSingle();
    if (error) throw new Error(`Không thể đọc lớp học: ${error.message}`);
    return data?.name || "Lớp học";
}

async function getLecturerName(lecturerId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("profiles").select("full_name").eq("id", lecturerId).maybeSingle();
    if (error) throw new Error(`Không thể đọc hồ sơ giảng viên: ${error.message}`);
    return data?.full_name || "Giảng viên";
}

async function getEligibleStudents(classId: string): Promise<StudentRecipient[]> {
    const supabase = await createSupabaseServerClient();
    const { data: memberData, error: memberError } = await supabase
        .from("class_members")
        .select("student_id")
        .eq("class_id", classId)
        .eq("status", "active");
    if (memberError) throw new Error(`Không thể đọc thành viên lớp: ${memberError.message}`);
    const ids = [...new Set((memberData || []).map((item) => item.student_id))];
    if (!ids.length) return [];

    const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id,full_name,email,status,role")
        .in("id", ids)
        .eq("status", "active")
        .eq("role", "student");
    if (profileError) throw new Error(`Không thể đọc hồ sơ sinh viên: ${profileError.message}`);
    return (profiles || [])
        .filter((profile) => Boolean(profile.email))
        .map((profile) => ({
            id: profile.id,
            name: profile.full_name || "Sinh viên",
            email: String(profile.email).trim().toLowerCase(),
        }));
}

async function getSubmittedStudentIds(assignmentId: string) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
        .from("submissions")
        .select("student_id")
        .eq("assignment_id", assignmentId)
        .eq("is_current", true)
        .neq("status", "draft");
    if (error) throw new Error(`Không thể đọc bài nộp: ${error.message}`);
    return new Set((data || []).map((item) => item.student_id));
}

function buildNewAssignmentHtml(params: {
    studentName: string; assignmentTitle: string; classroomName: string; teacherName: string; dueAt: unknown; description: string;
}) {
    const description = excerpt(params.description);
    return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:680px;margin:0 auto;padding:24px"><div style="border:1px solid #e2e8f0;border-radius:18px;padding:24px;background:#fff"><h2>Bài tập mới</h2><p>Xin chào <strong>${escapeHtml(params.studentName)}</strong>,</p><p>Bạn có bài tập <strong>${escapeHtml(params.assignmentTitle)}</strong> trong lớp <strong>${escapeHtml(params.classroomName)}</strong>.</p><p><strong>Giảng viên:</strong> ${escapeHtml(params.teacherName)}<br/><strong>Hạn nộp:</strong> ${escapeHtml(formatDateTime(params.dueAt))}</p>${description ? `<p>${escapeHtml(description)}</p>` : ""}<a href="${buildSubmitUrl()}">Mở trang nộp bài</a></div></div>`;
}

function buildReminderHtml(params: { studentName: string; assignmentTitle: string; classroomName: string; dueAt: unknown; reminderLabel: string }) {
    return `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:680px;margin:0 auto;padding:24px"><div style="border:1px solid #e2e8f0;border-radius:18px;padding:24px;background:#fff"><h2>${escapeHtml(params.reminderLabel)}</h2><p>Xin chào <strong>${escapeHtml(params.studentName)}</strong>,</p><p>Bạn chưa nộp <strong>${escapeHtml(params.assignmentTitle)}</strong> của lớp <strong>${escapeHtml(params.classroomName)}</strong>.</p><p><strong>Hạn nộp:</strong> ${escapeHtml(formatDateTime(params.dueAt))}</p><a href="${buildSubmitUrl()}">Nộp bài ngay</a></div></div>`;
}

export const assignmentNotificationService = {
    async sendNewAssignmentEmails(assignmentId: string) {
        const config = await systemConfigService.getInternalConfig();
        if (!config.email.enabled || !config.email.notifyOnNewAssignment) return { enabled: false, sent: 0, skipped: 0 };
        const assignment = await getAssignment(assignmentId);
        if (!assignment || assignment.status !== "published" || !assignment.is_active) return { enabled: true, sent: 0, skipped: 0 };

        const [classroomName, teacherName, students] = await Promise.all([
            getClassName(assignment.class_id),
            getLecturerName(assignment.lecturer_id),
            getEligibleStudents(assignment.class_id),
        ]);
        let sent = 0;
        let skipped = 0;
        for (const student of students) {
            const uniqueKey = buildLogKey("new_assignment", assignment.id, student.id);
            if (await hasSent(uniqueKey)) { skipped += 1; continue; }
            await emailService.sendMail({
                to: student.email,
                subject: `[UIGrade] Bài tập mới: ${assignment.title}`,
                text: `Bạn có bài tập mới: ${assignment.title}. Lớp: ${classroomName}. Hạn nộp: ${formatDateTime(assignment.due_at)}.`,
                html: buildNewAssignmentHtml({
                    studentName: student.name,
                    assignmentTitle: assignment.title,
                    classroomName,
                    teacherName,
                    dueAt: assignment.due_at,
                    description: assignment.description || "",
                }),
            });
            await markSent({ uniqueKey, type: "new_assignment", assignmentId: assignment.id, studentId: student.id, email: student.email });
            sent += 1;
        }
        return { enabled: true, sent, skipped };
    },

    async runDeadlineReminderJob() {
        const config = await systemConfigService.getInternalConfig();
        if (!config.email.enabled) return { enabled: false, checkedAssignments: 0, sent: 0, skipped: 0, failed: 0 };

        const reminderHours = config.email.notifyBeforeDue ? config.email.reminderBeforeHours : [];
        const now = Date.now();
        const maxHours = reminderHours.length ? Math.max(...reminderHours) : 0;
        const windowMs = WINDOW_MINUTES * 60 * 1000;
        const searchStart = new Date(now - windowMs).toISOString();
        const searchEnd = new Date(now + maxHours * 60 * 60 * 1000 + windowMs).toISOString();
        const supabase = await createSupabaseServerClient();
        const { data, error } = await supabase
            .from("assignments")
            .select("id,class_id,lecturer_id,title,description,due_at,status,is_active")
            .eq("status", "published")
            .eq("is_active", true)
            .gte("due_at", searchStart)
            .lte("due_at", searchEnd);
        if (error) throw new Error(`Không thể đọc bài tập sắp đến hạn: ${error.message}`);
        const assignments = (data || []) as AssignmentRow[];

        let sent = 0;
        let skipped = 0;
        let failed = 0;
        for (const assignment of assignments) {
            const dueAt = new Date(assignment.due_at);
            if (Number.isNaN(dueAt.getTime())) { skipped += 1; continue; }
            const msLeft = dueAt.getTime() - now;
            const labels: Array<{ type: "deadline_before" | "deadline_due"; key: string; label: string }> = [];
            if (config.email.notifyBeforeDue) {
                for (const hour of reminderHours) {
                    const targetMs = hour * 60 * 60 * 1000;
                    if (msLeft <= targetMs && msLeft > targetMs - windowMs) {
                        labels.push({ type: "deadline_before", key: `before_${hour}h`, label: `Bài tập sẽ đến hạn sau khoảng ${hour} giờ` });
                    }
                }
            }
            if (config.email.notifyAtDue && msLeft <= 0 && msLeft >= -windowMs) {
                labels.push({ type: "deadline_due", key: "due_now", label: "Bài tập đã đến hạn nộp" });
            }
            if (!labels.length) { skipped += 1; continue; }

            const [classroomName, students, submittedStudentIds] = await Promise.all([
                getClassName(assignment.class_id),
                getEligibleStudents(assignment.class_id),
                getSubmittedStudentIds(assignment.id),
            ]);
            for (const student of students) {
                if (submittedStudentIds.has(student.id)) { skipped += labels.length; continue; }
                for (const label of labels) {
                    const uniqueKey = buildLogKey(label.type, assignment.id, student.id, label.key);
                    if (await hasSent(uniqueKey)) { skipped += 1; continue; }
                    try {
                        await emailService.sendMail({
                            to: student.email,
                            subject: label.type === "deadline_due" ? `[UIGrade] Đến hạn nộp: ${assignment.title}` : `[UIGrade] Sắp hết hạn: ${assignment.title}`,
                            text: `${label.label}. Bài tập: ${assignment.title}. Hạn nộp: ${formatDateTime(assignment.due_at)}.`,
                            html: buildReminderHtml({ studentName: student.name, assignmentTitle: assignment.title, classroomName, dueAt: assignment.due_at, reminderLabel: label.label }),
                        });
                        await markSent({ uniqueKey, type: label.type, assignmentId: assignment.id, studentId: student.id, email: student.email, meta: { rule: label.key } });
                        sent += 1;
                    } catch {
                        failed += 1;
                    }
                }
            }
        }
        return { enabled: true, checkedAssignments: assignments.length, sent, skipped, failed };
    },
};
