import mongoose, { Schema, model, models } from "mongoose";

const EmailNotificationLogSchema = new Schema(
    {
        uniqueKey: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ["new_assignment", "deadline_before", "deadline_due"],
            required: true,
        },
        channel: {
            type: String,
            enum: ["email"],
            default: "email",
        },
        assignmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Assignment",
            required: true,
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        meta: {
            type: Schema.Types.Mixed,
            default: {},
        },
        sentAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

EmailNotificationLogSchema.index({ uniqueKey: 1 }, { unique: true });
EmailNotificationLogSchema.index({ assignmentId: 1, studentId: 1, type: 1 });

const EmailNotificationLog =
    models.EmailNotificationLog ||
    model("EmailNotificationLog", EmailNotificationLogSchema);

export default EmailNotificationLog;
