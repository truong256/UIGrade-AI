import { classroomRepository } from "@/repositories/classroom.repository";
import * as classroomMemberRepo from "@/repositories/classroom-member.repository";

type Semester = "HK1" | "HK2" | "HK3";

type CurrentUser = {
    userId: string;
    role: string;
};

type CreateClassPayload = {
    name: string;
    code: string;
    description?: string;
    semester: Semester;
    academicYear: string;
};

type RepoUserRef = {
    _id?: unknown;
    name?: unknown;
    email?: unknown;
    studentCode?: unknown;
    role?: unknown;
};

type RepoClassroom = {
    _id?: unknown;
    name?: unknown;
    code?: unknown;
    description?: unknown;
    semester?: unknown;
    academicYear?: unknown;
    status?: unknown;
    teacherId?: unknown;
    studentIds?: unknown;
    createdAt?: unknown;
    updatedAt?: unknown;
};

type NormalizedUserRef = {
    _id: string;
    name: string;
    email: string;
    studentCode: string;
    role: string;
};

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
        const obj = value as { _id?: unknown; toString?: () => string };

        if ("_id" in obj && obj._id && obj._id !== value) {
            return toStringId(obj._id);
        }

        if (typeof obj.toString === "function") {
            const stringified = obj.toString();

            if (stringified && stringified !== "[object Object]") {
                return stringified;
            }
        }
    }

    return String(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function normalizeUserRef(user: unknown): NormalizedUserRef | null {
    if (!isObject(user)) return null;

    const typedUser = user as RepoUserRef;

    return {
        _id: toStringId(typedUser._id),
        name: typeof typedUser.name === "string" ? typedUser.name : "",
        email: typeof typedUser.email === "string" ? typedUser.email : "",
        studentCode:
            typeof typedUser.studentCode === "string" ? typedUser.studentCode : "",
        role: typeof typedUser.role === "string" ? typedUser.role : "",
    };
}

function mapClassroomResponse(
    doc: RepoClassroom | null,
    studentCountMap?: Record<string, number>
) {
    if (!doc) return null;

    const teacherRef = normalizeUserRef(doc.teacherId);

    const students = Array.isArray(doc.studentIds)
        ? doc.studentIds
            .map((student) => normalizeUserRef(student))
            .filter((student): student is NormalizedUserRef => student !== null)
        : [];

    const classId = toStringId(doc._id);

    return {
        _id: classId,
        name: typeof doc.name === "string" ? doc.name : "",
        code: typeof doc.code === "string" ? doc.code : "",
        description: typeof doc.description === "string" ? doc.description : "",
        semester:
            doc.semester === "HK1" || doc.semester === "HK2" || doc.semester === "HK3"
                ? doc.semester
                : "HK1",
        academicYear:
            typeof doc.academicYear === "string" ? doc.academicYear : "",
        status: typeof doc.status === "string" ? doc.status : "active",
        teacher: teacherRef,
        teacherId: teacherRef || toStringId(doc.teacherId),
        studentIds: students,
        approvedStudentCount:
            typeof studentCountMap?.[classId] === "number"
                ? studentCountMap[classId]
                : students.length,
        createdAt: doc.createdAt ?? null,
        updatedAt: doc.updatedAt ?? null,
    };
}

function ensureCanManageClass(currentUser: CurrentUser, teacherId: unknown) {
    if (currentUser.role === "admin") return;

    if (currentUser.role !== "teacher") {
        throw new Error("Bạn không có quyền thực hiện thao tác này");
    }

    const ownerId = toStringId(teacherId);

    if (ownerId && ownerId !== currentUser.userId) {
        throw new Error("Bạn chỉ có thể thao tác trên lớp học của mình");
    }
}

function mergeUniqueById<T extends { _id?: unknown; createdAt?: unknown }>(
    ...groups: T[][]
) {
    const map = new Map<string, T>();

    for (const items of groups) {
        for (const item of items) {
            map.set(String(item._id), item);
        }
    }

    return Array.from(map.values()).sort((a, b) => {
        const timeA = a.createdAt ? new Date(String(a.createdAt)).getTime() : 0;
        const timeB = b.createdAt ? new Date(String(b.createdAt)).getTime() : 0;
        return timeB - timeA;
    });
}

async function attachStudentCount(docs: RepoClassroom[]) {
    const classroomIds = docs
        .map((doc) => toStringId(doc._id))
        .filter(Boolean);

    const countMap = classroomIds.length
        ? await classroomMemberRepo.countActiveStudentsByClassroomIds(classroomIds)
        : {};

    return docs
        .map((doc) => mapClassroomResponse(doc, countMap))
        .filter(Boolean);
}

export const classroomService = {
    async getAllClasses(currentUser: CurrentUser) {
        if (!currentUser) {
            throw new Error("Bạn chưa đăng nhập");
        }

        if (currentUser.role === "admin") {
            const docs = await classroomRepository.findAll();
            return attachStudentCount(docs as RepoClassroom[]);
        }

        if (currentUser.role === "teacher") {
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

            const docs = mergeUniqueById<RepoClassroom>(
                ownedClasses as RepoClassroom[],
                supportedClasses as RepoClassroom[]
            );

            return attachStudentCount(docs);
        }

        const joinedClassIds = await classroomMemberRepo.findClassroomIdsByUserId(
            currentUser.userId,
            {
                status: "active",
            }
        );

        if (!joinedClassIds.length) {
            return [];
        }

        const docs = await classroomRepository.findAllByIds(joinedClassIds);
        return attachStudentCount(docs as RepoClassroom[]);
    },

    async getClassById(id: string) {
        const classroom = await classroomRepository.findById(id);

        if (!classroom) {
            throw new Error("Không tìm thấy lớp học");
        }

        const count = await classroomMemberRepo.countActiveStudentsByClassroomId(id);
        return mapClassroomResponse(classroom as RepoClassroom, { [id]: count });
    },

    async createClass(data: CreateClassPayload, currentUser: CurrentUser) {
        if (!currentUser) {
            throw new Error("Bạn chưa đăng nhập");
        }

        if (!["admin", "teacher"].includes(currentUser.role)) {
            throw new Error("Bạn không có quyền tạo lớp học");
        }

        const normalizedCode = data.code.trim().toUpperCase();
        const existing = await classroomRepository.findByCode(normalizedCode);

        if (existing) {
            throw new Error("Mã lớp đã tồn tại");
        }

        const created = await classroomRepository.create({
            name: data.name.trim(),
            code: normalizedCode,
            description: data.description?.trim() || "",
            semester: data.semester,
            academicYear: data.academicYear.trim(),
            teacherId: currentUser.userId,
            status: "active",
        });

        const reloaded = await classroomRepository.findById(
            toStringId((created as { _id?: unknown })?._id)
        );

        if (!reloaded) {
            throw new Error("Tạo lớp học thất bại");
        }

        return mapClassroomResponse(reloaded as RepoClassroom, {
            [toStringId((reloaded as { _id?: unknown })?._id)]: 0,
        });
    },

    async updateClass(
        id: string,
        data: Partial<CreateClassPayload>,
        currentUser: CurrentUser
    ) {
        const classroom = await classroomRepository.findById(id);

        if (!classroom) {
            throw new Error("Không tìm thấy lớp học");
        }

        ensureCanManageClass(currentUser, (classroom as RepoClassroom).teacherId);

        const payload: Record<string, unknown> = {};

        if (typeof data.name === "string") payload.name = data.name.trim();
        if (typeof data.description === "string") payload.description = data.description.trim();
        if (typeof data.semester === "string") payload.semester = data.semester;
        if (typeof data.academicYear === "string") payload.academicYear = data.academicYear.trim();

        if (typeof data.code === "string" && data.code.trim()) {
            const normalizedCode = data.code.trim().toUpperCase();
            const existing = await classroomRepository.findByCode(normalizedCode);

            if (existing && toStringId((existing as { _id?: unknown })._id) !== id) {
                throw new Error("Mã lớp đã tồn tại");
            }

            payload.code = normalizedCode;
        }

        const updated = await classroomRepository.updateById(id, payload);

        if (!updated) {
            throw new Error("Không thể cập nhật lớp học");
        }

        const count = await classroomMemberRepo.countActiveStudentsByClassroomId(id);
        return mapClassroomResponse(updated as RepoClassroom, { [id]: count });
    },

    async deleteClass(id: string, currentUser: CurrentUser) {
        const classroom = await classroomRepository.findById(id);

        if (!classroom) {
            throw new Error("Không tìm thấy lớp học");
        }

        ensureCanManageClass(currentUser, (classroom as RepoClassroom).teacherId);

        await classroomMemberRepo.deleteManyByClassroomId(id);
        await classroomRepository.deleteById(id);
    },
};