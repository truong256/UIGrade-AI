import { assignmentRepository } from "@/repositories/assignment.repository";
import { classroomRepository } from "@/repositories/classroom.repository";
import * as classroomMemberRepo from "@/repositories/classroom-member.repository";
import { submissionRepository } from "@/repositories/submission.repository";
import { assignmentNotificationService } from "@/services/assignment-notification.service";

import type {
    CreateAssignmentPayload,
    UpdateAssignmentPayload,
} from "@/validations/assignment.validation";
import type { CurrentUserPayload } from "@/lib/current-user";

type AttachmentItem = {
    url: string;
    originalName: string;
    kind: string;
    storedName?: string;
    mimeType?: string;
    size?: number;
};

type UnknownRecord = Record<string, unknown>;

type ClassroomLike = {
    _id?: unknown;
    name?: unknown;
    code?: unknown;
};

type TeacherLike = {
    _id?: unknown;
    name?: unknown;
    email?: unknown;
};

type LatestSubmissionLike = {
    _id?: unknown;
    attemptNo?: unknown;
    status?: unknown;
    finalScore?: unknown;
    gradeStatus?: unknown;
};

type AssignmentLike = {
    _id?: unknown;
    title?: unknown;
    description?: unknown;
    dueAt?: unknown;
    startAt?: unknown;
    status?: unknown;
    displayStatus?: unknown;
    maxScore?: unknown;
    allowLateSubmit?: unknown;
    allowResubmit?: unknown;
    latePenaltyPercent?: unknown;
    language?: unknown;
    rubricText?: unknown;
    rubric?: unknown;
    submissionPolicy?: unknown;
    runnerConfig?: unknown;
    aiConfig?: unknown;
    classroom?: unknown;
    classroomId?: unknown;
    teacher?: unknown;
    teacherId?: unknown;
    attachments?: unknown;
    createdAt?: unknown;
    updatedAt?: unknown;
    version?: unknown;
    latestSubmission?: unknown;
};
function normalizeLatestSubmissionDetail(value: unknown) {
    if (!isObject(value)) {
        return null;
    }

    const item = value as Record<string, unknown>;

    const files = Array.isArray(item.files)
        ? item.files.map((file) => {
            const raw = toObject(file);
            return {
                url: toText(raw.url),
                originalName: toText(raw.originalName),
            };
        })
        : [];

    return {
        _id: toStringId(item._id),
        attemptNo: toNumberValue(item.attemptNo, 1),
        status: toText(item.status, "submitted"),
        submittedAt: item.submittedAt ? String(item.submittedAt) : undefined,
        repositoryUrl: toText(item.repositoryUrl),
        note: toText(item.note),
        files,
    };
}

async function attachLatestSubmissionForStudent(assignments: ReturnType<typeof mapAssignmentResponse>[], studentId: string) {
    if (!assignments.length) return assignments;

    const assignmentIds = assignments.map((item) => item._id).filter(Boolean);
    if (!assignmentIds.length) return assignments;

    const latestDocs = await submissionRepository.findLatestMapForStudent(
        assignmentIds,
        studentId
    );

    const latestMap = new Map<string, unknown>();

    for (const doc of latestDocs) {
        const raw = toObject(doc);
        const assignmentId = toStringId(
            isObject(raw.assignmentId) ? raw.assignmentId._id : raw.assignmentId
        );
        if (!assignmentId || latestMap.has(assignmentId)) continue;
        latestMap.set(assignmentId, doc);
    }

    return assignments.map((item) => ({
        ...item,
        latestSubmission: normalizeLatestSubmissionDetail(latestMap.get(item._id)),
    }));
}

function isObject(value: unknown): value is UnknownRecord {
    return typeof value === "object" && value !== null;
}

function toObject(value: unknown): UnknownRecord {
    return isObject(value) ? value : {};
}

function toStringId(value: unknown): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (
        typeof value === "number" ||
        typeof value === "bigint" ||
        typeof value === "boolean"
    ) {
        return String(value);
    }

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

function toText(value: unknown, fallback = ""): string {
    if (typeof value === "string") return value;
    if (value === null || value === undefined) return fallback;
    return String(value);
}

function toNumberValue(value: unknown, fallback = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeAttachment(value: unknown): AttachmentItem {
    const item = toObject(value);

    return {
        url: toText(item.url),
        originalName: toText(item.originalName),
        kind: toText(item.kind, "resource"),
        storedName: toText(item.storedName) || undefined,
        mimeType: toText(item.mimeType) || undefined,
        size:
            item.size === null || item.size === undefined
                ? undefined
                : toNumberValue(item.size, 0),
    };
}

function normalizeLatestSubmission(value: unknown) {
    if (!isObject(value)) {
        return null;
    }

    const item = value as LatestSubmissionLike;

    return {
        _id: toStringId(item._id),
        attemptNo: toNumberValue(item.attemptNo, 1),
        status: toText(item.status),
        finalScore:
            item.finalScore === null || item.finalScore === undefined
                ? null
                : toNumberValue(item.finalScore, 0),
        gradeStatus: toText(item.gradeStatus),
    };
}

function mapAssignmentResponse(doc: unknown) {
    const assignment = toObject(doc) as AssignmentLike;

    const classroomRaw = assignment.classroom ?? assignment.classroomId ?? null;
    const teacherRaw = assignment.teacher ?? assignment.teacherId ?? null;

    const classroom = isObject(classroomRaw)
        ? (classroomRaw as ClassroomLike)
        : null;

    const teacher = isObject(teacherRaw) ? (teacherRaw as TeacherLike) : null;

    return {
        _id: toStringId(assignment._id),
        title: toText(assignment.title),
        description: toText(assignment.description),
        dueAt: assignment.dueAt ?? null,
        startAt: assignment.startAt ?? null,
        status: toText(assignment.status, "published"),
        displayStatus: toText(
            assignment.displayStatus ?? assignment.status,
            "published"
        ),
        maxScore: toNumberValue(assignment.maxScore, 10),
        allowLateSubmit: Boolean(assignment.allowLateSubmit),
        allowResubmit: Boolean(assignment.allowResubmit),
        latePenaltyPercent: toNumberValue(assignment.latePenaltyPercent, 0),
        language: toText(assignment.language, "cpp"),
        rubricText: toText(assignment.rubricText),
        rubric: Array.isArray(assignment.rubric) ? assignment.rubric : [],
        submissionPolicy: isObject(assignment.submissionPolicy)
            ? assignment.submissionPolicy
            : {},
        runnerConfig: isObject(assignment.runnerConfig)
            ? assignment.runnerConfig
            : {},
        aiConfig: isObject(assignment.aiConfig) ? assignment.aiConfig : {},
        classroom: classroom
            ? {
                _id: toStringId(classroom._id),
                name: toText(classroom.name),
                code: toText(classroom.code),
            }
            : null,
        teacher: teacher
            ? {
                _id: toStringId(teacher._id),
                name: toText(teacher.name),
                email: toText(teacher.email),
            }
            : null,
        attachments: Array.isArray(assignment.attachments)
            ? assignment.attachments.map(normalizeAttachment)
            : [],
        createdAt: assignment.createdAt ?? null,
        updatedAt: assignment.updatedAt ?? null,
        version: toNumberValue(assignment.version, 1),
        latestSubmission: normalizeLatestSubmission(assignment.latestSubmission),
    };
}

function ensureCanManage(currentUser: CurrentUserPayload) {
    if (!currentUser?.userId) {
        throw new Error("Bạn chưa đăng nhập");
    }

    if (currentUser.role !== "teacher" && currentUser.role !== "admin") {
        throw new Error("Bạn không có quyền thực hiện thao tác này");
    }
}

function ensureCanRead(currentUser: CurrentUserPayload) {
    if (!currentUser?.userId) {
        throw new Error("Bạn chưa đăng nhập");
    }
}

async function getAllClassroomIds(): Promise<string[]> {
    const classrooms = await classroomRepository.findAll();

    return classrooms
        .map((item) => toStringId(item?._id))
        .filter(Boolean);
}

async function getJoinedClassroomIds(userId: string): Promise<string[]> {
    const ids = await classroomMemberRepo.findClassroomIdsByUserId(userId, {
        status: "active",
    });

    return ids.map((item) => String(item)).filter(Boolean);
}

export const assignmentService = {
    async getAssignments(currentUser: CurrentUserPayload) {
        ensureCanRead(currentUser);

        if (currentUser.role === "admin") {
            const classroomIds = await getAllClassroomIds();

            if (!classroomIds.length) {
                return [];
            }

            const docs = await assignmentRepository.findManyByClassroomIds(
                classroomIds,
                { includeDraft: true }
            );

            return docs.map(mapAssignmentResponse);
        }

        if (currentUser.role === "teacher") {
            const docs = await assignmentRepository.findByTeacherId(currentUser.userId);
            return docs.map(mapAssignmentResponse);
        }

        const classroomIds = await getJoinedClassroomIds(currentUser.userId);

        if (!classroomIds.length) {
            return [];
        }

        const docs = await assignmentRepository.findManyByClassroomIds(
            classroomIds,
            { includeDraft: false }
        );

        return docs.map(mapAssignmentResponse);
    },

    async getAssignmentById(id: string, currentUser: CurrentUserPayload) {
        ensureCanRead(currentUser);

        const doc = await assignmentRepository.findById(id);

        if (!doc) {
            throw new Error("Không tìm thấy bài tập");
        }

        const mapped = mapAssignmentResponse(doc);

        if (currentUser.role === "admin" || currentUser.role === "teacher") {
            return mapped;
        }

        if (!mapped.classroom?._id) {
            throw new Error("Không thể xác định lớp học của bài tập");
        }

        const joinedClassroomIds = await getJoinedClassroomIds(currentUser.userId);

        if (!joinedClassroomIds.includes(mapped.classroom._id)) {
            throw new Error("Bạn không có quyền xem bài tập này");
        }

        if (mapped.status === "draft") {
            throw new Error("Bài tập chưa được công bố");
        }

        return mapped;
    },

    async getAvailableAssignments(currentUser: CurrentUserPayload) {
        ensureCanRead(currentUser);

        if (currentUser.role === "admin") {
            const classroomIds = await getAllClassroomIds();

            if (!classroomIds.length) {
                return [];
            }

            const docs = await assignmentRepository.findManyByClassroomIds(
                classroomIds,
                { includeDraft: false }
            );

            return docs.map(mapAssignmentResponse);
        }

        if (currentUser.role === "teacher") {
            const docs = await assignmentRepository.findByTeacherId(currentUser.userId);

            return docs
                .map(mapAssignmentResponse)
                .filter((item) => item.status !== "draft");
        }

        const classroomIds = await getJoinedClassroomIds(currentUser.userId);

        if (!classroomIds.length) {
            return [];
        }

        const docs = await assignmentRepository.findManyByClassroomIds(
            classroomIds,
            { includeDraft: false }
        );

        const mapped = docs.map(mapAssignmentResponse);
        return attachLatestSubmissionForStudent(mapped, currentUser.userId);
    },

    async createAssignment(
        payload: CreateAssignmentPayload,
        attachments: AttachmentItem[],
        currentUser: CurrentUserPayload
    ) {
        ensureCanManage(currentUser);

        const created = await assignmentRepository.create({
            ...payload,
            classroomId: payload.classroomId,
            teacherId: currentUser.userId,
            attachments,
            version: 1,
        });

        const createdId = toStringId(toObject(created)._id);
        const reloaded = await assignmentRepository.findById(createdId);

        if (!reloaded) {
            throw new Error("Không thể tạo bài tập");
        }

        if (toText(toObject(reloaded).status, "published") === "published") {
            try {
                await assignmentNotificationService.sendNewAssignmentEmails(createdId);
            } catch (error) {
                console.error("[assignment-notification:create]", error);
            }
        }

        return mapAssignmentResponse(reloaded);
    },

    async updateAssignment(
        id: string,
        payload: UpdateAssignmentPayload,
        input: {
            keepExistingAttachmentUrls: string[];
            newAttachments: AttachmentItem[];
        },
        currentUser: CurrentUserPayload
    ) {
        ensureCanManage(currentUser);

        const current = await assignmentRepository.findById(id);

        if (!current) {
            throw new Error("Không tìm thấy bài tập");
        }

        const currentObject = toObject(current);
        const ownerTeacherId = toStringId(
            isObject(currentObject.teacherId)
                ? currentObject.teacherId._id
                : currentObject.teacherId
        );

        if (currentUser.role !== "admin" && ownerTeacherId !== currentUser.userId) {
            throw new Error("Bạn không có quyền chỉnh sửa bài tập này");
        }

        const currentAttachments = Array.isArray(currentObject.attachments)
            ? currentObject.attachments.map(normalizeAttachment)
            : [];

        const keptAttachments = currentAttachments.filter((item) =>
            input.keepExistingAttachmentUrls.includes(item.url)
        );

        const removedAttachmentUrls = currentAttachments
            .filter(
                (item) => !input.keepExistingAttachmentUrls.includes(item.url)
            )
            .map((item) => item.url)
            .filter(Boolean);

        const updateData: Record<string, unknown> = {
            ...payload,
            attachments: [...keptAttachments, ...input.newAttachments],
            version: toNumberValue(currentObject.version, 1) + 1,
        };

        if (payload.classroomId) {
            updateData.classroomId = payload.classroomId;
        }

        const updated = await assignmentRepository.updateById(id, updateData);

        if (!updated) {
            throw new Error("Không thể cập nhật bài tập");
        }

        const previousStatus = toText(currentObject.status, "published");
        const nextStatus = toText(toObject(updated).status, "published");

        if (previousStatus !== "published" && nextStatus === "published") {
            try {
                await assignmentNotificationService.sendNewAssignmentEmails(id);
            } catch (error) {
                console.error("[assignment-notification:update]", error);
            }
        }

        return {
            assignment: mapAssignmentResponse(updated),
            removedAttachmentUrls,
        };
    },

    async deleteAssignment(id: string, currentUser: CurrentUserPayload) {
        ensureCanManage(currentUser);

        const current = await assignmentRepository.findById(id);

        if (!current) {
            throw new Error("Không tìm thấy bài tập");
        }

        const currentObject = toObject(current);
        const ownerTeacherId = toStringId(
            isObject(currentObject.teacherId)
                ? currentObject.teacherId._id
                : currentObject.teacherId
        );

        if (currentUser.role !== "admin" && ownerTeacherId !== currentUser.userId) {
            throw new Error("Bạn không có quyền xóa bài tập này");
        }

        await assignmentRepository.deleteById(id);

        return {
            _id: toStringId(currentObject._id),
            title: toText(currentObject.title),
        };
    },
};