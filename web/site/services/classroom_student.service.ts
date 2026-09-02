import * as classroomMemberRepo from "@/repositories/classroom-member.repository";
import {
    validateAddStudentPayload,
    validateJoinClassPayload,
    validateUpdateMemberPayload,
} from "@/validations/classroom-member.validation";

type ClassroomLike = {
    _id?: unknown;
    teacherId?: unknown;
};

class ServiceError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 400
    ) {
        super(message);
        this.name = "ServiceError";
    }
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

async function assertTeacherPermission(actorId: string, classroomId: string) {
    const hasPermission = await classroomMemberRepo.isTeacherInClass(
        classroomId,
        actorId
    );

    if (!hasPermission) {
        throw new ServiceError("Bạn không có quyền quản lý lớp này", 403);
    }
}

export async function joinClassByCode(actorId: string, body: unknown) {
    const { joinCode } = validateJoinClassPayload(body);

    const classroom = await classroomMemberRepo.findClassroomByCode(joinCode);

    if (!classroom) {
        throw new ServiceError("Không tìm thấy lớp với mã này", 404);
    }

    const classroomId = toStringId((classroom as ClassroomLike)._id);
    const teacherId = toStringId((classroom as ClassroomLike).teacherId);

    if (teacherId === actorId) {
        return {
            message: "Bạn là giáo viên của lớp này rồi",
            classroom,
        };
    }

    const existingMember = await classroomMemberRepo.findMember(
        classroomId,
        actorId
    );

    if (existingMember?.status === "active") {
        return {
            message: "Bạn đã là thành viên của lớp này",
            classroom,
        };
    }

    if (existingMember?.status === "pending") {
        return {
            message: "Yêu cầu tham gia của bạn đang chờ duyệt",
            classroom,
        };
    }

    await classroomMemberRepo.createMember({
        classroomId,
        userId: actorId,
        roleInClass: "student",
        status: "pending",
    });

    return {
        message: "Đã gửi yêu cầu tham gia lớp",
        classroom,
    };
}

export async function getStudentsInClass(
    actorId: string,
    classroomId: string,
    query: {
        mode?: string | null;
        status?: string | null;
        keyword?: string | null;
    }
) {
    const classroom = await classroomMemberRepo.findClassroomById(classroomId);

    if (!classroom) {
        throw new ServiceError("Không tìm thấy lớp học", 404);
    }

    await assertTeacherPermission(actorId, classroomId);

    if (query.mode === "available") {
        const items = await classroomMemberRepo.searchAvailableStudents(
            classroomId,
            query.keyword || ""
        );

        return { items };
    }

    const status = query.status === "pending" ? "pending" : "active";
    const items = (await classroomMemberRepo.listMembers(
        classroomId,
        status
    )) as any[];

    if (status === "active") {
        const ownerId = toStringId((classroom as ClassroomLike).teacherId);

        const ownerExists = items.some((item) => {
            return toStringId(item?.userId) === ownerId;
        });

        if (!ownerExists && ownerId) {
            const owner = await classroomMemberRepo.findUserById(ownerId);

            if (owner) {
                items.unshift({
                    _id: `owner-${ownerId}`,
                    userId: owner,
                    roleInClass: "teacher",
                    status: "active",
                    isOwner: true,
                });
            }
        }
    }

    return { items };
}

export async function addStudentToClass(
    actorId: string,
    classroomId: string,
    body: unknown
) {
    const classroom = await classroomMemberRepo.findClassroomById(classroomId);

    if (!classroom) {
        throw new ServiceError("Không tìm thấy lớp học", 404);
    }

    await assertTeacherPermission(actorId, classroomId);

    const { studentId } = validateAddStudentPayload(body);
    const teacherId = toStringId((classroom as ClassroomLike).teacherId);

    if (studentId === teacherId) {
        throw new ServiceError("Không thể thêm giáo viên chủ lớp vào danh sách học sinh");
    }

    await classroomMemberRepo.upsertMember({
        classroomId,
        userId: studentId,
        roleInClass: "student",
        status: "active",
    });

    return {
        message: "Đã thêm học sinh vào lớp",
    };
}

export async function updateStudentInClass(
    actorId: string,
    classroomId: string,
    studentId: string,
    body: unknown
) {
    const classroom = await classroomMemberRepo.findClassroomById(classroomId);

    if (!classroom) {
        throw new ServiceError("Không tìm thấy lớp học", 404);
    }

    await assertTeacherPermission(actorId, classroomId);

    const ownerId = toStringId((classroom as ClassroomLike).teacherId);

    if (studentId === ownerId) {
        throw new ServiceError("Không thể chỉnh sửa vai trò của giáo viên chủ lớp");
    }

    const member = await classroomMemberRepo.findMember(classroomId, studentId);

    if (!member) {
        throw new ServiceError("Không tìm thấy thành viên trong lớp", 404);
    }

    const payload = validateUpdateMemberPayload(body);

    if (payload.action === "approve") {
        await classroomMemberRepo.approveMember(classroomId, studentId);

        return {
            message: "Đã duyệt học sinh vào lớp",
        };
    }

    await classroomMemberRepo.updateMemberRole(
        classroomId,
        studentId,
        payload.roleInClass
    );

    return {
        message: "Đã cập nhật vai trò thành viên",
    };
}

export async function removeStudentFromClass(
    actorId: string,
    classroomId: string,
    studentId: string
) {
    const classroom = await classroomMemberRepo.findClassroomById(classroomId);

    if (!classroom) {
        throw new ServiceError("Không tìm thấy lớp học", 404);
    }

    await assertTeacherPermission(actorId, classroomId);

    const ownerId = toStringId((classroom as ClassroomLike).teacherId);

    if (studentId === ownerId) {
        throw new ServiceError("Không thể xóa giáo viên chủ lớp");
    }

    await classroomMemberRepo.removeMember(classroomId, studentId);

    return {
        message: "Đã xóa thành viên khỏi lớp",
    };
}