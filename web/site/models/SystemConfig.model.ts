import { Schema, model, models } from "mongoose";

const JudgeConfigSchema = new Schema(
    {
        serverUrl: {
            type: String,
            default: "https://judge.autograde.io/v1/api",
            trim: true,
        },
        apiKey: {
            type: String,
            default: "",
            trim: true,
        },
    },
    { _id: false }
);

const DefaultLimitsSchema = new Schema(
    {
        maxRuntimeMs: {
            type: Number,
            default: 1000,
            min: 100,
        },
        maxMemoryMb: {
            type: Number,
            default: 256,
            min: 64,
        },
    },
    { _id: false }
);

const EmailConfigSchema = new Schema(
    {
        enabled: {
            type: Boolean,
            default: false,
        },
        smtpHost: {
            type: String,
            default: "smtp.gmail.com",
            trim: true,
        },
        smtpPort: {
            type: Number,
            default: 587,
            min: 1,
            max: 65535,
        },
        secure: {
            type: Boolean,
            default: false,
        },
        smtpUser: {
            type: String,
            default: "",
            trim: true,
            lowercase: true,
        },
        smtpPass: {
            type: String,
            default: "",
            trim: true,
        },
        senderName: {
            type: String,
            default: "AutoGrade",
            trim: true,
        },
        senderEmail: {
            type: String,
            default: "",
            trim: true,
            lowercase: true,
        },
        notifyOnNewAssignment: {
            type: Boolean,
            default: true,
        },
        notifyBeforeDue: {
            type: Boolean,
            default: true,
        },
        reminderBeforeHours: {
            type: [Number],
            default: [24, 3],
        },
        notifyAtDue: {
            type: Boolean,
            default: true,
        },
        testReceiverEmail: {
            type: String,
            default: "",
            trim: true,
            lowercase: true,
        },
    },
    { _id: false }
);

const BackupConfigSchema = new Schema(
    {
        backupFrequency: {
            type: String,
            default: "daily_0000",
            trim: true,
        },
        cloudProvider: {
            type: String,
            default: "google_drive",
            trim: true,
        },
    },
    { _id: false }
);

const SystemConfigSchema = new Schema(
    {
        key: {
            type: String,
            required: true,
            default: "default",
            unique: true,
            trim: true,
        },
        judge: {
            type: JudgeConfigSchema,
            default: () => ({}),
        },
        limits: {
            type: DefaultLimitsSchema,
            default: () => ({}),
        },
        email: {
            type: EmailConfigSchema,
            default: () => ({}),
        },
        backup: {
            type: BackupConfigSchema,
            default: () => ({}),
        },
    },
    {
        timestamps: true,
    }
);

SystemConfigSchema.index({ key: 1 }, { unique: true });

const SystemConfig =
    models.SystemConfig || model("SystemConfig", SystemConfigSchema);

export default SystemConfig;
