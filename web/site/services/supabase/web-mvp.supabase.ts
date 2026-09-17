// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CurrentUserPayload } from "@/lib/current-user";
import type { Json } from "@/types/database.types";
import { mapSupabaseErrorToVietnamese } from "@/lib/supabase/errors";
import {
    MAX_SUBMISSION_FILES,
    MAX_SUBMISSION_FILE_SIZE_MB,
} from "@/lib/submission-limits";

type AnyRecord = Record<string, any>;

export class WebMvpError extends Error {
    constructor(message: string, readonly statusCode: number = 400) {
        super(message);
        this.name = "WebMvpError";
    }
}

function record(value: unknown): AnyRecord {
    return typeof value === "object" && value !== null ? value as AnyRecord : {};
}

function rows(value: unknown): AnyRecord[] {
    return Array.isArray(value) ? value.map(record) : [];
}

function fail(error: unknown, fallback: string): never {
    const message = mapSupabaseErrorToVietnamese(error);
    const generic = "Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại sau.";
    throw new WebMvpError(message === generic ? fallback : message, message === generic ? 500 : 400);
}

async function client(): Promise<SupabaseClient<any>> {
    return await createSupabaseServerClient() as SupabaseClient<any>;
}

function requireRole(actor: CurrentUserPayload, role: "student" | "lecturer"): void {
    if (actor.role !== role) {
        throw new WebMvpError(
            role === "lecturer" ? "Chỉ giảng viên được phép thực hiện thao tác này" : "Chỉ sinh viên được phép thực hiện thao tác này",
            403
        );
    }
}

function normalizeAttachment(value: unknown) {
    const item = record(value);
    return {
        url: String(item.url || ""),
        originalName: String(item.originalName || item.original_name || "Tệp đính kèm"),
        kind: String(item.kind || "resource"),
    };
}

function normalizedExtension(fileName: string): string {
    const lastDot = fileName.lastIndexOf(".");
    return lastDot >= 0 ? fileName.slice(lastDot + 1).trim().toLowerCase() : "";
}

function validateSubmissionAssets(
    payload: AnyRecord,
    files: File[],
    assignment: AnyRecord
): void {
    const policy = record(assignment.submission_policy);
    const configuredMaxMb = Number(policy.maxFileSizeMb);
    const maxFileSizeMb = Number.isFinite(configuredMaxMb)
        ? Math.min(MAX_SUBMISSION_FILE_SIZE_MB, Math.max(1, configuredMaxMb))
        : MAX_SUBMISSION_FILE_SIZE_MB;
    const maxBytes = maxFileSizeMb * 1024 * 1024;
    const accepted = Array.isArray(policy.acceptedFileTypes)
        ? policy.acceptedFileTypes.map((value: unknown) => String(value).trim().toLowerCase()).filter(Boolean)
        : ["zip", "apk"];
    const repositoryUrl = String(payload.repositoryUrl || "").trim();
    const allowRepository = policy.allowGithubUrl === true;

    if (files.length > MAX_SUBMISSION_FILES) {
        throw new WebMvpError(`Mỗi bài nộp chỉ được chứa tối đa ${MAX_SUBMISSION_FILES} tệp`, 413);
    }
    for (const file of files) {
        if (file.size > maxBytes) {
            throw new WebMvpError(`Tệp ${file.name} vượt quá giới hạn ${maxFileSizeMb} MB`, 413);
        }
        const extension = normalizedExtension(file.name);
        const allowed = accepted.some((item: string) =>
            item === extension || item === `.${extension}` || item === file.type.toLowerCase()
        );
        if (accepted.length && !allowed) {
            throw new WebMvpError(`Định dạng tệp ${file.name} không được bài tập này chấp nhận`, 415);
        }
    }
    if (repositoryUrl && !allowRepository) {
        throw new WebMvpError("Bài tập này không cho phép nộp bằng đường dẫn repository", 400);
    }
    // Final asset requirements are enforced atomically by save_student_submission().
    // The RPC can safely reuse files from the student's existing draft, which are
    // intentionally not sent back to this server as trusted storage paths.
}

function classDto(row: AnyRecord, lecturer: AnyRecord | null, memberCount: number, assignmentCount: number) {
    const teacher = {
        _id: String(row.lecturer_id || ""),
        name: String(lecturer?.full_name || "Giảng viên"),
        email: String(lecturer?.email || ""),
        role: "lecturer",
    };

    return {
        _id: String(row.id || ""),
        name: String(row.name || ""),
        code: String(row.class_code || ""),
        description: String(row.description || ""),
        semester: row.semester || "HK1",
        academicYear: row.academic_year || "",
        status: row.status === "active" ? "active" : "archived",
        approvedStudentCount: memberCount,
        studentCount: memberCount,
        teacher,
        teacherId: teacher,
        assignmentCount,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

async function enrichClasses(db: SupabaseClient<any>, classRows: AnyRecord[]) {
    if (!classRows.length) return [];
    const classIds = classRows.map((item) => item.id);
    const lecturerIds = [...new Set(classRows.map((item) => item.lecturer_id))];
    const [membersResult, assignmentsResult, profilesResult] = await Promise.all([
        db.from("class_members").select("class_id,status").in("class_id", classIds).eq("status", "active"),
        db.from("assignments").select("class_id").in("class_id", classIds),
        db.from("profiles").select("id,full_name,email").in("id", lecturerIds),
    ]);
    if (membersResult.error) fail(membersResult.error, "Không thể tải thành viên lớp");
    if (assignmentsResult.error) fail(assignmentsResult.error, "Không thể tải bài tập lớp");
    if (profilesResult.error) fail(profilesResult.error, "Không thể tải hồ sơ giảng viên");

    const profiles = new Map(rows(profilesResult.data).map((item) => [item.id, item]));
    return classRows.map((item) => classDto(
        item,
        profiles.get(item.lecturer_id) || null,
        rows(membersResult.data).filter((member) => member.class_id === item.id).length,
        rows(assignmentsResult.data).filter((assignment) => assignment.class_id === item.id).length
    ));
}

const CLASS_SELECT = "id,name,description,class_code,lecturer_id,semester,academic_year,subject_code,status,cover_color,created_at,updated_at";

export const SupabaseWebClassService = {
    async list(actor: CurrentUserPayload) {
        const db = await client();
        let query = db.from("classes").select(CLASS_SELECT);
        if (actor.role === "lecturer") query = query.eq("lecturer_id", actor.userId);
        const { data, error } = await query.order("created_at", { ascending: false });
        if (error) fail(error, "Không thể tải danh sách lớp học");
        return enrichClasses(db, rows(data));
    },

    async detail(actor: CurrentUserPayload, classId: string) {
        const db = await client();
        const { data, error } = await db.from("classes").select(CLASS_SELECT).eq("id", classId).maybeSingle();
        if (error) fail(error, "Không thể tải lớp học");
        if (!data) throw new WebMvpError("Không tìm thấy lớp học hoặc bạn không có quyền truy cập", 404);
        return (await enrichClasses(db, [record(data)]))[0];
    },

    async create(actor: CurrentUserPayload, input: AnyRecord) {
        requireRole(actor, "lecturer");
        const db = await client();
        const { data, error } = await db.from("classes").insert({
            name: input.name,
            description: input.description || null,
            class_code: input.code,
            lecturer_id: actor.userId,
            semester: input.semester,
            academic_year: input.academicYear,
            status: "active",
        }).select(CLASS_SELECT).single();
        if (error) fail(error, "Không thể tạo lớp học");
        return classDto(record(data), { full_name: "Giảng viên", email: actor.email }, 0, 0);
    },

    async update(actor: CurrentUserPayload, classId: string, input: AnyRecord) {
        requireRole(actor, "lecturer");
        const db = await client();
        const update: AnyRecord = {};
        if (input.name !== undefined) update.name = input.name;
        if (input.description !== undefined) update.description = input.description || null;
        if (input.code !== undefined) update.class_code = input.code;
        if (input.semester !== undefined) update.semester = input.semester;
        if (input.academicYear !== undefined) update.academic_year = input.academicYear;
        if (input.status !== undefined) update.status = input.status;
        const { data, error } = await db.from("classes").update(update)
            .eq("id", classId).eq("lecturer_id", actor.userId).select(CLASS_SELECT).maybeSingle();
        if (error) fail(error, "Không thể cập nhật lớp học");
        if (!data) throw new WebMvpError("Không tìm thấy lớp học hoặc bạn không phải chủ lớp", 404);
        return (await enrichClasses(db, [record(data)]))[0];
    },

    async remove(actor: CurrentUserPayload, classId: string) {
        requireRole(actor, "lecturer");
        const db = await client();
        const { data, error } = await db.from("classes").update({ status: "archived" })
            .eq("id", classId).eq("lecturer_id", actor.userId).select("id").maybeSingle();
        if (error) fail(error, "Không thể xóa lớp học");
        if (!data) throw new WebMvpError("Không tìm thấy lớp học hoặc bạn không phải chủ lớp", 404);
        return null;
    },

    async stats(actor: CurrentUserPayload, classId: string) {
        const db = await client();
        const { data: classroom, error: classError } = await db.from("classes")
            .select("id,lecturer_id").eq("id", classId).maybeSingle();
        if (classError) fail(classError, "Không thể kiểm tra lớp học");
        if (!classroom) throw new WebMvpError("Không tìm thấy lớp học hoặc bạn không có quyền truy cập", 404);
        const { count, error } = await db.from("class_members").select("id", { count: "exact", head: true })
            .eq("class_id", classId).eq("status", "active");
        if (error) fail(error, "Không thể tải thống kê lớp học");
        return { activeStudentCount: count || 0, canManageMembers: actor.role === "lecturer" && classroom.lecturer_id === actor.userId };
    },

    async members(actor: CurrentUserPayload, classId: string, status: "active" | "pending") {
        requireRole(actor, "lecturer");
        const db = await client();
        const { data: classroom, error: classError } = await db.from("classes").select("id").eq("id", classId)
            .eq("lecturer_id", actor.userId).maybeSingle();
        if (classError) fail(classError, "Không thể kiểm tra quyền quản lý lớp");
        if (!classroom) throw new WebMvpError("Bạn không phải chủ lớp", 403);
        const { data, error } = await db.from("class_members").select("id,student_id,status,joined_at")
            .eq("class_id", classId).eq("status", status).order("joined_at", { ascending: false });
        if (error) fail(error, "Không thể tải thành viên lớp");
        const memberRows = rows(data);
        const ids = memberRows.map((item) => item.student_id);
        const { data: profiles, error: profileError } = ids.length
            ? await db.from("profiles").select("id,full_name,email,student_code,avatar_url").in("id", ids)
            : { data: [], error: null };
        if (profileError) fail(profileError, "Không thể tải hồ sơ thành viên");
        const profileMap = new Map(rows(profiles).map((item) => [item.id, item]));
        return memberRows.map((member) => {
            const profile = profileMap.get(member.student_id) || {};
            return {
                _id: member.student_id,
                membershipId: member.id,
                userId: {
                    _id: member.student_id,
                    name: profile.full_name || "Sinh viên",
                    email: profile.email || "",
                    studentCode: profile.student_code || "",
                    avatar: profile.avatar_url || null,
                    role: "student",
                },
                roleInClass: "student",
                status: member.status,
            };
        });
    },

    async updateMember(actor: CurrentUserPayload, classId: string, studentId: string, action: string) {
        requireRole(actor, "lecturer");
        if (action !== "approve") throw new WebMvpError("MVP chỉ hỗ trợ duyệt sinh viên; không đổi vai trò trong lớp", 400);
        const db = await client();
        const { data, error } = await db.from("class_members").update({ status: "active" })
            .eq("class_id", classId).eq("student_id", studentId).eq("status", "pending")
            .select("id").maybeSingle();
        if (error) fail(error, "Không thể duyệt sinh viên");
        if (!data) throw new WebMvpError("Không tìm thấy yêu cầu chờ duyệt hoặc bạn không phải chủ lớp", 404);
        return data;
    },

    async removeMember(actor: CurrentUserPayload, classId: string, studentId: string) {
        requireRole(actor, "lecturer");
        const db = await client();
        const { data, error } = await db.from("class_members").update({ status: "dropped" })
            .eq("class_id", classId).eq("student_id", studentId).select("id").maybeSingle();
        if (error) fail(error, "Không thể xóa sinh viên khỏi lớp");
        if (!data) throw new WebMvpError("Không tìm thấy thành viên hoặc bạn không phải chủ lớp", 404);
        return data;
    },
};

const ASSIGNMENT_SELECT = "id,class_id,lecturer_id,title,description,instructions,due_at,max_score,status,rubric,is_active,allow_late_submission,late_penalty_percent,language,rubric_text,submission_policy,runner_config,ai_config,attachments,start_at,allow_resubmit,created_at,updated_at";

function assignmentDtoFromRelations(
    item: AnyRecord,
    classroom: AnyRecord | null,
    lecturer: AnyRecord | null,
    submission: AnyRecord | null
) {
    const sub = record(submission);
    const grade = Array.isArray(sub.grade) ? record(sub.grade[0]) : record(sub.grade);
    const publishedGrade = grade.status === "published";
    const attachmentRows = rows(item.attachments).map(normalizeAttachment);
    const submissionFiles = rows(sub.files).map((file, index) => ({
        originalName: String(file.originalName || file.original_name || `Tệp ${index + 1}`),
        url: `/api/grading/submissions/${sub.id}/file?kind=attachment&index=${index}`,
    }));
    return {
        _id: item.id,
        title: item.title,
        description: item.description || item.instructions || "",
        dueAt: item.due_at,
        startAt: item.start_at || item.created_at,
        status: item.status,
        displayStatus: item.status === "archived" ? "closed" : item.status,
        maxScore: Number(item.max_score || 10),
        allowLateSubmit: Boolean(item.allow_late_submission),
        allowResubmit: Boolean(item.allow_resubmit),
        latePenaltyPercent: Number(item.late_penalty_percent || 0),
        language: item.language || "kotlin",
        rubricText: item.rubric_text || "",
        rubric: Array.isArray(item.rubric) ? item.rubric : [],
        submissionPolicy: record(item.submission_policy),
        runnerConfig: record(item.runner_config),
        aiConfig: record(item.ai_config),
        classroom: classroom ? { _id: classroom.id, name: classroom.name, code: classroom.class_code } : null,
        teacher: lecturer ? { _id: lecturer.id, name: lecturer.full_name, email: lecturer.email } : null,
        attachments: attachmentRows,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        latestSubmission: submission ? {
            _id: sub.id,
            attemptNo: Number(sub.attempt_no || 1),
            status: sub.status === "draft" ? "draft" : sub.is_late ? "late" : "submitted",
            submittedAt: sub.submitted_at,
            repositoryUrl: sub.repository_url || "",
            note: String(sub.content || ""),
            gradeStatus: publishedGrade ? "published" : "pending",
            finalScore: publishedGrade && grade.score !== null && grade.score !== undefined
                ? Number(grade.score)
                : null,
            files: submissionFiles,
        } : null,
    };
}

async function assignmentDtos(
    db: SupabaseClient<any>,
    items: AnyRecord[],
    actor: CurrentUserPayload
) {
    if (!items.length) return [];
    const classIds = [...new Set(items.map((item) => item.class_id).filter(Boolean))];
    const lecturerIds = [...new Set(items.map((item) => item.lecturer_id).filter(Boolean))];
    const assignmentIds = items.map((item) => item.id).filter(Boolean);
    const [classesResult, lecturersResult, submissionsResult] = await Promise.all([
        classIds.length
            ? db.from("classes").select("id,name,class_code").in("id", classIds)
            : Promise.resolve({ data: [], error: null }),
        lecturerIds.length
            ? db.from("profiles").select("id,full_name,email").in("id", lecturerIds)
            : Promise.resolve({ data: [], error: null }),
        actor.role === "student" && assignmentIds.length
            ? db.from("submissions")
                .select("id,assignment_id,status,submitted_at,repository_url,content,files,attempt_no,is_late,grade:grades(status,score)")
                .in("assignment_id", assignmentIds)
                .eq("student_id", actor.userId)
                .eq("is_current", true)
            : Promise.resolve({ data: [], error: null }),
    ]);
    if (classesResult.error) fail(classesResult.error, "Không thể tải lớp của bài tập");
    if (lecturersResult.error) fail(lecturersResult.error, "Không thể tải giảng viên của bài tập");
    if (submissionsResult.error) fail(submissionsResult.error, "Không thể tải trạng thái bài nộp");

    const classroomMap = new Map(rows(classesResult.data).map((item) => [item.id, item]));
    const lecturerMap = new Map(rows(lecturersResult.data).map((item) => [item.id, item]));
    const submissionMap = new Map(rows(submissionsResult.data).map((item) => [item.assignment_id, item]));
    return items.map((item) => assignmentDtoFromRelations(
        item,
        classroomMap.get(item.class_id) || null,
        lecturerMap.get(item.lecturer_id) || null,
        submissionMap.get(item.id) || null
    ));
}

type UploadedAssignmentFile = {
    url: string;
    path: string;
    originalName: string;
    kind: string;
};

const ASSIGNMENT_FILE_LIMIT = 20;
const ASSIGNMENT_FILE_SIZE_LIMIT = 50 * 1024 * 1024;
const ASSIGNMENT_MIME_BY_EXTENSION: Record<string, string> = {
    apk: "application/vnd.android.package-archive",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    pdf: "application/pdf",
    png: "image/png",
    zip: "application/zip",
};

function validateAssignmentFileGroups(
    fileGroups: Array<{ files: File[]; kind: string }>,
    retainedFileCount = 0
) {
    const files = fileGroups.flatMap((group) => group.files);
    if (retainedFileCount + files.length > ASSIGNMENT_FILE_LIMIT) {
        throw new WebMvpError(`Mỗi bài tập chỉ được đính kèm tối đa ${ASSIGNMENT_FILE_LIMIT} tệp`, 413);
    }
    for (const file of files) {
        const extension = normalizedExtension(file.name);
        if (!ASSIGNMENT_MIME_BY_EXTENSION[extension]) {
            throw new WebMvpError(`Định dạng tệp ${file.name} không được hỗ trợ`, 415);
        }
        if (file.size > ASSIGNMENT_FILE_SIZE_LIMIT) {
            throw new WebMvpError(`Tệp ${file.name} vượt quá giới hạn 50 MB`, 413);
        }
    }
}

async function uploadAssignmentFiles(
    db: SupabaseClient<any>,
    actor: CurrentUserPayload,
    files: File[],
    kind: string,
    uploaded: UploadedAssignmentFile[]
) {
    for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${actor.userId}/${crypto.randomUUID()}-${safeName}`;
        const { error } = await db.storage.from("assignments").upload(path, Buffer.from(await file.arrayBuffer()), {
            contentType: ASSIGNMENT_MIME_BY_EXTENSION[normalizedExtension(file.name)],
            upsert: false,
        });
        if (error) fail(error, `Không thể tải lên ${file.name}`);
        const { data } = db.storage.from("assignments").getPublicUrl(path);
        uploaded.push({ url: data.publicUrl, path, originalName: file.name, kind });
    }
}

async function cleanAssignmentUploads(db: SupabaseClient<any>, uploaded: UploadedAssignmentFile[]) {
    if (uploaded.length) {
        await db.storage.from("assignments").remove(uploaded.map((file) => file.path));
    }
}

export const SupabaseWebAssignmentService = {
    async list(actor: CurrentUserPayload) {
        const db = await client();
        let query = db.from("assignments").select(ASSIGNMENT_SELECT);
        if (actor.role === "lecturer") query = query.eq("lecturer_id", actor.userId);
        if (actor.role === "student") query = query.eq("status", "published").eq("is_active", true);
        const { data, error } = await query.order("created_at", { ascending: false });
        if (error) fail(error, "Không thể tải danh sách bài tập");
        return assignmentDtos(db, rows(data), actor);
    },

    async detail(actor: CurrentUserPayload, assignmentId: string) {
        const db = await client();
        const { data, error } = await db.from("assignments").select(ASSIGNMENT_SELECT).eq("id", assignmentId).maybeSingle();
        if (error) fail(error, "Không thể tải bài tập");
        if (!data) throw new WebMvpError("Không tìm thấy bài tập hoặc bạn không có quyền truy cập", 404);
        return (await assignmentDtos(db, [record(data)], actor))[0];
    },

    async create(actor: CurrentUserPayload, payload: AnyRecord, fileGroups: Array<{ files: File[]; kind: string }>) {
        requireRole(actor, "lecturer");
        validateAssignmentFileGroups(fileGroups);
        const db = await client();
        const { data: classroom, error: classError } = await db.from("classes").select("id").eq("id", payload.classroomId)
            .eq("lecturer_id", actor.userId).eq("status", "active").maybeSingle();
        if (classError) fail(classError, "Không thể kiểm tra quyền sở hữu lớp");
        if (!classroom) throw new WebMvpError("Bạn chỉ có thể tạo bài tập trong lớp đang hoạt động do mình quản lý", 403);
        const attachments: UploadedAssignmentFile[] = [];
        let created: AnyRecord;
        try {
            for (const group of fileGroups) {
                await uploadAssignmentFiles(db, actor, group.files, group.kind, attachments);
            }
            const { data, error } = await db.from("assignments").insert({
                class_id: payload.classroomId,
                lecturer_id: actor.userId,
                title: payload.title,
                description: payload.description || null,
                instructions: payload.description || null,
                due_at: payload.dueAt,
                start_at: payload.startAt,
                max_score: payload.maxScore,
                status: payload.status,
                rubric: payload.rubric as Json,
                rubric_text: payload.rubricText || null,
                language: payload.language,
                submission_policy: payload.submissionPolicy as Json,
                runner_config: payload.runnerConfig as Json,
                ai_config: payload.aiConfig as Json,
                attachments: attachments as Json,
                allow_late_submission: payload.allowLateSubmit,
                allow_resubmit: payload.allowResubmit,
                late_penalty_percent: payload.latePenaltyPercent,
                is_active: true,
            }).select(ASSIGNMENT_SELECT).single();
            if (error) fail(error, "Không thể tạo bài tập");
            created = record(data);
        } catch (error) {
            await cleanAssignmentUploads(db, attachments);
            throw error;
        }
        return (await assignmentDtos(db, [created], actor))[0];
    },

    async update(actor: CurrentUserPayload, assignmentId: string, payload: AnyRecord, keptUrls: string[], fileGroups: Array<{ files: File[]; kind: string }>) {
        requireRole(actor, "lecturer");
        const db = await client();
        const { data: existing, error: existingError } = await db.from("assignments").select(ASSIGNMENT_SELECT).eq("id", assignmentId)
            .eq("lecturer_id", actor.userId).maybeSingle();
        if (existingError) fail(existingError, "Không thể tải bài tập cần cập nhật");
        if (!existing) throw new WebMvpError("Không tìm thấy bài tập hoặc bạn không phải chủ bài tập", 404);
        const oldAttachments = rows(existing.attachments).map((value) => {
            const item = record(value);
            const attachment = normalizeAttachment(item);
            return typeof item.path === "string" && item.path
                ? { ...attachment, path: item.path }
                : attachment;
        });
        const retainedAttachments = oldAttachments.filter((item) => keptUrls.includes(item.url));
        validateAssignmentFileGroups(fileGroups, retainedAttachments.length);
        const update: AnyRecord = {};
        const fields: Record<string, string> = {
            classroomId: "class_id", title: "title", description: "description", dueAt: "due_at", startAt: "start_at",
            maxScore: "max_score", status: "status", rubric: "rubric", rubricText: "rubric_text", language: "language",
            submissionPolicy: "submission_policy", runnerConfig: "runner_config", aiConfig: "ai_config",
            allowLateSubmit: "allow_late_submission", allowResubmit: "allow_resubmit", latePenaltyPercent: "late_penalty_percent",
        };
        for (const [source, target] of Object.entries(fields)) if (payload[source] !== undefined) update[target] = payload[source];
        update.instructions = payload.description ?? existing.instructions;
        if (update.class_id) {
            const { data: ownedClass, error: ownedClassError } = await db.from("classes").select("id").eq("id", update.class_id)
                .eq("lecturer_id", actor.userId).maybeSingle();
            if (ownedClassError) fail(ownedClassError, "Không thể kiểm tra lớp đích");
            if (!ownedClass) throw new WebMvpError("Không thể chuyển bài tập sang lớp của giảng viên khác", 403);
        }
        const newAttachments: UploadedAssignmentFile[] = [];
        let data: AnyRecord | null = null;
        try {
            for (const group of fileGroups) {
                await uploadAssignmentFiles(db, actor, group.files, group.kind, newAttachments);
            }
            update.attachments = [...retainedAttachments, ...newAttachments];
            const result = await db.from("assignments").update(update).eq("id", assignmentId)
                .eq("lecturer_id", actor.userId).select(ASSIGNMENT_SELECT).maybeSingle();
            if (result.error) fail(result.error, "Không thể cập nhật bài tập");
            if (!result.data) throw new WebMvpError("Không tìm thấy bài tập", 404);
            data = record(result.data);
        } catch (error) {
            await cleanAssignmentUploads(db, newAttachments);
            throw error;
        }
        return (await assignmentDtos(db, [record(data)], actor))[0];
    },

    async remove(actor: CurrentUserPayload, assignmentId: string) {
        requireRole(actor, "lecturer");
        const db = await client();
        const { data, error } = await db.from("assignments").update({ status: "archived", is_active: false }).eq("id", assignmentId)
            .eq("lecturer_id", actor.userId).select("id").maybeSingle();
        if (error) fail(error, "Không thể xóa bài tập");
        if (!data) throw new WebMvpError("Không tìm thấy bài tập hoặc bạn không phải chủ bài tập", 404);
        return data;
    },

    async updateRunner(actor: CurrentUserPayload, assignmentId: string, runnerConfig: Json) {
        requireRole(actor, "lecturer");
        const db = await client();
        const { data, error } = await db.from("assignments").update({ runner_config: runnerConfig })
            .eq("id", assignmentId).eq("lecturer_id", actor.userId).select("id,runner_config").maybeSingle();
        if (error) fail(error, "Không thể cập nhật runner config");
        if (!data) throw new WebMvpError("Không tìm thấy bài tập hoặc bạn không phải chủ bài tập", 404);
        return { _id: data.id, runnerConfig: data.runner_config };
    },
};

const SUBMISSION_SELECT = "id,assignment_id,student_id,content,repository_url,files,source_zip_url,submitted_at,status,is_late,attempt_no,is_current,created_at,updated_at";

async function submissionDtos(db: SupabaseClient<any>, submissionRows: AnyRecord[]) {
    const assignmentIds = [...new Set(submissionRows.map((item) => item.assignment_id))];
    const studentIds = [...new Set(submissionRows.map((item) => item.student_id))];
    const submissionIds = submissionRows.map((item) => item.id);
    const [assignmentsResult, studentsResult, gradesResult] = await Promise.all([
        assignmentIds.length ? db.from("assignments").select("id,class_id,title,max_score,due_at").in("id", assignmentIds) : Promise.resolve({ data: [], error: null }),
        studentIds.length ? db.from("profiles").select("id,full_name,email,student_code").in("id", studentIds) : Promise.resolve({ data: [], error: null }),
        submissionIds.length ? db.from("grades").select("submission_id,status,score,max_score,feedback,published_at").in("submission_id", submissionIds) : Promise.resolve({ data: [], error: null }),
    ]);
    if (assignmentsResult.error) fail(assignmentsResult.error, "Không thể tải bài tập của bài nộp");
    if (studentsResult.error) fail(studentsResult.error, "Không thể tải sinh viên của bài nộp");
    if (gradesResult.error) fail(gradesResult.error, "Không thể tải kết quả bài nộp");
    const assignmentMap = new Map(rows(assignmentsResult.data).map((item) => [item.id, item]));
    const studentMap = new Map(rows(studentsResult.data).map((item) => [item.id, item]));
    const gradeMap = new Map(rows(gradesResult.data).map((item) => [item.submission_id, item]));
    const classIds = [...new Set([...assignmentMap.values()].map((item) => item.class_id))];
    const { data: classes, error: classesError } = classIds.length
        ? await db.from("classes").select("id,name,class_code").in("id", classIds)
        : { data: [], error: null };
    if (classesError) fail(classesError, "Không thể tải lớp của bài nộp");
    const classMap = new Map(rows(classes).map((item) => [item.id, item]));

    return submissionRows.map((item) => {
        const assignment = assignmentMap.get(item.assignment_id) || {};
        const student = studentMap.get(item.student_id) || {};
        const classroom = classMap.get(assignment.class_id) || {};
        const grade = gradeMap.get(item.id);
        return {
            _id: item.id,
            assignmentId: { _id: assignment.id, title: assignment.title, maxScore: Number(assignment.max_score || 10), dueAt: assignment.due_at },
            classroomId: { _id: classroom.id, name: classroom.name, code: classroom.class_code },
            studentId: { _id: student.id, name: student.full_name || "Sinh viên", email: student.email || "", studentCode: student.student_code || "" },
            repositoryUrl: item.repository_url || "",
            content: item.content || "",
            submittedAt: item.submitted_at,
            status: item.status === "draft" ? "draft" : item.is_late ? "late" : "submitted",
            gradeStatus: grade?.status === "published" ? "overridden" : "pending",
            finalScore: grade?.status === "published" ? Number(grade.score) : null,
            attemptNo: Number(item.attempt_no || 1),
            files: rows(item.files).map((file, index) => ({
                originalName: String(file.originalName || file.original_name || `Tệp ${index + 1}`),
                url: `/api/grading/submissions/${item.id}/file?kind=attachment&index=${index}`,
            })),
        };
    });
}

export const SupabaseWebSubmissionService = {
    async list(actor: CurrentUserPayload, filters: { assignmentId?: string; studentId?: string; classId?: string }) {
        const db = await client();
        let query = db.from("submissions").select(SUBMISSION_SELECT).eq("is_current", true);
        if (filters.assignmentId) query = query.eq("assignment_id", filters.assignmentId);
        if (actor.role === "student") query = query.eq("student_id", actor.userId);
        else if (filters.studentId) query = query.eq("student_id", filters.studentId);
        const { data, error } = await query.order("submitted_at", { ascending: false });
        if (error) fail(error, "Không thể tải danh sách bài nộp");
        let submissionRows = rows(data);
        if (filters.classId) {
            const assignmentIds = [...new Set(submissionRows.map((item) => item.assignment_id))];
            const { data: assignments, error: assignmentsError } = assignmentIds.length
                ? await db.from("assignments").select("id").in("id", assignmentIds).eq("class_id", filters.classId)
                : { data: [], error: null };
            if (assignmentsError) fail(assignmentsError, "Không thể lọc bài nộp theo lớp");
            const allowed = new Set(rows(assignments).map((item) => item.id));
            submissionRows = submissionRows.filter((item) => allowed.has(item.assignment_id));
        }
        return submissionDtos(db, submissionRows);
    },

    async save(actor: CurrentUserPayload, payload: AnyRecord, files: File[]) {
        requireRole(actor, "student");
        const db = await client();
        const { data: assignment, error: assignmentError } = await db.from("assignments")
            .select("id,submission_policy")
            .eq("id", payload.assignmentId)
            .eq("status", "published")
            .eq("is_active", true)
            .maybeSingle();
        if (assignmentError) fail(assignmentError, "Không thể kiểm tra chính sách bài nộp");
        if (!assignment) throw new WebMvpError("Bài tập không tồn tại hoặc hiện không thể nộp", 404);
        validateSubmissionAssets(payload, files, record(assignment));
        const uploaded: Array<{ path: string; originalName: string; size: number; mimeType: string }> = [];
        try {
            for (const file of files) {
                const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
                const path = `${actor.userId}/${payload.assignmentId}/${crypto.randomUUID()}-${safeName}`;
                const { error } = await db.storage.from("submissions").upload(path, Buffer.from(await file.arrayBuffer()), {
                    contentType: file.type || "application/octet-stream",
                    upsert: false,
                });
                if (error) fail(error, `Không thể tải lên ${file.name}`);
                uploaded.push({ path, originalName: file.name, size: file.size, mimeType: file.type || "application/octet-stream" });
            }
            const sourceZip = uploaded.find((file) => /\.zip$/i.test(file.originalName))?.path || null;
            const { data, error } = await db.rpc("save_student_submission", {
                input_assignment_id: payload.assignmentId,
                input_content: payload.note || "",
                input_repository_url: payload.repositoryUrl || "",
                input_files: uploaded as unknown as Json,
                input_action: payload.action,
                input_source_zip_url: sourceZip,
            });
            if (error) fail(error, "Không thể lưu bài nộp");
            return data;
        } catch (error) {
            if (uploaded.length) await db.storage.from("submissions").remove(uploaded.map((file) => file.path));
            throw error;
        }
    },
};

export const SupabaseWebProfileService = {
    async get(actor: CurrentUserPayload) {
        const db = await client();
        const { data, error } = await db.from("profiles").select("id,full_name,email,role,student_code,avatar_url,phone,department,preferences,status")
            .eq("id", actor.userId).maybeSingle();
        if (error) fail(error, "Không thể tải hồ sơ");
        if (!data) throw new WebMvpError("Không tìm thấy hồ sơ", 404);
        const preferences = record(data.preferences);
        return {
            _id: data.id, name: data.full_name, email: data.email, role: data.role,
            studentCode: data.student_code || "", avatar: data.avatar_url || "", phone: data.phone || "",
            department: data.department || "", cohort: String(preferences.cohort || ""), bio: String(preferences.bio || ""),
            notificationSettings: {
                emailAssignments: Boolean(preferences.emailAssignments),
                pushReminders: Boolean(preferences.pushReminders),
            },
        };
    },

    async update(actor: CurrentUserPayload, input: AnyRecord) {
        const db = await client();
        const current = await this.get(actor);
        const preferences = {
            cohort: input.cohort || "",
            bio: input.bio || "",
            emailAssignments: current.notificationSettings.emailAssignments,
            pushReminders: current.notificationSettings.pushReminders,
        };
        const { error } = await db.from("profiles").update({
            full_name: input.name,
            student_code: actor.role === "student" ? input.studentCode || null : null,
            phone: input.phone || null,
            department: input.department || null,
            avatar_url: input.avatar || null,
            preferences,
        }).eq("id", actor.userId);
        if (error) fail(error, "Không thể cập nhật hồ sơ");
        return this.get(actor);
    },

    async updatePreferences(actor: CurrentUserPayload, input: AnyRecord) {
        const db = await client();
        const current = await this.get(actor);
        const preferences = {
            cohort: current.cohort,
            bio: current.bio,
            emailAssignments: Boolean(input.emailAssignments),
            pushReminders: Boolean(input.pushReminders),
        };
        const { error } = await db.from("profiles").update({ preferences }).eq("id", actor.userId);
        if (error) fail(error, "Không thể cập nhật thông báo");
        return { emailAssignments: preferences.emailAssignments, pushReminders: preferences.pushReminders };
    },
};
