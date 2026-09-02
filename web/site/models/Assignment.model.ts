import mongoose, { Schema, model, models } from "mongoose";

const AssignmentAttachmentSchema = new Schema(
    {
        kind: {
            type: String,
            enum: ["resource", "rubric", "template"],
            default: "resource",
        },
        originalName: {
            type: String,
            required: true,
            trim: true,
        },
        storedName: {
            type: String,
            required: true,
            trim: true,
        },
        url: {
            type: String,
            required: true,
            trim: true,
        },
        mimeType: {
            type: String,
            default: "application/octet-stream",
            trim: true,
        },
        size: {
            type: Number,
            default: 0,
        },
    },
    { _id: false }
);

const RubricCriterionSchema = new Schema(
    {
        code: {
            type: String,
            required: true,
            trim: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        maxPoints: {
            type: Number,
            required: true,
            min: 0,
        },
        gradingSource: {
            type: String,
            enum: ["runner", "ai", "hybrid", "manual"],
            default: "manual",
            required: true,
        },
        requiredEvidence: {
            type: [String],
            default: [],
        },
        passThreshold: {
            type: Number,
            default: null,
        },
        notes: {
            type: String,
            default: "",
            trim: true,
        },
    },
    { _id: false }
);

const SubmissionPolicySchema = new Schema(
    {
        acceptedFileTypes: {
            type: [String],
            default: ["zip"],
        },
        maxFileSizeMb: {
            type: Number,
            default: 100,
            min: 1,
        },
        maxAttempts: {
            type: Number,
            default: 1,
            min: 1,
        },
        requireZip: {
            type: Boolean,
            default: true,
        },
        allowGithubUrl: {
            type: Boolean,
            default: false,
        },
        allowScreenshots: {
            type: Boolean,
            default: true,
        },
    },
    { _id: false }
);

const UiScreenSchema = new Schema(
    {
        screenKey: {
            type: String,
            required: true,
            trim: true,
        },
        label: {
            type: String,
            default: "",
            trim: true,
        },
        baselineUrl: {
            type: String,
            default: "",
            trim: true,
        },
        threshold: {
            type: Number,
            default: 70,
        },
    },
    { _id: false }
);

const UiActionSchema = new Schema(
    {
        type: {
            type: String,
            enum: ["wait", "screenshot", "tapTag", "textTag", "pressBack"],
            required: true,
        },
        ms: {
            type: Number,
            default: 1000,
        },
        screenKey: {
            type: String,
            default: "",
            trim: true,
        },
        tag: {
            type: String,
            default: "",
            trim: true,
        },
        value: {
            type: String,
            default: "",
            trim: true,
        },
    },
    { _id: false }
);

const RunnerConfigSchema = new Schema(
    {
        requiredFiles: {
            type: [String],
            default: [],
        },
        entryFiles: {
            type: [String],
            default: [],
        },
        buildCommand: {
            type: String,
            default: "",
            trim: true,
        },
        runCommand: {
            type: String,
            default: "",
            trim: true,
        },
        deviceProfiles: {
            type: [String],
            default: [],
        },
        screenshotTargets: {
            type: [String],
            default: [],
        },
        scenarioId: {
            type: String,
            default: "",
            trim: true,
        },
        scenarioName: {
            type: String,
            default: "",
            trim: true,
        },
        uiScreens: {
            type: [UiScreenSchema],
            default: [],
        },
        uiActions: {
            type: [UiActionSchema],
            default: [],
        },
    },
    { _id: false }
);

const AiConfigSchema = new Schema(
    {
        enabled: {
            type: Boolean,
            default: true,
        },
        model: {
            type: String,
            default: process.env.GEMINI_MODEL || "gemini-3.7-flash",
            trim: true,
        },
        temperature: {
            type: Number,
            default: 0.2,
        },
        feedbackLanguage: {
            type: String,
            default: "vi",
            trim: true,
        },
    },
    { _id: false }
);

const AssignmentSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        classroomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Classroom",
            required: true,
        },
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        language: {
            type: String,
            default: "cpp",
            trim: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        rubricText: {
            type: String,
            default: "",
            trim: true,
        },
        rubric: {
            type: [RubricCriterionSchema],
            default: [],
        },
        submissionPolicy: {
            type: SubmissionPolicySchema,
            default: () => ({
                acceptedFileTypes: ["zip"],
                maxFileSizeMb: 256,
                maxAttempts: 1,
                requireZip: true,
                allowGithubUrl: false,
                allowScreenshots: true,
            }),
        },
        runnerConfig: {
            type: RunnerConfigSchema,
            default: () => ({}),
        },
        aiConfig: {
            type: AiConfigSchema,
            default: () => ({}),
        },
        attachments: {
            type: [AssignmentAttachmentSchema],
            default: [],
        },
        startAt: {
            type: Date,
            required: true,
        },
        dueAt: {
            type: Date,
            required: true,
        },
        allowLateSubmit: {
            type: Boolean,
            default: false,
        },
        allowResubmit: {
            type: Boolean,
            default: false,
        },
        latePenaltyPercent: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        maxScore: {
            type: Number,
            default: 10,
            min: 0,
        },
        status: {
            type: String,
            enum: ["draft", "published", "closed"],
            default: "published",
        },
    },
    {
        timestamps: true,
    }
);

AssignmentSchema.index({ classroomId: 1, status: 1, dueAt: 1 });
AssignmentSchema.index({ teacherId: 1, createdAt: -1 });

const Assignment =
    models.Assignment || model("Assignment", AssignmentSchema);

export default Assignment;