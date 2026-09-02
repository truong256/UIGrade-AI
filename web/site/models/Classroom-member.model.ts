import { Schema, model, models, Types } from "mongoose";

export type TClassroomRoleInClass = "teacher" | "student";
export type TClassroomMemberStatus = "pending" | "active";

export interface IClassroomMember {
    classroomId: Types.ObjectId;
    userId: Types.ObjectId;
    roleInClass: TClassroomRoleInClass;
    status: TClassroomMemberStatus;
    createdAt?: Date;
    updatedAt?: Date;
}

const classroomMemberSchema = new Schema<IClassroomMember>(
    {
        classroomId: {
            type: Schema.Types.ObjectId,
            ref: "Classroom",
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        roleInClass: {
            type: String,
            enum: ["teacher", "student"],
            default: "student",
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "active"],
            default: "pending",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

classroomMemberSchema.index({ classroomId: 1, userId: 1 }, { unique: true });

export const ClassroomMemberModel =
    models.ClassroomMember ||
    model<IClassroomMember>("ClassroomMember", classroomMemberSchema);