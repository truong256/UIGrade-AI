import type { Classroom } from "./classroom.type";

type IdLikeObject = {
    _id?: unknown;
    role?: unknown;
    toString?: () => string;
};

type ClassroomMemberLike = {
    _id?: unknown;
    user?: IdLikeObject | null;
    userId?: string | IdLikeObject | null;
    role?: unknown;
    memberRole?: unknown;
    status?: unknown;
    approvalStatus?: unknown;
    joinStatus?: unknown;
};

type ClassroomLike = Partial<Classroom> & {
    approvedStudentCount?: unknown;
    studentCount?: unknown;
    totalStudents?: unknown;
    teacher?: IdLikeObject | null;
    teacherId?: string | IdLikeObject | null;
    members?: unknown;
    students?: unknown;
    participants?: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function toId(value: unknown): string {
    if (!value) return "";

    if (typeof value === "string") return value;

    if (
        typeof value === "number" ||
        typeof value === "bigint" ||
        typeof value === "boolean"
    ) {
        return String(value);
    }

    if (isObject(value)) {
        const obj = value as IdLikeObject;

        if ("_id" in obj && obj._id) {
            return toId(obj._id);
        }

        if (typeof obj.toString === "function") {
            const str = obj.toString();
            if (str && str !== "[object Object]") {
                return str;
            }
        }
    }

    return String(value);
}

function toClassroomLike(
    raw: Classroom | Record<string, unknown> | null | undefined
): ClassroomLike | null {
    if (!raw || !isObject(raw)) {
        return null;
    }

    return raw as ClassroomLike;
}

function getTeacherId(classroom: ClassroomLike): string {
    const teacherIdValue = classroom.teacherId;

    if (isObject(teacherIdValue)) {
        return toId(teacherIdValue._id);
    }

    return toId(classroom.teacher?._id ?? teacherIdValue);
}

function getMembers(classroom: ClassroomLike): ClassroomMemberLike[] {
    if (Array.isArray(classroom.members)) {
        return classroom.members as ClassroomMemberLike[];
    }

    if (Array.isArray(classroom.students)) {
        return classroom.students as ClassroomMemberLike[];
    }

    if (Array.isArray(classroom.participants)) {
        return classroom.participants as ClassroomMemberLike[];
    }

    return [];
}

function getMemberUserId(member: ClassroomMemberLike): string {
    const user = isObject(member.user) ? member.user : null;
    const userIdValue = member.userId;

    if (isObject(userIdValue)) {
        return toId(user?._id ?? userIdValue._id ?? member._id);
    }

    return toId(user?._id ?? userIdValue ?? member._id);
}

function getMemberRole(member: ClassroomMemberLike): string {
    const user = isObject(member.user) ? member.user : null;
    const userIdValue = isObject(member.userId) ? member.userId : null;

    return String(
        member.role ??
        member.memberRole ??
        user?.role ??
        userIdValue?.role ??
        "student"
    ).toLowerCase();
}

function getMemberStatus(member: ClassroomMemberLike): string {
    return String(
        member.status ??
        member.approvalStatus ??
        member.joinStatus ??
        "approved"
    ).toLowerCase();
}

export function getApprovedStudentCountFromClassroom(
    raw: Classroom | Record<string, unknown> | null | undefined
): number {
    const classroom = toClassroomLike(raw);

    if (!classroom) {
        return 0;
    }

    const directCount = Number(
        classroom.approvedStudentCount ??
        classroom.studentCount ??
        classroom.totalStudents
    );

    if (Number.isFinite(directCount) && directCount >= 0) {
        return directCount;
    }

    const teacherId = getTeacherId(classroom);
    const members = getMembers(classroom);

    return members.filter((member) => {
        const memberUserId = getMemberUserId(member);
        const role = getMemberRole(member);
        const status = getMemberStatus(member);

        const isTeacher =
            role === "teacher" ||
            role === "owner" ||
            role === "chu_lop" ||
            role === "chủ lớp" ||
            (!!teacherId && memberUserId === teacherId);

        const isApproved =
            !status ||
            status === "approved" ||
            status === "active" ||
            status === "joined";

        return !isTeacher && isApproved;
    }).length;
}