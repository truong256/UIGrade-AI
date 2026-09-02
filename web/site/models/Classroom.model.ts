import mongoose, { Schema, model, models } from "mongoose";

const ClassroomSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        semester: {
            type: String,
            enum: ["HK1", "HK2", "HK3"],
            default: "HK1",
        },
        academicYear: {
            type: String,
            default: "2025-2026",
            trim: true,
        },
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        studentIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        status: {
            type: String,
            enum: ["active", "archived"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);

const Classroom = models.Classroom || model("Classroom", ClassroomSchema);

export default Classroom;