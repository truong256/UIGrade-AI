import { z } from "zod";

export const createSubmissionSchema = z.object({
    assignmentId: z.string().trim().min(1, "Thiếu assignmentId"),
    repositoryUrl: z
        .string()
        .trim()
        .optional()
        .default("")
        .refine((value) => !value || /^https?:\/\//i.test(value), {
            message: "Link repository phải bắt đầu bằng http:// hoặc https://",
        }),
    note: z.string().trim().optional().default(""),
    action: z.enum(["draft", "submit"]).default("submit"),
});

export type CreateSubmissionPayload = z.infer<typeof createSubmissionSchema>;

export function extractSubmissionPayload(formData: FormData) {
    return createSubmissionSchema.parse({
        assignmentId: String(formData.get("assignmentId") ?? ""),
        repositoryUrl: String(formData.get("repositoryUrl") ?? ""),
        note: String(formData.get("note") ?? ""),
        action: String(formData.get("action") ?? "submit"),
    });
}