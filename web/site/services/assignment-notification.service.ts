import Assignment from "@/models/Assignment.model";
import Submission from "@/models/Submission.model";
import { ClassroomMemberModel } from "@/models/Classroom-member.model";
import EmailNotificationLog from "@/models/EmailNotificationLog.model";
import { emailService } from "@/services/email.service";
import { systemConfigService } from "@/services/system-config.service";

type AnyObject = Record<string, any>;

type StudentRecipient = {
    _id: string;
    name: string;
    email: string;
};

const WINDOW_MINUTES = 30;
const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000";

function asObject(value: unknown): AnyObject {
    return typeof value === "object" && value !== null ? (value as AnyObject) : {};
}

function toText(value: unknown, fallback = "") {
    if (typeof value === "string") return value;
    if (value === null || value === undefined) return fallback;
    return String(value);
}

function escapeHtml(value: string) {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDateTime(value: unknown) {
    const date = new Date(String(value || ""));
    if (Number.isNaN(date.getTime())) return "--";

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function excerpt(value: string, maxLength = 220) {
    const clean = value.trim();
    if (!clean) return "";
    if (clean.length <= maxLength) return clean;
    return `${clean.slice(0, maxLength).trim()}...`;
}

function buildSubmitUrl() {
    return `${APP_URL}/ui/submit_assignment`;
}

function buildLogKey(type: "new_assignment" | "deadline_before" | "deadline_due", assignmentId: string, studentId: string, extra?: string) {
    return [type, assignmentId, studentId, extra].filter(Boolean).join(":");
}

async function hasSent(uniqueKey: string) {
    const existing = await EmailNotificationLog.exists({ uniqueKey });
    return Boolean(existing);
}

async function markSent(params: {
    uniqueKey: string;
    type: "new_assignment" | "deadline_before" | "deadline_due";
    assignmentId: string;
    studentId: string;
    email: string;
    meta?: Record<string, unknown>;
}) {
    try {
        await EmailNotificationLog.create({
            uniqueKey: params.uniqueKey,
            type: params.type,
            assignmentId: params.assignmentId,
            studentId: params.studentId,
            email: params.email,
            meta: params.meta || {},
        });
    } catch (error: any) {
        if (error?.code !== 11000) {
            throw error;
        }
    }
}

async function getAssignmentDetail(assignmentId: string) {
    return Assignment.findById(assignmentId)
        .populate("classroomId", "name code")
        .populate("teacherId", "name email")
        .lean();
}

async function getEligibleStudents(classroomId: string): Promise<StudentRecipient[]> {
    const members = await ClassroomMemberModel.find({
        classroomId,
        status: "active",
        roleInClass: "student",
    })
        .populate({
            path: "userId",
            select: "name email notificationSettings",
        })
        .lean();

    return members
        .map((member) => {
            const user = asObject(member.userId);
            const emailAssignments = user.notificationSettings?.emailAssignments;

            if (!toText(user.email).trim()) {
                return null;
            }

            if (emailAssignments === false) {
                return null;
            }

            return {
                _id: toText(user._id),
                name: toText(user.name, "Sinh viên"),
                email: toText(user.email).trim().toLowerCase(),
            } satisfies StudentRecipient;
        })
        .filter((item): item is StudentRecipient => Boolean(item?._id && item.email));
}

async function getSubmittedStudentIds(assignmentId: string) {
    const ids = await Submission.find({
        assignmentId,
        latest: true,
        status: { $ne: "draft" },
    }).distinct("studentId");

    return new Set(ids.map((item) => String(item)));
}

function buildNewAssignmentHtml(params: {
    studentName: string;
    assignmentTitle: string;
    classroomName: string;
    teacherName: string;
    dueAt: unknown;
    description: string;
}) {
    const dueLabel = formatDateTime(params.dueAt);
    const description = excerpt(params.description);

    return `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:680px;margin:0 auto;padding:24px">
            <div style="border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;background:#ffffff">
                <div style="padding:20px 24px;background:#fff7ed;border-bottom:1px solid #fed7aa">
                    <div style="font-size:12px;font-weight:700;color:#ea580c;text-transform:uppercase;letter-spacing:.08em">AutoGrade</div>
                    <h2 style="margin:8px 0 0;color:#9a3412">Giáo viên vừa tạo bài tập mới</h2>
                </div>
                <div style="padding:24px">
                    <p style="margin-top:0">Xin chào <strong>${escapeHtml(params.studentName)}</strong>,</p>
                    <p>Bạn vừa có bài tập mới trong lớp <strong>${escapeHtml(params.classroomName)}</strong>.</p>
                    <div style="border:1px solid #e2e8f0;border-radius:14px;padding:16px;background:#f8fafc">
                        <p style="margin:0 0 8px"><strong>Bài tập:</strong> ${escapeHtml(params.assignmentTitle)}</p>
                        <p style="margin:0 0 8px"><strong>Giáo viên:</strong> ${escapeHtml(params.teacherName)}</p>
                        <p style="margin:0 0 8px"><strong>Hạn nộp:</strong> ${escapeHtml(dueLabel)}</p>
                        ${description ? `<p style="margin:0"><strong>Mô tả:</strong> ${escapeHtml(description)}</p>` : ""}
                    </div>
                    <div style="margin-top:20px">
                        <a href="${buildSubmitUrl()}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#f97316;color:#fff;text-decoration:none;font-weight:700">Mở trang nộp bài</a>
                    </div>
                    <p style="margin:20px 0 0;color:#475569">Hãy kiểm tra yêu cầu bài tập và nộp trước hạn để tránh bị trễ.</p>
                </div>
            </div>
        </div>
    `;
}

function buildReminderHtml(params: {
    studentName: string;
    assignmentTitle: string;
    classroomName: string;
    dueAt: unknown;
    reminderLabel: string;
}) {
    const dueLabel = formatDateTime(params.dueAt);

    return `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:680px;margin:0 auto;padding:24px">
            <div style="border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;background:#ffffff">
                <div style="padding:20px 24px;background:#fff7ed;border-bottom:1px solid #fed7aa">
                    <div style="font-size:12px;font-weight:700;color:#ea580c;text-transform:uppercase;letter-spacing:.08em">Nhắc hạn nộp bài</div>
                    <h2 style="margin:8px 0 0;color:#9a3412">${escapeHtml(params.reminderLabel)}</h2>
                </div>
                <div style="padding:24px">
                    <p style="margin-top:0">Xin chào <strong>${escapeHtml(params.studentName)}</strong>,</p>
                    <p>Bạn vẫn chưa nộp bài <strong>${escapeHtml(params.assignmentTitle)}</strong> của lớp <strong>${escapeHtml(params.classroomName)}</strong>.</p>
                    <div style="border:1px solid #e2e8f0;border-radius:14px;padding:16px;background:#f8fafc">
                        <p style="margin:0 0 8px"><strong>Hạn nộp:</strong> ${escapeHtml(dueLabel)}</p>
                        <p style="margin:0"><strong>Trạng thái:</strong> Chưa ghi nhận bài nộp hợp lệ</p>
                    </div>
                    <div style="margin-top:20px">
                        <a href="${buildSubmitUrl()}" style="display:inline-block;padding:12px 18px;border-radius:12px;background:#f97316;color:#fff;text-decoration:none;font-weight:700">Nộp bài ngay</a>
                    </div>
                    <p style="margin:20px 0 0;color:#475569">Bạn nên nộp sớm để tránh lỗi mạng hoặc thiếu file ở phút cuối.</p>
                </div>
            </div>
        </div>
    `;
}

export const assignmentNotificationService = {
    async sendNewAssignmentEmails(assignmentId: string) {
        const config = await systemConfigService.getInternalConfig();

        if (!config.email.enabled || !config.email.notifyOnNewAssignment) {
            return {
                enabled: false,
                sent: 0,
                skipped: 0,
            };
        }

        const assignment = asObject(await getAssignmentDetail(assignmentId));
        if (!assignment._id || toText(assignment.status, "published") !== "published") {
            return {
                enabled: true,
                sent: 0,
                skipped: 0,
            };
        }

        const classroom = asObject(assignment.classroomId);
        const teacher = asObject(assignment.teacherId);
        const students = await getEligibleStudents(toText(classroom._id));

        let sent = 0;
        let skipped = 0;

        for (const student of students) {
            const uniqueKey = buildLogKey(
                "new_assignment",
                toText(assignment._id),
                student._id
            );

            if (await hasSent(uniqueKey)) {
                skipped += 1;
                continue;
            }

            await emailService.sendMail({
                to: student.email,
                subject: `[AutoGrade] Bài tập mới: ${toText(assignment.title, "Bài tập mới")}`,
                text: `Ban co bai tap moi: ${toText(assignment.title)}. Lop: ${toText(classroom.name)}. Han nop: ${formatDateTime(assignment.dueAt)}.`,
                html: buildNewAssignmentHtml({
                    studentName: student.name,
                    assignmentTitle: toText(assignment.title, "Bài tập mới"),
                    classroomName: toText(classroom.name, "Lớp học"),
                    teacherName: toText(teacher.name, "Giáo viên"),
                    dueAt: assignment.dueAt,
                    description: toText(assignment.description),
                }),
            });

            await markSent({
                uniqueKey,
                type: "new_assignment",
                assignmentId: toText(assignment._id),
                studentId: student._id,
                email: student.email,
            });

            sent += 1;
        }

        return {
            enabled: true,
            sent,
            skipped,
        };
    },

    async runDeadlineReminderJob() {
        const config = await systemConfigService.getInternalConfig();

        if (!config.email.enabled) {
            return {
                enabled: false,
                checkedAssignments: 0,
                sent: 0,
                skipped: 0,
                failed: 0,
            };
        }

        const reminderHours = config.email.notifyBeforeDue
            ? config.email.reminderBeforeHours
            : [];

        const now = Date.now();
        const maxHours = reminderHours.length ? Math.max(...reminderHours) : 0;
        const windowMs = WINDOW_MINUTES * 60 * 1000;
        const searchStart = new Date(now - windowMs);
        const searchEnd = new Date(now + maxHours * 60 * 60 * 1000 + windowMs);

        const assignments = await Assignment.find({
            status: "published",
            dueAt: {
                $gte: searchStart,
                $lte: searchEnd,
            },
        })
            .populate("classroomId", "name code")
            .lean();

        let sent = 0;
        let skipped = 0;
        let failed = 0;

        for (const rawAssignment of assignments) {
            const assignment = asObject(rawAssignment);
            const classroom = asObject(assignment.classroomId);
            const dueAt = new Date(String(assignment.dueAt || ""));

            if (Number.isNaN(dueAt.getTime())) {
                skipped += 1;
                continue;
            }

            const msLeft = dueAt.getTime() - now;
            const labels: Array<{ type: "deadline_before" | "deadline_due"; key: string; label: string }> = [];

            if (config.email.notifyBeforeDue) {
                for (const hour of reminderHours) {
                    const targetMs = hour * 60 * 60 * 1000;
                    if (msLeft <= targetMs && msLeft > targetMs - windowMs) {
                        labels.push({
                            type: "deadline_before",
                            key: `before_${hour}h`,
                            label: `Bài tập sẽ đến hạn sau khoảng ${hour} giờ`,
                        });
                    }
                }
            }

            if (config.email.notifyAtDue && msLeft <= 0 && msLeft >= -windowMs) {
                labels.push({
                    type: "deadline_due",
                    key: "due_now",
                    label: "Bài tập đã đến hạn nộp",
                });
            }

            if (!labels.length) {
                skipped += 1;
                continue;
            }

            const students = await getEligibleStudents(toText(classroom._id));
            const submittedStudentIds = await getSubmittedStudentIds(toText(assignment._id));

            for (const student of students) {
                if (submittedStudentIds.has(student._id)) {
                    skipped += labels.length;
                    continue;
                }

                for (const label of labels) {
                    const uniqueKey = buildLogKey(
                        label.type,
                        toText(assignment._id),
                        student._id,
                        label.key
                    );

                    if (await hasSent(uniqueKey)) {
                        skipped += 1;
                        continue;
                    }

                    try {
                        await emailService.sendMail({
                            to: student.email,
                            subject:
                                label.type === "deadline_due"
                                    ? `[AutoGrade] Đến hạn nộp: ${toText(assignment.title)}`
                                    : `[AutoGrade] Sắp hết hạn: ${toText(assignment.title)}`,
                            text: `${label.label}. Bài tập: ${toText(assignment.title)}. Hạn nộp: ${formatDateTime(assignment.dueAt)}.`,
                            html: buildReminderHtml({
                                studentName: student.name,
                                assignmentTitle: toText(assignment.title, "Bài tập"),
                                classroomName: toText(classroom.name, "Lớp học"),
                                dueAt: assignment.dueAt,
                                reminderLabel: label.label,
                            }),
                        });

                        await markSent({
                            uniqueKey,
                            type: label.type,
                            assignmentId: toText(assignment._id),
                            studentId: student._id,
                            email: student.email,
                            meta: {
                                rule: label.key,
                            },
                        });

                        sent += 1;
                    } catch {
                        failed += 1;
                    }
                }
            }
        }

        return {
            enabled: true,
            checkedAssignments: assignments.length,
            sent,
            skipped,
            failed,
        };
    },
};
