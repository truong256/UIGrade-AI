import { assignmentRepository } from "@/repositories/assignment.repository";
import * as classroomMemberRepo from "@/repositories/classroom-member.repository";
import { submissionRepository } from "@/repositories/submission.repository";
import type { CreateSubmissionPayload } from "@/validations/submission.validation";
import type { CurrentUserPayload } from "@/lib/current-user";

type SubmissionFile = {
    originalName: string;
    storedName: string;
    url: string;
    mimeType: string;
    size: number;
};

function toStringId(value: unknown): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "bigint") return String(value);

    if (typeof value === "object" && value !== null) {
        const maybeObject = value as { _id?: unknown; toString?: () => string };

        if ("_id" in maybeObject && maybeObject._id && maybeObject._id !== value) {
            return toStringId(maybeObject._id);
        }

        if (typeof maybeObject.toString === "function") {
            const stringValue = maybeObject.toString();
            if (stringValue && stringValue !== "[object Object]") {
                return stringValue;
            }
        }
    }

    return String(value);
}

function getAcceptedFileTypes(assignment: any) {
    const policy = assignment?.submissionPolicy || {};
    const accepted = Array.isArray(policy.acceptedFileTypes)
        ? policy.acceptedFileTypes.map((item: string) => String(item).trim().toLowerCase())
        : ["zip"];
    return accepted.length ? accepted : ["zip"];
}

function getExtension(fileName: string) {
    const cleaned = String(fileName || "").trim();
    const parts = cleaned.split(".");
    return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

function buildAssignmentSnapshot(assignment: any) {
    return {
        assignmentId: assignment._id,
        title: assignment.title,
        description: assignment.description || "",
        rubricText: assignment.rubricText || "",
        language: assignment.language || "kotlin",
        version: Number(assignment.version || 1),
        maxScore: Number(assignment.maxScore || 10),
        rubric: Array.isArray(assignment.rubric) ? assignment.rubric : [],
        attachments: Array.isArray(assignment.attachments) ? assignment.attachments : [],
        submissionPolicy: assignment.submissionPolicy || {},
        runnerConfig: assignment.runnerConfig || {},
        aiConfig: assignment.aiConfig || {},
    };
}

export const submissionService = {
    async createSubmission(
        payload: CreateSubmissionPayload,
        input: {
            sourceArchive: SubmissionFile | null;
            screenshots: SubmissionFile[];
            files: SubmissionFile[];
        },
        currentUser: CurrentUserPayload
    ) {
        if (!currentUser?.userId) {
            throw new Error("Bạn chưa đăng nhập");
        }

        const assignment = await assignmentRepository.findById(payload.assignmentId);

        if (!assignment) {
            throw new Error("Không tìm thấy bài tập");
        }

        if (assignment.status === "draft") {
            throw new Error("Bài tập này chưa được công bố");
        }

        if (assignment.status === "closed") {
            throw new Error("Bài tập này đã bị đóng, không thể nộp thêm");
        }

        const classroomId = toStringId(assignment.classroomId?._id || assignment.classroomId);
        const teacherId = toStringId(assignment.teacherId?._id || assignment.teacherId);

        if (teacherId === currentUser.userId) {
            throw new Error("Giảng viên không thể nộp bài cho bài tập do mình tạo");
        }

        const member = await classroomMemberRepo.findMember(classroomId, currentUser.userId);

        if (!member || member.status !== "active") {
            throw new Error("Bạn chưa là thành viên hợp lệ của lớp này");
        }

        if (member.roleInClass !== "student") {
            throw new Error("Chỉ sinh viên mới có thể nộp bài tập");
        }

        const submissionPolicy = assignment.submissionPolicy || {};
        const allowGithubUrl = Boolean(submissionPolicy.allowGithubUrl);
        const allowScreenshots = Boolean(submissionPolicy.allowScreenshots);
        const requireZip = submissionPolicy.requireZip !== false;
        const acceptedFileTypes = getAcceptedFileTypes(assignment);
        const rawMaxAttempts = Number(submissionPolicy.maxAttempts || 1);
        const maxAttempts = assignment.allowResubmit
            ? rawMaxAttempts > 1
                ? rawMaxAttempts
                : Number.MAX_SAFE_INTEGER
            : rawMaxAttempts;
        const maxFileSizeMb = Number(submissionPolicy.maxFileSizeMb || 256);
        const maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;

        if (payload.repositoryUrl?.trim() && !allowGithubUrl) {
            throw new Error("Bài tập này không cho phép nộp link repository");
        }

        if (input.screenshots.length > 0 && !allowScreenshots) {
            throw new Error("Bài tập này không cho phép đính kèm ảnh screenshot");
        }

        if (input.sourceArchive) {
            const extension = getExtension(input.sourceArchive.originalName);
            if (acceptedFileTypes.length && !acceptedFileTypes.includes(extension)) {
                throw new Error(
                    `File bài nộp phải thuộc một trong các định dạng: ${acceptedFileTypes.join(", ")}`
                );
            }

            if (requireZip && extension !== "zip") {
                throw new Error("Bài tập này yêu cầu nộp source dưới dạng file .zip");
            }

            if (Number(input.sourceArchive.size || 0) > maxFileSizeBytes) {
                throw new Error(
                    `File bài nộp vượt quá dung lượng cho phép ${maxFileSizeMb} MB`
                );
            }
        }

        for (const screenshot of input.screenshots) {
            if (Number(screenshot.size || 0) > maxFileSizeBytes) {
                throw new Error(
                    `Ảnh screenshot vượt quá dung lượng cho phép ${maxFileSizeMb} MB`
                );
            }
        }

        const hasUpload = !!input.sourceArchive;
        const hasRepository = Boolean(payload.repositoryUrl?.trim());

        if (payload.action === "submit" && !hasUpload && !hasRepository) {
            throw new Error("Bạn cần tải source zip hoặc nhập link repository trước khi nộp");
        }

        const now = new Date();
        const dueAt = new Date(String(assignment.dueAt));
        const isLate = now.getTime() > dueAt.getTime();

        if (isLate && !assignment.allowLateSubmit && payload.action === "submit") {
            throw new Error("Bài tập đã quá hạn và không cho phép nộp muộn");
        }

        const latestSubmission = await submissionRepository.findLatestByAssignmentAndStudent(
            payload.assignmentId,
            currentUser.userId
        );

        const latestAttemptNo = Number(latestSubmission?.attemptNo || 0);
        if (latestAttemptNo >= maxAttempts) {
            throw new Error(
                maxAttempts === Number.MAX_SAFE_INTEGER
                    ? "Bạn không thể nộp thêm cho bài tập này"
                    : `Bạn đã dùng hết ${maxAttempts} lượt nộp cho bài tập này`
            );
        }

        if (
            latestSubmission &&
            latestSubmission.status !== "draft" &&
            payload.action === "submit" &&
            !assignment.allowResubmit
        ) {
            throw new Error("Bài tập này không cho phép nộp lại");
        }

        const nextAttemptNo = latestAttemptNo + 1;
        await submissionRepository.markPreviousLatestFalse(payload.assignmentId, currentUser.userId);

        const status = payload.action === "draft" ? "draft" : isLate ? "late" : "submitted";

        const files = [
            ...(input.sourceArchive ? [input.sourceArchive] : []),
            ...input.screenshots,
            ...(Array.isArray(input.files) ? input.files : []),
        ];

        const created = await submissionRepository.create({
            assignmentId: payload.assignmentId,
            classroomId,
            studentId: currentUser.userId,
            attemptNo: nextAttemptNo,
            status,
            isLate: payload.action === "submit" ? isLate : false,
            latest: true,
            repositoryUrl: payload.repositoryUrl,
            note: payload.note,
            sourceArchive: input.sourceArchive,
            screenshots: input.screenshots,
            files,
            assignmentSnapshot: buildAssignmentSnapshot(assignment),
            autoGrade: null,
            teacherOverride: null,
            finalScore: null,
            gradeStatus: "pending",
            gradeHistory: [],
            submittedAt: now,
        });

        return {
            _id: toStringId(created._id),
            attemptNo: nextAttemptNo,
            status,
            isLate: payload.action === "submit" ? isLate : false,
            repositoryUrl: payload.repositoryUrl,
            note: payload.note,
            sourceArchive: input.sourceArchive,
            screenshots: input.screenshots,
            files,
            submittedAt: now,
            gradeStatus: "pending",
            finalScore: null,
            assignment: {
                _id: toStringId(assignment._id),
                title: assignment.title,
                dueAt: assignment.dueAt,
                allowResubmit: Boolean(assignment.allowResubmit),
                allowLateSubmit: Boolean(assignment.allowLateSubmit),
                latePenaltyPercent: Number(assignment.latePenaltyPercent || 0),
                submissionPolicy,
            },
        };
    },
};