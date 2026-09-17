// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
    stripMarkdownFences,
    extractBalancedJson,
    safeParseAiJson,
} from "@/lib/ai-json";

const sampleSchema = z.object({
    criteria: z.array(
        z.object({
            code: z.string(),
            title: z.string(),
            maxPoints: z.number(),
        })
    ),
    summary: z.string().optional(),
});

describe("AI JSON parsing & Schema Validation (safeParseAiJson)", () => {
    it("parses pure valid JSON successfully", () => {
        const json = JSON.stringify({
            criteria: [
                { code: "c1", title: "Build project", maxPoints: 2 },
            ],
            summary: "Good",
        });

        const result = safeParseAiJson(json, sampleSchema);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.criteria).toHaveLength(1);
            expect(result.data.criteria[0].title).toBe("Build project");
        }
    });

    it("parses JSON wrapped in markdown code fence (```json ... ```)", () => {
        const raw = "```json\n" +
            JSON.stringify({
                criteria: [
                    { code: "c1", title: "UI Layout", maxPoints: 3 },
                ],
            }) +
            "\n```";

        const result = safeParseAiJson(raw, sampleSchema);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.criteria[0].title).toBe("UI Layout");
        }
    });

    it("parses JSON preceded by conversational text", () => {
        const raw = "Dưới đây là kết quả phân tích theo cấu trúc JSON bạn yêu cầu:\n\n" +
            "```json\n" +
            "{\n  \"criteria\": [\n    {\"code\": \"c1\", \"title\": \"State\", \"maxPoints\": 4}\n  ]\n}\n" +
            "```\nHy vọng điều này giúp ích!";

        const result = safeParseAiJson(raw, sampleSchema);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.criteria[0].maxPoints).toBe(4);
        }
    });

    it("handles empty or whitespace-only response safely without crashing", () => {
        expect(safeParseAiJson("", sampleSchema)).toEqual({
            success: false,
            error: "Phản hồi từ AI rỗng.",
            rawText: "",
        });

        expect(safeParseAiJson("   \n\t  ", sampleSchema)).toEqual({
            success: false,
            error: "Phản hồi từ AI rỗng.",
            rawText: "   \n\t  ",
        });
    });

    it("rejects malformed JSON without crashing", () => {
        const malformed = '{"criteria": [{"code": "c1", "title": "Unclosed}';
        const result = safeParseAiJson(malformed, sampleSchema);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toMatch(/không hợp lệ|Không tìm thấy/);
        }
    });

    it("detects missing required property via Zod schema", () => {
        const missingProperty = JSON.stringify({
            // criteria is missing
            summary: "Missing criteria",
        });

        const result = safeParseAiJson(missingProperty, sampleSchema);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toContain("criteria");
        }
    });

    it("detects wrong property type via Zod schema", () => {
        const wrongType = JSON.stringify({
            criteria: [
                {
                    code: "c1",
                    title: "Title",
                    maxPoints: "two", // should be number!
                },
            ],
        });

        const result = safeParseAiJson(wrongType, sampleSchema);
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toContain("criteria.0.maxPoints");
        }
    });
    it("correctly strips fences with stripMarkdownFences utility", () => {
        const raw = "\`\`\`json\n{\"test\": 123}\n\`\`\`";
        expect(stripMarkdownFences(raw)).toBe('{"test": 123}');
    });

    it("extracts balanced JSON structures from text with extractBalancedJson", () => {
        const messy = "Here is the result: {\"key\": [1, 2, 3]} and some extra words";
        expect(extractBalancedJson(messy)).toBe('{"key": [1, 2, 3]}');
    });
});
