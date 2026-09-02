export type ClassroomSemester = "HK1" | "HK2" | "HK3";
export type ClassroomStatus = "active" | "archived";

export type ClassroomUserRef = {
    _id?: string;
    name?: string;
    email?: string;
    role?: string;
    studentCode?: string;
};

export type ClassroomTeacher = ClassroomUserRef;

export type ClassroomMember = {
    _id?: string;
    role?: string;
    status?: string;
    approvalStatus?: string;
    joinStatus?: string;
    memberRole?: string;
    user?: ClassroomUserRef | null;
    userId?: string | ClassroomUserRef | null;
};

export type ClassroomPendingRequest = {
    _id?: string;
    status?: string;
    approvalStatus?: string;
    joinStatus?: string;
    createdAt?: string;
    updatedAt?: string;
    user?: ClassroomUserRef | null;
    userId?: string | ClassroomUserRef | null;
};

export type Classroom = {
    _id: string;
    name: string;
    code: string;
    description?: string;

    semester: ClassroomSemester;
    academicYear: string;
    status: ClassroomStatus;

    approvedStudentCount?: number;
    studentCount?: number;
    totalStudents?: number;

    teacher?: ClassroomTeacher | null;
    teacherId?: string | ClassroomTeacher | null;

    members?: ClassroomMember[];
    students?: ClassroomMember[];
    participants?: ClassroomMember[];
    pendingRequests?: ClassroomPendingRequest[];

    createdAt?: string;
    updatedAt?: string;
};