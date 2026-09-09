import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapSupabaseErrorToVietnamese } from "@/lib/supabase/errors";
import {
    normalizeAssignmentRubric,
    validateGradePayload,
    type GradeCriterionInput,
} from "@/lib/grading-workflow";
import { generateAiFeedback } from "@/services/gemini.service";
import { buildGradingContext } from "@/services/grading-context.service";

type AnyRecord = Record<string, any>;
type GradingActor = {
    id: string;
    role: "student" | "lecturer" | "admin";
};

export class GradingAccessError extends Error {
    constructor(message: string, readonly statusCode: 401 | 403 | 404 | 409 = 403) {
        super(message);
        this.name = "GradingAccessError";
    }
}

function object(value: unknown): AnyRecord {
    return typeof value === "object" && value !== null ? value as AnyRecord : {};
}

function firstRelation(value: unknown): AnyRecord | null {
    if (Array.isArray(value)) return value.length ? object(value[0]) : null;
    const item = object(value);
    return Object.keys(item).length ? item : null;
}

function numberOrNull(value: unknown): number | null {
    if (value === null || value === undefined || value === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function databaseError(error: unknown, fallback: string): Error {
    const message = mapSupabaseErrorToVietnamese(error);
    return new Error(message || fallback);
}

async function authenticatedContext(): Promise<{
    client: SupabaseClient<any>;
    actor: GradingActor;
}> {
    const client = await createSupabaseServerClient() as SupabaseClient<any>;
    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) throw new GradingAccessError("Bạn chưa đăng nhập.", 401);

    const { data: profile, error: profileError } = await client
        .from("profiles")
        .select("role, status")
        .eq("id", user.id)
        .maybeSingle();
    if (profileError) throw databaseError(profileError, "Không thể xác minh tài khoản.");

    const rawRole = profile?.role === "teacher" ? "lecturer" : profile?.role;
    if (!profile || profile.status !== "active" || !["student", "lecturer", "admin"].includes(rawRole)) {
        throw new GradingAccessError("Tài khoản không có quyền truy cập chức năng chấm điểm.", 403);
    }

    return {
        client,
        actor: { id: user.id, role: rawRole as GradingActor["role"] },
    };
}

function requireLecturer(actor: GradingActor): void {
    if (actor.role !== "lecturer") {
        throw new GradingAccessError("Chỉ giảng viên mới có thể chấm và công bố điểm.", 403);
    }
}

function assertAssignmentAccess(actor: GradingActor, assignment: AnyRecord, mutation = false): void {
    if (!assignment.id) throw new GradingAccessError("Không tìm thấy bài tập.", 404);
    if (mutation) requireLecturer(actor);
    if (actor.role !== "admin" && assignment.lecturer_id !== actor.id) {
        throw new GradingAccessError("Bạn không có quyền chấm bài tập của giảng viên khác.", 403);
    }
}

function normalizeAssignment(row: AnyRecord) {
    const classroom = firstRelation(row.class);
    return {
        _id: String(row.id || ""),
        title: String(row.title || "Bài tập"),
        description: String(row.description || row.instructions || ""),
        dueAt: row.due_at || null,
        maxScore: Number(row.max_score || 0),
        lecturerId: String(row.lecturer_id || ""),
        rubric: Array.isArray(row.rubric) ? row.rubric : [],
        classroom: classroom ? {
            _id: String(classroom.id || ""),
            name: String(classroom.name || ""),
            code: String(classroom.class_code || ""),
        } : null,
    };
}

function normalizeGrade(row: unknown) {
    const grade = firstRelation(row);
    if (!grade) return null;
    return {
        id: String(grade.id || ""),
        status: String(grade.status || "draft"),
        score: numberOrNull(grade.score),
        maxScore: Number(grade.max_score || 0),
        lecturerFeedback: String(grade.feedback || ""),
        rubricBreakdown: Array.isArray(grade.rubric_breakdown) ? grade.rubric_breakdown : [],
        aiFeedback: grade.ai_feedback || null,
        gradedAt: grade.graded_at || null,
        publishedAt: grade.published_at || null,
        updatedAt: grade.updated_at || null,
    };
}

function normalizeSubmission(row: AnyRecord) {
    const assignment = firstRelation(row.assignment);
    const student = firstRelation(row.student);
    const grade = normalizeGrade(row.grade ?? row.grades);
    const uploadedFiles = Array.isArray(row.files) ? row.files : [];
    const files = [
        row.source_zip_url ? {
            originalName: "Mã nguồn bài nộp (.zip)",
            url: `/api/grading/submissions/${row.id}/file?kind=source`,
            mimeType: "application/zip",
        } : null,
        row.apk_file_url ? {
            originalName: row.apk_filename || "Ứng dụng Android (.apk)",
            url: `/api/grading/submissions/${row.id}/file?kind=apk`,
            mimeType: "application/vnd.android.package-archive",
        } : null,
        row.file_url ? {
            originalName: "Tệp bài nộp",
            url: `/api/grading/submissions/${row.id}/file?kind=file`,
            mimeType: "application/octet-stream",
        } : null,
        ...uploadedFiles.map((raw: unknown, index: number) => {
            const item = object(raw);
            return {
                originalName: String(item.originalName || item.original_name || `Tệp ${index + 1}`),
                url: `/api/grading/submissions/${row.id}/file?kind=attachment&index=${index}`,
                mimeType: String(item.mimeType || item.mime_type || "application/octet-stream"),
            };
        }),
    ].filter(Boolean);

    return {
        _id: String(row.id || ""),
        assignmentId: String(row.assignment_id || assignment?.id || ""),
        studentId: String(row.student_id || student?.id || ""),
        status: String(row.status || "pending"),
        gradeStatus: grade?.status || "pending",
        isLate: Boolean(row.is_late),
        submittedAt: row.submitted_at || null,
        content: String(row.content || ""),
        sourceArchive: files[0] || null,
        files,
        screenshotUrls: Array.isArray(row.screenshot_urls) ? row.screenshot_urls : [],
        assignment: assignment ? normalizeAssignment(assignment) : null,
        student: student ? {
            _id: String(student.id || ""),
            name: String(student.full_name || "Sinh viên"),
            email: String(student.email || ""),
            studentCode: String(student.student_code || ""),
            avatarUrl: student.avatar_url || null,
        } : null,
        grade,
        // This normalized record is used by lecturer workspaces. Student detail
        // access is sanitized below unless the grade is published.
        finalScore: grade?.score ?? null,
    };
}

const ASSIGNMENT_SELECT = `
    id, lecturer_id, class_id, title, description, instructions, due_at, max_score, rubric,
    class:classes!assignments_class_id_fkey(id, name, class_code)
`;

const SUBMISSION_SELECT = `
    id, assignment_id, student_id, content, file_url, apk_file_url, apk_filename,
    source_zip_url, files, repository_url, screenshot_urls, submitted_at, status, is_late, created_at, updated_at,
    assignment:assignments!submissions_assignment_id_fkey(
        id, lecturer_id, class_id, title, description, instructions, due_at, max_score, rubric,
        class:classes!assignments_class_id_fkey(id, name, class_code)
    ),
    student:profiles!submissions_student_id_fkey(id, full_name, email, student_code, avatar_url),
    grade:grades(id, status, score, max_score, feedback, rubric_breakdown, ai_feedback,
        graded_at, published_at, updated_at)
`;

async function getSubmissionRow(client: SupabaseClient<any>, submissionId: string): Promise<AnyRecord> {
    const { data, error } = await client
        .from("submissions")
        .select(SUBMISSION_SELECT)
        .eq("id", submissionId)
        .maybeSingle();
    if (error) throw databaseError(error, "Không thể tải bài nộp.");
    if (!data) throw new GradingAccessError("Không tìm thấy bài nộp.", 404);
    return object(data);
}

export const SupabaseGradingService = {
    async listAssignments() {
        const { client, actor } = await authenticatedContext();
        if (actor.role === "student") {
            throw new GradingAccessError("Sinh viên không có quyền mở màn hình chấm bài.", 403);
        }

        let query = client.from("assignments").select(ASSIGNMENT_SELECT);
        if (actor.role === "lecturer") query = query.eq("lecturer_id", actor.id);
        const { data, error } = await query.order("due_at", { ascending: false });
        if (error) throw databaseError(error, "Không thể tải danh sách bài tập.");
        return {
            items: (data || []).map((row) => normalizeAssignment(object(row))),
            canGrade: actor.role === "lecturer",
        };
    },

    async getAssignmentWorkspace(assignmentId: string) {
        const { client, actor } = await authenticatedContext();
        if (actor.role === "student") {
            throw new GradingAccessError("Sinh viên không có quyền xem danh sách chấm bài.", 403);
        }

        const { data: assignmentData, error: assignmentError } = await client
            .from("assignments")
            .select(ASSIGNMENT_SELECT)
            .eq("id", assignmentId)
            .maybeSingle();
        if (assignmentError) throw databaseError(assignmentError, "Không thể tải bài tập.");
        const assignment = object(assignmentData);
        assertAssignmentAccess(actor, assignment);

        const [membersResult, submissionsResult] = await Promise.all([
            client.from("class_members").select(`
                student_id, status, joined_at,
                student:profiles!class_members_student_id_fkey(
                    id, full_name, email, student_code, avatar_url
                )
            `).eq("class_id", assignment.class_id).eq("status", "active"),
            client.from("submissions").select(SUBMISSION_SELECT)
                .eq("assignment_id", assignmentId)
                .order("submitted_at", { ascending: false }),
        ]);
        if (membersResult.error) throw databaseError(membersResult.error, "Không thể tải danh sách sinh viên.");
        if (submissionsResult.error) throw databaseError(submissionsResult.error, "Không thể tải danh sách bài nộp.");

        const students = (membersResult.data || []).map((raw) => {
            const member = object(raw);
            const profile = firstRelation(member.student) || {};
            return {
                _id: String(profile.id || member.student_id || ""),
                name: String(profile.full_name || "Sinh viên"),
                email: String(profile.email || ""),
                studentCode: String(profile.student_code || ""),
                avatarUrl: profile.avatar_url || null,
            };
        });

        return {
            assignment: normalizeAssignment(assignment),
            students,
            submissions: (submissionsResult.data || []).map((row) => normalizeSubmission(object(row))),
        };
    },

    async getSubmissionDetail(submissionId: string) {
        const { client, actor } = await authenticatedContext();
        const row = await getSubmissionRow(client, submissionId);
        const assignment = firstRelation(row.assignment) || {};
        const studentId = String(row.student_id || "");

        if (actor.role === "student" && studentId !== actor.id) {
            throw new GradingAccessError("Bạn không có quyền xem bài nộp của sinh viên khác.", 403);
        }
        if (actor.role !== "student") assertAssignmentAccess(actor, assignment);

        const normalized = normalizeSubmission(row);
        if (actor.role === "student" && normalized.grade?.status !== "published") {
            normalized.grade = null;
            normalized.finalScore = null;
            normalized.gradeStatus = "pending";
        }
        return normalized;
    },

    async getSubmissionFileUrl(submissionId: string, kind: "source" | "apk" | "file" | "attachment", index = 0) {
        const { client, actor } = await authenticatedContext();
        const row = await getSubmissionRow(client, submissionId);
        const assignment = firstRelation(row.assignment) || {};
        if (actor.role === "student" && String(row.student_id || "") !== actor.id) {
            throw new GradingAccessError("Bạn không có quyền mở tệp của sinh viên khác.", 403);
        }
        if (actor.role !== "student") assertAssignmentAccess(actor, assignment);

        const attachment = Array.isArray(row.files) ? object(row.files[index]) : {};
        const raw = String(kind === "source"
            ? row.source_zip_url || ""
            : kind === "apk"
                ? row.apk_file_url || ""
                : kind === "attachment"
                    ? attachment.path || ""
                    : row.file_url || "");
        if (!raw) throw new GradingAccessError("Không tìm thấy tệp bài nộp.", 404);

        let objectPath = raw.replace(/^\/+/, "");
        if (/^https?:\/\//i.test(raw)) {
            const parsed = new URL(raw);
            const marker = "/storage/v1/object/";
            const markerIndex = parsed.pathname.indexOf(marker);
            if (markerIndex < 0) {
                if (parsed.protocol !== "https:") {
                    throw new GradingAccessError("Liên kết tệp không an toàn.", 403);
                }
                return raw;
            }
            const afterObject = parsed.pathname.slice(markerIndex + marker.length)
                .replace(/^(sign|public|authenticated)\//, "");
            objectPath = decodeURIComponent(afterObject).replace(/^submissions\//, "");
        } else {
            objectPath = objectPath.replace(/^submissions\//, "");
        }

        const { data, error } = await client.storage.from("submissions")
            .createSignedUrl(objectPath, 60 * 10);
        if (error || !data?.signedUrl) {
            throw databaseError(error, "Không thể tạo liên kết tải tệp.");
        }
        return data.signedUrl;
    },

    async getHistory(submissionId: string) {
        const { client, actor } = await authenticatedContext();
        const row = await getSubmissionRow(client, submissionId);
        const assignment = firstRelation(row.assignment) || {};
        if (actor.role === "student") {
            throw new GradingAccessError("Sinh viên không có quyền xem lịch sử chấm nội bộ.", 403);
        }
        assertAssignmentAccess(actor, assignment);

        const { data, error } = await client
            .from("grading_history")
            .select("id, action, actor_id, previous_score, next_score, previous_status, next_status, lecturer_feedback, created_at")
            .eq("submission_id", submissionId)
            .order("created_at", { ascending: true });
        if (error) throw databaseError(error, "Không thể tải lịch sử chấm.");
        return (data || []).map((item) => ({
            id: item.id,
            action: item.action,
            actorId: item.actor_id,
            previousScore: numberOrNull(item.previous_score),
            nextScore: numberOrNull(item.next_score),
            previousStatus: item.previous_status,
            nextStatus: item.next_status,
            note: item.lecturer_feedback || "",
            createdAt: item.created_at,
        }));
    },

    async saveGrade(params: {
        submissionId: string;
        criteria?: GradeCriterionInput[];
        manualScore?: unknown;
        lecturerFeedback?: unknown;
        publish: boolean;
    }) {
        const { client, actor } = await authenticatedContext();
        requireLecturer(actor);
        const row = await getSubmissionRow(client, params.submissionId);
        const assignment = firstRelation(row.assignment) || {};
        assertAssignmentAccess(actor, assignment, true);

        const validated = validateGradePayload({
            assignmentRubric: assignment.rubric,
            assignmentMaxScore: assignment.max_score,
            criteria: params.criteria,
            manualScore: params.manualScore,
            lecturerFeedback: params.lecturerFeedback,
            publish: params.publish,
        });
        const existingGrade = normalizeGrade(row.grade);
        if (!params.publish && existingGrade?.status === "published") {
            throw new GradingAccessError(
                "Điểm đã được công bố. Hãy dùng Công bố điểm để xác nhận bản cập nhật.",
                409
            );
        }

        const { data, error } = await client.from("grades").upsert({
            ...(existingGrade?.id ? { id: existingGrade.id } : {}),
            submission_id: params.submissionId,
            lecturer_id: actor.id,
            score: validated.score,
            max_score: validated.maxScore,
            feedback: validated.lecturerFeedback,
            rubric_breakdown: validated.rubricBreakdown,
            status: params.publish ? "published" : "draft",
        }, { onConflict: "submission_id" }).select(`
            id, status, score, max_score, feedback, rubric_breakdown, ai_feedback,
            graded_at, published_at, updated_at
        `).single();
        if (error) throw databaseError(error, "Không thể lưu kết quả chấm.");
        return normalizeGrade(data);
    },

    async generateAiSuggestion(submissionId: string) {
        const { client, actor } = await authenticatedContext();
        requireLecturer(actor);
        const row = await getSubmissionRow(client, submissionId);
        const assignment = firstRelation(row.assignment) || {};
        assertAssignmentAccess(actor, assignment, true);
        const rubric = normalizeAssignmentRubric(assignment.rubric);
        if (!rubric.length) {
            throw new Error("Bài tập chưa có rubric để AI phân tích theo tiêu chí.");
        }

        const context = await buildGradingContext({
            assignmentId: {
                title: assignment.title,
                description: assignment.description || assignment.instructions,
                rubric: rubric.map((item) => ({ ...item, gradingSource: "ai" })),
            },
            note: row.content,
            repositoryUrl: row.source_zip_url || row.file_url || "",
        });
        const aiFeedback = await generateAiFeedback({
            assignmentTitle: String(assignment.title || "Bài tập"),
            gradingContextText: context.text,
            multimodalParts: context.multimodalParts,
            rubric: rubric.map((item) => ({
                ...item,
                gradingSource: "ai" as const,
                requiredEvidence: [],
                passThreshold: null,
            })),
            runnerReport: null,
            model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
            language: "vi",
        });

        const existingGrade = normalizeGrade(row.grade);
        let query;
        if (existingGrade?.id) {
            query = client.from("grades").update({ ai_feedback: aiFeedback })
                .eq("id", existingGrade.id);
        } else {
            query = client.from("grades").insert({
                submission_id: submissionId,
                lecturer_id: actor.id,
                score: 0,
                max_score: Number(assignment.max_score || 0),
                feedback: "",
                rubric_breakdown: [],
                ai_feedback: aiFeedback,
                status: "draft",
            });
        }
        const { error } = await query;
        if (error) throw databaseError(error, "Không thể lưu gợi ý AI.");
        return aiFeedback;
    },

    async getMyPublishedResults() {
        const { client, actor } = await authenticatedContext();
        if (actor.role !== "student" && actor.role !== "admin") {
            throw new GradingAccessError("Trang kết quả chỉ dành cho sinh viên.", 403);
        }

        const query = client.from("grades").select(`
            id, status, score, max_score, feedback, rubric_breakdown, ai_feedback,
            graded_at, published_at, updated_at,
            submission:submissions!grades_submission_id_fkey(
                id, student_id, submitted_at, is_late, status, content, file_url,
                assignment:assignments!submissions_assignment_id_fkey(
                    id, title, due_at, max_score,
                    class:classes!assignments_class_id_fkey(id, name, class_code)
                )
            )
        `).eq("status", "published").order("published_at", { ascending: false });
        const { data, error } = await query;
        if (error) throw databaseError(error, "Không thể tải kết quả đã công bố.");

        return (data || []).flatMap((raw) => {
            const grade = object(raw);
            const submission = firstRelation(grade.submission);
            if (!submission || (actor.role === "student" && submission.student_id !== actor.id)) return [];
            const assignment = firstRelation(submission.assignment) || {};
            const classroom = firstRelation(assignment.class) || {};
            return [{
                _id: String(grade.id || ""),
                submissionId: String(submission.id || ""),
                assignmentId: String(assignment.id || ""),
                assignmentTitle: String(assignment.title || "Bài tập"),
                classroomName: String(classroom.name || "Lớp học"),
                classroomCode: String(classroom.class_code || ""),
                dueAt: assignment.due_at || null,
                submittedAt: submission.submitted_at || null,
                submissionStatus: String(submission.status || "graded"),
                gradeStatus: "published",
                finalScore: Number(grade.score || 0),
                maxScore: Number(grade.max_score || assignment.max_score || 0),
                studentNote: String(submission.content || ""),
                teacherComment: String(grade.feedback || ""),
                aiFeedback: grade.ai_feedback || null,
                criterionBreakdown: Array.isArray(grade.rubric_breakdown) ? grade.rubric_breakdown : [],
                gradedAt: grade.graded_at || null,
                publishedAt: grade.published_at || null,
                isLate: Boolean(submission.is_late),
            }];
        });
    },
};

export function resolveGradingHttpStatus(error: unknown): number {
    if (error instanceof GradingAccessError) return error.statusCode;
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (message.includes("đăng nhập") || message.includes("jwt")) return 401;
    if (message.includes("quyền") || message.includes("lecturer")) return 403;
    if (message.includes("không tìm thấy") || message.includes("does not exist")) return 404;
    if (message.includes("duplicate") || message.includes("đã được")) return 409;
    return 400;
}
