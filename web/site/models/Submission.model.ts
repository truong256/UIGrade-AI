import mongoose, { Schema, model, models } from "mongoose";

const SubmissionFileSchema = new Schema(
    {
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
        sourceGitUrl: {
            type: String,
            default: "",
            trim: true,
        },
    },
    { _id: false }
);

const AssignmentSnapshotSchema = new Schema(
    {
        assignmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Assignment",
            required: true,
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
        rubricText: {
            type: String,
            default: "",
            trim: true,
        },
        language: {
            type: String,
            default: "kotlin",
            trim: true,
        },
        version: {
            type: Number,
            default: 1,
        },
        maxScore: {
            type: Number,
            required: true,
            min: 0,
        },
        rubric: {
            type: [Schema.Types.Mixed],
            default: [],
        },
        attachments: {
            type: [Schema.Types.Mixed],
            default: [],
        },
        submissionPolicy: {
            type: Schema.Types.Mixed,
            default: {},
        },
        runnerConfig: {
            type: Schema.Types.Mixed,
            default: {},
        },
        aiConfig: {
            type: Schema.Types.Mixed,
            default: {},
        },
    },
    { _id: false }
);

const RunnerCheckSchema = new Schema(
    {
        code: { type: String, required: true, trim: true },
        label: { type: String, required: true, trim: true },
        criterionCode: { type: String, default: null, trim: true },
        status: {
            type: String,
            enum: ["passed", "failed", "warning", "not_run"],
            required: true,
        },
        score: { type: Number, default: null },
        maxScore: { type: Number, default: null },
        message: { type: String, default: null, trim: true },
        evidence: { type: [String], default: [] },
    },
    { _id: false }
);

const RunnerArtifactSchema = new Schema(
    {
        label: { type: String, required: true, trim: true },
        path: { type: String, default: "", trim: true },
        url: { type: String, default: "", trim: true },
        mimeType: { type: String, default: "", trim: true },
    },
    { _id: false }
);

const RunnerLogSchema = new Schema(
    {
        label: { type: String, required: true, trim: true },
        content: { type: String, default: "" },
    },
    { _id: false }
);

const VisualComparisonSchema = new Schema(
    {
        screenKey: { type: String, default: "", trim: true },
        label: { type: String, default: "", trim: true },
        similarity: { type: Number, default: null },
        diffPercent: { type: Number, default: null },
        baselineUrl: { type: String, default: "", trim: true },
        studentUrl: { type: String, default: "", trim: true },
        diffUrl: { type: String, default: "", trim: true },
        message: { type: String, default: "", trim: true },
    },
    { _id: false }
);

const RunnerReportSchema = new Schema(
    {
        buildPassed: { type: Boolean, default: null },
        testPassed: { type: Boolean, default: null },
        visualSimilarity: { type: Number, default: null },
        accessibilityScore: { type: Number, default: null },
        checks: { type: [RunnerCheckSchema], default: [] },
        rawSummary: { type: String, default: null, trim: true },

        runtimeStatus: {
            type: String,
            enum: [
                "not_run",
                "project_invalid",
                "build_failed",
                "apk_missing",
                "install_failed",
                "launch_failed",
                "screenshot_failed",
                "comparison_failed",
                "passed",
            ],
            default: "not_run",
        },

        packageName: { type: String, default: null, trim: true },
        apkPath: { type: String, default: null, trim: true },

        screenshots: { type: [RunnerArtifactSchema], default: [] },
        artifacts: { type: [RunnerArtifactSchema], default: [] },
        logs: { type: [RunnerLogSchema], default: [] },

        visualComparison: {
            type: VisualComparisonSchema,
            default: null,
        },
        visualComparisons: {
            type: [VisualComparisonSchema],
            default: [],
        },
    },
    { _id: false }
);
const AiIssueSchema = new Schema(
    {
        severity: {
            type: String,
            enum: ["low", "medium", "high"],
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        evidence: {
            type: String,
            required: true,
            trim: true,
        },
        fix: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { _id: false }
);

const AiCriterionFeedbackSchema = new Schema(
    {
        criterionCode: { type: String, required: true, trim: true },
        awardedPoints: { type: Number, required: true, min: 0 },
        confidence: { type: Number, required: true, min: 0, max: 1 },
        summary: { type: String, required: true, trim: true },
        strengths: { type: [String], default: [] },
        issues: { type: [String], default: [] },
        suggestions: { type: [String], default: [] },
    },
    { _id: false }
);

const AiFeedbackSchema = new Schema(
    {
        summary: { type: String, default: "", trim: true },
        strengths: { type: [String], default: [] },
        issues: { type: [AiIssueSchema], default: [] },
        nextSteps: { type: [String], default: [] },
        criterionFeedback: { type: [AiCriterionFeedbackSchema], default: [] },
    },
    { _id: false }
);

const CriterionBreakdownSchema = new Schema(
    {
        criterionCode: { type: String, required: true, trim: true },
        title: { type: String, required: true, trim: true },
        gradingSource: {
            type: String,
            enum: ["runner", "ai", "hybrid", "manual"],
            required: true,
        },
        awardedPoints: { type: Number, required: true, min: 0 },
        maxPoints: { type: Number, required: true, min: 0 },
        note: { type: String, default: null, trim: true },
    },
    { _id: false }
);

const AutoGradeSchema = new Schema(
    {
        score: { type: Number, required: true, min: 0 },
        maxScore: { type: Number, required: true, min: 0 },
        normalizedScore: { type: Number, required: true, min: 0 },
        status: {
            type: String,
            enum: ["pending", "auto_graded", "needs_teacher_review", "overridden"],
            required: true,
        },
        needsTeacherReview: {
            type: Boolean,
            default: false,
        },
        criterionBreakdown: {
            type: [CriterionBreakdownSchema],
            default: [],
        },
        runnerEvidence: {
            type: RunnerReportSchema,
            default: null,
        },
        aiFeedback: {
            type: AiFeedbackSchema,
            default: null,
        },
        gradedAt: {
            type: Date,
            required: true,
        },
    },
    { _id: false }
);

const TeacherOverrideSchema = new Schema(
    {
        teacherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        score: {
            type: Number,
            required: true,
            min: 0,
        },
        comment: {
            type: String,
            required: true,
            trim: true,
        },
        overriddenAt: {
            type: Date,
            required: true,
        },
    },
    { _id: false }
);

const GradeHistorySchema = new Schema(
    {
        action: {
            type: String,
            enum: ["AUTO_GRADE", "AI_FEEDBACK_REFRESH", "TEACHER_OVERRIDE", "MANUAL_REVIEW"],
            required: true,
        },
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        note: {
            type: String,
            default: null,
            trim: true,
        },
        previousScore: {
            type: Number,
            default: null,
        },
        nextScore: {
            type: Number,
            default: null,
        },
        createdAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const SubmissionSchema = new Schema(
    {
        assignmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Assignment",
            required: true,
        },
        classroomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Classroom",
            required: true,
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        attemptNo: {
            type: Number,
            required: true,
            min: 1,
        },
        status: {
            type: String,
            enum: ["draft", "submitted", "late", "graded", "returned"],
            default: "submitted",
        },
        isLate: {
            type: Boolean,
            default: false,
        },
        latest: {
            type: Boolean,
            default: true,
        },
        repositoryUrl: {
            type: String,
            default: "",
            trim: true,
        },
        note: {
            type: String,
            default: "",
            trim: true,
        },

        // dữ liệu nộp bài
        sourceArchive: {
            originalName: { type: String, default: "" },
            storedName: { type: String, default: "" },
            url: { type: String, default: "" },
            mimeType: { type: String, default: "" },
            size: { type: Number, default: 0 },
        },
        screenshots: {
            type: [SubmissionFileSchema],
            default: [],
        },

        // giữ lại tương thích logic cũ
        files: {
            type: [SubmissionFileSchema],
            default: [],
        },

        // snapshot bài tập tại thời điểm nộp
        assignmentSnapshot: {
            type: AssignmentSnapshotSchema,
            default: null,
        },

        // kết quả chấm tự động
        autoGrade: {
            type: AutoGradeSchema,
            default: null,
        },

        // override của giáo viên
        teacherOverride: {
            type: TeacherOverrideSchema,
            default: null,
        },

        finalScore: {
            type: Number,
            default: null,
        },
        gradeStatus: {
            type: String,
            enum: ["pending", "auto_graded", "needs_teacher_review", "overridden"],
            default: "pending",
        },
        gradeHistory: {
            type: [GradeHistorySchema],
            default: [],
        },

        submittedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

SubmissionSchema.index({ assignmentId: 1, studentId: 1, latest: 1 });
SubmissionSchema.index({ studentId: 1, submittedAt: -1 });
SubmissionSchema.index({ classroomId: 1, submittedAt: -1 });
SubmissionSchema.index({ gradeStatus: 1, finalScore: -1 });

const Submission =
    models.Submission || model("Submission", SubmissionSchema);

export default Submission;