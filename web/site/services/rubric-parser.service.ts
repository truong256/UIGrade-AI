// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import type { RubricCriterion } from "@/lib/grading-contract";
import { safeParseAiJson } from "@/lib/ai-json";
import {
    createRubricCriterion,
    inferRubricGradingSource,
    isRubricTotalMetadata,
    normalizeRubricTotal,
    parseRubricTextFallback,
} from "@/lib/rubric-parsing";

export type ParsedRubricResult = {
    rubric: RubricCriterion[];
    source: "gemini" | "fallback";
    warnings: string[];
};

type ParseRubricInput = {
    rubricText: string;
    maxScore: number;
    assignmentTitle?: string;
    language?: string;
};

const RubricCriterionAiSchema = z.object({
    title: z.string().trim().min(1, "Tiêu chí phải có tiêu đề"),
    description: z.string().trim().min(1, "Tiêu chí phải có mô tả"),
    points: z.number().finite().positive("Điểm tiêu chí phải lớn hơn 0"),
}).strict();

const RubricAiResponseSchema = z.object({
    criteria: z.array(RubricCriterionAiSchema).min(1, "Rubric phải chứa ít nhất 1 tiêu chí"),
    warnings: z.array(z.string()).optional(),
}).strict();

function classifyGeminiError(error: unknown): string {
    if (!error) return "Không thể tạo nội dung bằng AI lúc này. Bạn vẫn có thể tiếp tục tạo bài tập thủ công.";
    const message = error instanceof Error ? error.message : String(error);
    const lower = message.toLowerCase();

    if (lower.includes("abort") || lower.includes("timeout")) {
        return "Thời gian kết nối đến AI quá hạn (Timeout). Bạn vẫn có thể tiếp tục tạo bài tập thủ công.";
    }
    if (lower.includes("api_key") || lower.includes("api key") || lower.includes("401") || lower.includes("unauthenticated")) {
        return "Khóa API Gemini không hợp lệ hoặc chưa được cấu hình. Bạn vẫn có thể tiếp tục tạo bài tập thủ công.";
    }
    if (lower.includes("403") || lower.includes("permission_denied")) {
        return "Khóa API Gemini không có quyền truy cập mô hình đã chọn. Bạn vẫn có thể tiếp tục tạo bài tập thủ công.";
    }
    if (lower.includes("429") || lower.includes("quota") || lower.includes("resource_exhausted") || lower.includes("rate limit")) {
        return "Hạn mức gọi AI tạm thời bị quá tải (Rate limit/Quota exceeded). Bạn vẫn có thể tiếp tục tạo bài tập thủ công.";
    }

    return "Không thể tạo nội dung bằng AI lúc này. Bạn vẫn có thể tiếp tục tạo bài tập thủ công.";
}

function validateRubric(rubric: RubricCriterion[]) {
    const filtered = rubric.filter((item) => Number(item.maxPoints || 0) > 0);
    const seen = new Set<string>();

    for (const item of filtered) {
        const code = String(item.code || "").trim().toLowerCase();
        if (!code) {
            throw new Error("Rubric có tiêu chí thiếu code");
        }
        if (seen.has(code)) {
            throw new Error(`Rubric có code bị trùng: ${item.code}`);
        }
        seen.add(code);
    }

    return filtered;
}

export async function parseRubricTextWithAI(
    input: ParseRubricInput
): Promise<ParsedRubricResult> {
    const fallback = parseRubricTextFallback(input.rubricText, input.maxScore);

    if (!input.rubricText.trim()) {
        return {
            rubric: fallback.rubric,
            source: "fallback",
            warnings: [...fallback.warnings, "Rubric text đang trống, dùng rubric fallback."],
        };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return {
            rubric: fallback.rubric,
            source: "fallback",
            warnings: [
                ...fallback.warnings,
                "Không thể tạo nội dung bằng AI lúc này do chưa cấu hình GEMINI_API_KEY. Bạn vẫn có thể tiếp tục tạo bài tập thủ công.",
            ],
        };
    }

    try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
Bạn là bộ chuẩn hóa rubric cho hệ thống AutoGrade.

NHIỆM VỤ:
- Đọc rubric text thô của giáo viên.
- Tách rubric thành các tiêu chí chấm độc lập.
- Giữ nguyên ý nghĩa và điểm số.
- Giữ nguyên thứ tự các tiêu chí như rubric gốc.
- Chuẩn hóa cho bài lập trình, đặc biệt phù hợp Android Kotlin Compose nếu ngữ cảnh liên quan.
- Nếu rubric có cấu trúc kiểu "Câu 2" rồi mới có "a, b, c" thì KHÔNG tạo tiêu chí thừa cho dòng mô tả trung gian.
- Mỗi criterion chỉ có title, description và points.
- points phải là số dương thể hiện điểm tối đa của criterion; không lấy các số trong nội dung mô tả.
- Không tạo criterion từ dòng Tổng/Total.
- Tổng points sau khi parse nên bằng ${input.maxScore}.
- Trả về DUY NHẤT JSON hợp lệ, không markdown code fences.

JSON phải có dạng:
{
  "criteria": [
    {
      "title": "string",
      "description": "string",
      "points": 1
    }
  ],
  "warnings": ["string"]
}
        `.trim();

        // 15s timeout to prevent hanging connections
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error("Timeout: Yêu cầu AI quá 15 giây")), 15000);
        });

        const generatePromise = ai.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        { text: `ASSIGNMENT TITLE:\n${input.assignmentTitle || "Bài tập"}` },
                        { text: `TARGET MAX SCORE:\n${input.maxScore}` },
                        { text: `RUBRIC TEXT:\n${input.rubricText}` },
                    ],
                },
            ],
            config: {
                temperature: 0.1,
            },
        });

        const response = await Promise.race([generatePromise, timeoutPromise]);
        const parseResult = safeParseAiJson(response.text || "", RubricAiResponseSchema);

        if (!parseResult.success) {
            return {
                rubric: fallback.rubric,
                source: "fallback",
                warnings: [
                    ...fallback.warnings,
                    parseResult.error,
                    "Không thể tạo nội dung bằng AI lúc này. Bạn vẫn có thể tiếp tục tạo bài tập thủ công.",
                ],
            };
        }

        const items = parseResult.data.criteria.filter(
            (item) => !isRubricTotalMetadata(item.title, item.description)
        );
        if (!items.length) {
            return {
                rubric: fallback.rubric,
                source: "fallback",
                warnings: [
                    ...fallback.warnings,
                    "AI không trả về tiêu chí hợp lệ, dùng rubric fallback.",
                ],
            };
        }

        let parsedCriteria = items.map((item, index) =>
            createRubricCriterion({
                title: item.title,
                description: item.description,
                points: item.points,
                index,
                gradingSource: inferRubricGradingSource(`${item.title} ${item.description}`),
            })
        );

        if (fallback.usedExplicitPoints && fallback.complete) {
            if (fallback.rubric.length !== parsedCriteria.length) {
                return {
                    rubric: fallback.rubric,
                    source: "fallback",
                    warnings: [
                        ...fallback.warnings,
                        "Số tiêu chí AI không khớp rubric gốc, giữ kết quả parser an toàn.",
                    ],
                };
            }

            parsedCriteria = fallback.rubric.map((criterion) => ({
                ...criterion,
                gradingSource: inferRubricGradingSource(
                    `${criterion.title} ${criterion.description || ""}`
                ),
            }));
        }

        const validated = validateRubric(parsedCriteria);
        const normalized = normalizeRubricTotal(validated, input.maxScore);

        return {
            rubric: normalized.rubric,
            source: "gemini",
            warnings: [
                ...(Array.isArray(parseResult.data.warnings) ? parseResult.data.warnings : []),
                ...(fallback.usedExplicitPoints && fallback.complete ? fallback.warnings : []),
                ...normalized.warnings,
            ],
        };
    } catch (error) {
        const errorMsg = classifyGeminiError(error);
        return {
            rubric: fallback.rubric,
            source: "fallback",
            warnings: [...fallback.warnings, errorMsg],
        };
    }
}
