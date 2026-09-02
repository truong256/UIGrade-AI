import {
    ClassroomMemberModel,
    TClassroomMemberStatus,
    TClassroomRoleInClass,
} from "@/models/Classroom-member.model";
import ClassroomModel from "@/models/Classroom.model";
import UserModel from "@/models/User.model";
import {Types} from "mongoose";

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function findClassroomById(classroomId: string) {
    return ClassroomModel.findById(classroomId).lean();
}

export async function findClassroomByCode(code: string) {
    const regex = new RegExp(`^${escapeRegex(code.trim())}$`, "i");
    return ClassroomModel.findOne({ code: regex }).lean();
}

export async function findUserById(userId: string) {
    return UserModel.findById(userId)
        .select("_id name email studentCode role")
        .lean();
}

export async function findClassroomIdsByUserId(
    userId: string,
    options?: {
        status?: TClassroomMemberStatus;
        roleInClass?: TClassroomRoleInClass;
    }
) {
    const filter: Record<string, unknown> = { userId };

    if (options?.status) {
        filter.status = options.status;
    }

    if (options?.roleInClass) {
        filter.roleInClass = options.roleInClass;
    }

    const ids = await ClassroomMemberModel.find(filter).distinct("classroomId");
    return ids.map((id) => String(id));
}

export async function isTeacherInClass(classroomId: string, userId: string) {
    const owner = await ClassroomModel.exists({
        _id: classroomId,
        teacherId: userId,
    });

    if (owner) return true;

    const teacherMember = await ClassroomMemberModel.exists({
        classroomId,
        userId,
        roleInClass: "teacher",
        status: "active",
    });

    return !!teacherMember;
}

export async function findMember(classroomId: string, userId: string) {
    return ClassroomMemberModel.findOne({
        classroomId,
        userId,
    }).lean();
}

export async function createMember(params: {
    classroomId: string;
    userId: string;
    roleInClass?: TClassroomRoleInClass;
    status?: TClassroomMemberStatus;
}) {
    return ClassroomMemberModel.create({
        classroomId: params.classroomId,
        userId: params.userId,
        roleInClass: params.roleInClass || "student",
        status: params.status || "pending",
    });
}

export async function upsertMember(params: {
    classroomId: string;
    userId: string;
    roleInClass?: TClassroomRoleInClass;
    status?: TClassroomMemberStatus;
}) {
    return ClassroomMemberModel.findOneAndUpdate(
        {
            classroomId: params.classroomId,
            userId: params.userId,
        },
        {
            $set: {
                roleInClass: params.roleInClass || "student",
                status: params.status || "active",
            },
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
        }
    ).lean();
}

export async function listMembers(
    classroomId: string,
    status: TClassroomMemberStatus = "active"
) {
    return ClassroomMemberModel.find({
        classroomId,
        status,
    })
        .populate({
            path: "userId",
            select: "_id name email studentCode role",
        })
        .sort({ createdAt: -1 })
        .lean();
}

export async function searchAvailableStudents(
    classroomId: string,
    keyword: string
) {
    const cleanKeyword = keyword.trim();

    if (!cleanKeyword) return [];

    const classroom = await ClassroomModel.findById(classroomId)
        .select("teacherId")
        .lean();

    if (!classroom) return [];

    const existingMemberIds = await ClassroomMemberModel.find({
        classroomId,
    }).distinct("userId");

    const excludedIds = [...existingMemberIds];

    if (classroom.teacherId) {
        excludedIds.push(classroom.teacherId as never);
    }

    const regex = new RegExp(escapeRegex(cleanKeyword), "i");

    return UserModel.find({
        role: "User",
        _id: { $nin: excludedIds },
        $or: [{ name: regex }, { email: regex }, { studentCode: regex }],
    })
        .select("_id name email studentCode role")
        .limit(20)
        .lean();
}

export async function approveMember(classroomId: string, userId: string) {
    return ClassroomMemberModel.findOneAndUpdate(
        { classroomId, userId },
        { $set: { status: "active" } },
        { new: true }
    ).lean();
}

export async function updateMemberRole(
    classroomId: string,
    userId: string,
    roleInClass: TClassroomRoleInClass
) {
    return ClassroomMemberModel.findOneAndUpdate(
        { classroomId, userId },
        { $set: { roleInClass } },
        { new: true }
    ).lean();
}

export async function removeMember(classroomId: string, userId: string) {
    return ClassroomMemberModel.findOneAndDelete({
        classroomId,
        userId,
    }).lean();
}

export async function deleteManyByClassroomId(classroomId: string) {
    return ClassroomMemberModel.deleteMany({ classroomId });
}


// hiển thị số sinh viên trong accont
export async function countActiveStudentsByClassroomId(classroomId: string) {
    const normalizedId = Types.ObjectId.isValid(classroomId)
        ? new Types.ObjectId(classroomId)
        : classroomId;

    return ClassroomMemberModel.countDocuments({
        classroomId: normalizedId,
        status: "active",
        roleInClass: "student",
    });
}

export async function countActiveStudentsByClassroomIds(classroomIds: string[]) {
    const objectIds = classroomIds
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));

    if (!objectIds.length) {
        return {};
    }

    const rows = await ClassroomMemberModel.aggregate([
        {
            $match: {
                classroomId: { $in: objectIds },
                status: "active",
                roleInClass: "student",
            },
        },
        {
            $group: {
                _id: "$classroomId",
                count: { $sum: 1 },
            },
        },
    ]);

    return rows.reduce<Record<string, number>>((acc, row) => {
        acc[String(row._id)] = Number(row.count || 0);
        return acc;
    }, {});
}