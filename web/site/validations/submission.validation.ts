// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { z } from "zod";
import {
    MAX_REPOSITORY_URL_LENGTH,
    MAX_SUBMISSION_NOTE_LENGTH,
} from "@/lib/submission-limits";

export const createSubmissionSchema = z.object({
    assignmentId: z.string().trim().uuid("Mã bài tập không hợp lệ"),
    repositoryUrl: z
        .string()
        .trim()
        .max(MAX_REPOSITORY_URL_LENGTH, "Link repository quá dài")
        .optional()
        .default("")
        .refine((value) => !value || /^https:\/\//i.test(value), {
            message: "Link repository phải sử dụng HTTPS",
        }),
    note: z.string().trim().max(MAX_SUBMISSION_NOTE_LENGTH, "Ghi chú không được vượt quá 20.000 ký tự").optional().default(""),
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
