import { z } from "zod";

const isoDate = z
    .string()
    .trim()
    .min(1, "Ngày giờ không được để trống")
    .refine((value) => !Number.isNaN(new Date(value).getTime()), {
        message: "Ngày giờ không hợp lệ",
    });

const gradingSourceSchema = z.enum(["runner", "ai", "hybrid", "manual"]);

const rubricCriterionSchema = z.object({
    code: z.string().trim().min(1, "Mỗi tiêu chí phải có mã code"),
    title: z.string().trim().min(1, "Mỗi tiêu chí phải có tiêu đề"),
    description: z.string().trim().default(""),
    maxPoints: z.number().min(0.5, "Điểm tối đa mỗi tiêu chí phải lớn hơn 0"),
    gradingSource: gradingSourceSchema.default("manual"),
    requiredEvidence: z.array(z.string().trim()).default([]),
    passThreshold: z.number().min(0).optional().nullable(),
    notes: z.string().trim().default(""),
});

const submissionPolicySchema = z.object({
    acceptedFileTypes: z.array(z.string().trim()).default(["zip"]),
    maxFileSizeMb: z.number().int().min(1).default(256),
    maxAttempts: z.number().int().min(1).default(1),
    requireZip: z.boolean().default(true),
    allowGithubUrl: z.boolean().default(false),
    allowScreenshots: z.boolean().default(true),
});
const uiScreenSchema = z.object({
    screenKey: z.string().trim().min(1),
    label: z.string().trim().default(""),
    baselineUrl: z.string().trim().default(""),
    threshold: z.number().min(0).max(100).default(70),
});

const uiActionSchema = z.object({
    type: z.enum(["wait", "screenshot", "tapTag", "textTag", "pressBack"]),
    ms: z.number().optional(),
    screenKey: z.string().trim().optional(),
    tag: z.string().trim().optional(),
    value: z.string().trim().optional(),
});
const runnerConfigSchema = z.object({
    requiredFiles: z.array(z.string().trim()).default([]),
    entryFiles: z.array(z.string().trim()).default([]),
    buildCommand: z.string().trim().default(""),
    runCommand: z.string().trim().default(""),
    deviceProfiles: z.array(z.string().trim()).default([]),
    screenshotTargets: z.array(z.string().trim()).default([]),
    scenarioId: z.string().trim().default(""),
    scenarioName: z.string().trim().default(""),
    uiScreens: z.array(uiScreenSchema).default([]),
    uiActions: z.array(uiActionSchema).default([]),
});

const aiConfigSchema = z.object({
    enabled: z.boolean().default(true),
    model: z.string().trim().default("gemini-3.8-flash"),
    temperature: z.number().min(0).max(2).default(0.2),
    feedbackLanguage: z.string().trim().default("vi"),
});

const DEFAULT_SUBMISSION_POLICY = {
    acceptedFileTypes: ["zip"],
    maxFileSizeMb: 256,
    maxAttempts: 1,
    requireZip: true,
    allowGithubUrl: false,
    allowScreenshots: true,
} satisfies z.input<typeof submissionPolicySchema>;

const DEFAULT_RUNNER_CONFIG = {
    requiredFiles: [],
    entryFiles: [],
    buildCommand: "",
    runCommand: "",
    deviceProfiles: [],
    screenshotTargets: [],
    scenarioId: "",
    scenarioName: "",
    uiScreens: [],
    uiActions: [],
} satisfies z.input<typeof runnerConfigSchema>;

const DEFAULT_AI_CONFIG = {
    enabled: true,
    model: "gemini-3.8-flash",
    temperature: 0.2,
    feedbackLanguage: "vi",
} satisfies z.input<typeof aiConfigSchema>;

const assignmentBaseSchema = z.object({
    title: z.string().trim().min(3, "Tên bài tập phải có ít nhất 3 ký tự"),
    classroomId: z.string().trim().min(1, "Vui lòng chọn lớp học"),
    language: z.string().trim().default("kotlin"),
    description: z.string().trim().min(3, "Mô tả bài tập quá ngắn"),
    rubricText: z.string().trim().optional().default(""),
    rubric: z.array(rubricCriterionSchema).min(1, "Rubric phải có ít nhất 1 tiêu chí"),
    submissionPolicy: submissionPolicySchema.default(DEFAULT_SUBMISSION_POLICY),
    runnerConfig: runnerConfigSchema.default(DEFAULT_RUNNER_CONFIG),
    aiConfig: aiConfigSchema.default(DEFAULT_AI_CONFIG),
    startAt: isoDate,
    dueAt: isoDate,
    allowLateSubmit: z.boolean().default(false),
    allowResubmit: z.boolean().default(false),
    latePenaltyPercent: z.number().min(0).max(100).default(0),
    maxScore: z.number().min(0.5, "Điểm tối đa phải lớn hơn 0").default(10),
    status: z.enum(["draft", "published"]).default("published"),
});

function refineAssignmentData<T extends {
    rubric?: Array<{ maxPoints: number }>;
    maxScore?: number;
    startAt?: string;
    dueAt?: string;
    allowLateSubmit?: boolean;
    latePenaltyPercent?: number;
}>(data: T, ctx: z.RefinementCtx) {
    // check trùng code
    if (Array.isArray(data.rubric)) {
        const seenCodes = new Set<string>();

        data.rubric.forEach((item: any, index: number) => {
            const code = String(item?.code || "").trim().toLowerCase();
            if (!code) return;

            if (seenCodes.has(code)) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `Rubric có code bị trùng: ${item.code}`,
                    path: ["rubric", index, "code"],
                });
            }

            seenCodes.add(code);
        });
    }
    if (data.startAt && data.dueAt) {
        const startAt = new Date(data.startAt).getTime();
        const dueAt = new Date(data.dueAt).getTime();

        if (dueAt <= startAt) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Hạn nộp phải sau ngày bắt đầu",
                path: ["dueAt"],
            });
        }
    }

    if (Array.isArray(data.rubric) && typeof data.maxScore === "number") {
        const rubricTotal = data.rubric.reduce(
            (sum, item) => sum + Number(item.maxPoints || 0),
            0
        );

        if (Math.abs(rubricTotal - data.maxScore) > 0.001) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Tổng điểm rubric (${rubricTotal}) phải bằng maxScore`,
                path: ["maxScore"],
            });
        }
    }

    if (!data.allowLateSubmit && Number(data.latePenaltyPercent || 0) > 0) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Chỉ được đặt phạt nộp trễ khi cho phép nộp trễ",
            path: ["latePenaltyPercent"],
        });
    }
}

export const createAssignmentSchema = assignmentBaseSchema.superRefine(
    refineAssignmentData
);

export const updateAssignmentSchema = assignmentBaseSchema
    .partial()
    .extend({
        submissionPolicy: submissionPolicySchema.partial().optional(),
        runnerConfig: runnerConfigSchema.partial().optional(),
        aiConfig: aiConfigSchema.partial().optional(),
        status: z.enum(["draft", "published", "closed"]).optional(),
    })
    .superRefine(refineAssignmentData);

export type CreateAssignmentPayload = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentPayload = z.infer<typeof updateAssignmentSchema>;

export function parseBoolean(value: FormDataEntryValue | null) {
    return String(value ?? "false") === "true";
}

export function parseNumber(value: FormDataEntryValue | null, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function parseJsonField<T>(
    value: FormDataEntryValue | null,
    fallback: T,
    fieldName: string
): T {
    if (value === null || String(value).trim() === "") {
        return fallback;
    }

    try {
        return JSON.parse(String(value)) as T;
    } catch {
        throw new Error(`${fieldName} không đúng định dạng JSON`);
    }
}

export function extractAssignmentPayload(formData: FormData) {
    return createAssignmentSchema.parse({
        title: String(formData.get("title") ?? ""),
        classroomId: String(formData.get("classroomId") ?? ""),
        language: String(formData.get("language") ?? "kotlin"),
        description: String(formData.get("description") ?? ""),
        rubricText: String(formData.get("rubricText") ?? ""),
        rubric: parseJsonField(formData.get("rubric"), [], "rubric"),
        submissionPolicy: parseJsonField(
            formData.get("submissionPolicy"),
            DEFAULT_SUBMISSION_POLICY,
            "submissionPolicy"
        ),
        runnerConfig: parseJsonField(
            formData.get("runnerConfig"),
            DEFAULT_RUNNER_CONFIG,
            "runnerConfig"
        ),
        aiConfig: parseJsonField(
            formData.get("aiConfig"),
            DEFAULT_AI_CONFIG,
            "aiConfig"
        ),
        startAt: String(formData.get("startAt") ?? ""),
        dueAt: String(formData.get("dueAt") ?? ""),
        allowLateSubmit: parseBoolean(formData.get("allowLateSubmit")),
        allowResubmit: parseBoolean(formData.get("allowResubmit")),
        latePenaltyPercent: parseNumber(formData.get("latePenaltyPercent"), 0),
        maxScore: parseNumber(formData.get("maxScore"), 10),
        status: String(formData.get("status") ?? "published"),
    });
}

export function extractAssignmentUpdatePayload(formData: FormData) {
    return updateAssignmentSchema.parse({
        title: formData.get("title") ? String(formData.get("title")) : undefined,
        classroomId: formData.get("classroomId")
            ? String(formData.get("classroomId"))
            : undefined,
        language: formData.get("language")
            ? String(formData.get("language"))
            : undefined,
        description: formData.get("description")
            ? String(formData.get("description"))
            : undefined,
        rubricText: formData.get("rubricText")
            ? String(formData.get("rubricText"))
            : undefined,
        rubric: formData.get("rubric")
            ? parseJsonField(formData.get("rubric"), [], "rubric")
            : undefined,
        submissionPolicy: formData.get("submissionPolicy")
            ? parseJsonField(formData.get("submissionPolicy"), {}, "submissionPolicy")
            : undefined,
        runnerConfig: formData.get("runnerConfig")
            ? parseJsonField(formData.get("runnerConfig"), {}, "runnerConfig")
            : undefined,
        aiConfig: formData.get("aiConfig")
            ? parseJsonField(formData.get("aiConfig"), {}, "aiConfig")
            : undefined,
        startAt: formData.get("startAt")
            ? String(formData.get("startAt"))
            : undefined,
        dueAt: formData.get("dueAt")
            ? String(formData.get("dueAt"))
            : undefined,
        allowLateSubmit:
            formData.get("allowLateSubmit") !== null
                ? parseBoolean(formData.get("allowLateSubmit"))
                : undefined,
        allowResubmit:
            formData.get("allowResubmit") !== null
                ? parseBoolean(formData.get("allowResubmit"))
                : undefined,
        latePenaltyPercent:
            formData.get("latePenaltyPercent") !== null
                ? parseNumber(formData.get("latePenaltyPercent"), 0)
                : undefined,
        maxScore:
            formData.get("maxScore") !== null
                ? parseNumber(formData.get("maxScore"), 10)
                : undefined,
        status: formData.get("status")
            ? String(formData.get("status"))
            : undefined,
    });
}