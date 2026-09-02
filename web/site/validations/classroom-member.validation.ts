import type {
    TClassroomRoleInClass,
} from "@/models/Classroom-member.model";

type TUpdateMemberAction = "approve" | "change-role";

type JoinClassPayload = {
    joinCode?: unknown;
};

type AddStudentPayload = {
    studentId?: unknown;
};

type UpdateMemberPayload = {
    action?: unknown;
    roleInClass?: unknown;
};

type ValidatedUpdateMemberPayload =
    | {
    action: "approve";
    roleInClass?: TClassroomRoleInClass;
}
    | {
    action: "change-role";
    roleInClass: TClassroomRoleInClass;
};

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function toPayload<T extends Record<string, unknown>>(
    value: unknown,
): Partial<T> {
    if (!isObject(value)) {
        return {};
    }

    return value as Partial<T>;
}

export class ValidationError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number = 400,
    ) {
        super(message);
        this.name = "ValidationError";
    }
}

export function validateJoinClassPayload(
    body: unknown,
): { joinCode: string } {
    const payload = toPayload<JoinClassPayload>(body);
    const joinCode = String(payload.joinCode ?? "").trim().toUpperCase();

    if (!joinCode) {
        throw new ValidationError("Mã lớp không được để trống");
    }

    return { joinCode };
}

export function validateAddStudentPayload(
    body: unknown,
): { studentId: string } {
    const payload = toPayload<AddStudentPayload>(body);
    const studentId = String(payload.studentId ?? "").trim();

    if (!studentId) {
        throw new ValidationError("studentId không được để trống");
    }

    return { studentId };
}

export function validateUpdateMemberPayload(
    body: unknown,
): ValidatedUpdateMemberPayload {
    const payload = toPayload<UpdateMemberPayload>(body);
    const action = String(payload.action ?? "").trim() as TUpdateMemberAction;
    const roleInClassValue = String(payload.roleInClass ?? "").trim();

    if (!action) {
        throw new ValidationError("action không được để trống");
    }

    if (!["approve", "change-role"].includes(action)) {
        throw new ValidationError("action không hợp lệ");
    }

    if (action === "approve") {
        return { action };
    }

    if (!roleInClassValue) {
        throw new ValidationError("roleInClass không được để trống");
    }

    if (!["teacher", "student"].includes(roleInClassValue)) {
        throw new ValidationError("roleInClass không hợp lệ");
    }

    return {
        action: "change-role",
        roleInClass: roleInClassValue as TClassroomRoleInClass,
    };
}