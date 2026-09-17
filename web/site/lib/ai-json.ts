// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { z } from "zod";

/**
 * Strips markdown code fences (e.g. ```json ... ``` or ``` ... ```)
 * and conversational prefixes like "Here is the JSON:".
 */
export function stripMarkdownFences(raw: string): string {
    if (!raw) return "";

    let text = raw.trim();

    // Match code block ```json ... ``` or ``` ... ```
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch && codeBlockMatch[1]) {
        text = codeBlockMatch[1].trim();
    }

    // Remove leading conversational text before the first '{' or '['
    const firstBrace = text.indexOf("{");
    const firstBracket = text.indexOf("[");

    let startIndex = -1;
    if (firstBrace >= 0 && firstBracket >= 0) {
        startIndex = Math.min(firstBrace, firstBracket);
    } else if (firstBrace >= 0) {
        startIndex = firstBrace;
    } else if (firstBracket >= 0) {
        startIndex = firstBracket;
    }

    if (startIndex > 0) {
        text = text.slice(startIndex).trim();
    }

    return text;
}

/**
 * Extracts a balanced JSON object or array string from mixed text,
 * correctly ignoring braces inside string literals and escaped quotes.
 */
export function extractBalancedJson(text: string): string | null {
    if (!text) return null;

    const trimmed = stripMarkdownFences(text);

    // Try parsing the stripped text directly first
    try {
        JSON.parse(trimmed);
        return trimmed;
    } catch {
        // Fall back to balanced scanner
    }

    const startChar = trimmed[0];
    if (startChar !== "{" && startChar !== "[") {
        return null;
    }

    const endChar = startChar === "{" ? "}" : "]";
    let depth = 0;
    let inString = false;
    let isEscaped = false;

    for (let i = 0; i < trimmed.length; i++) {
        const char = trimmed[i];

        if (isEscaped) {
            isEscaped = false;
            continue;
        }

        if (char === "\\") {
            isEscaped = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
            continue;
        }

        if (!inString) {
            if (char === startChar) {
                depth++;
            } else if (char === endChar) {
                depth--;
                if (depth === 0) {
                    return trimmed.slice(0, i + 1);
                }
            }
        }
    }

    return null;
}

export type ParseAiJsonResult<T> =
    | { success: true; data: T }
    | { success: false; error: string; rawText: string };

/**
 * Safely parses AI output:
 * 1. Validates non-empty
 * 2. Normalizes fences and prefixes
 * 3. Extracts balanced JSON
 * 4. Parses JSON safely without throwing
 * 5. Runs Zod schema validation (if schema provided)
 */
export function safeParseAiJson<T = unknown>(
    rawText: string | null | undefined,
    schema?: z.ZodType<T>
): ParseAiJsonResult<T> {
    if (!rawText || !rawText.trim()) {
        return {
            success: false,
            error: "Phản hồi từ AI rỗng.",
            rawText: rawText || "",
        };
    }

    const extracted = extractBalancedJson(rawText);
    if (!extracted) {
        return {
            success: false,
            error: "Không tìm thấy cấu trúc JSON hợp lệ trong phản hồi của AI.",
            rawText,
        };
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(extracted);
    } catch (parseError) {
        return {
            success: false,
            error: `Định dạng JSON từ AI không hợp lệ: ${parseError instanceof Error ? parseError.message : "Cú pháp sai"}`,
            rawText,
        };
    }

    if (!schema) {
        return { success: true, data: parsed as T };
    }

    const validation = schema.safeParse(parsed);
    if (!validation.success) {
        const errorDetails = validation.error.issues
            .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
            .join("; ");

        return {
            success: false,
            error: `Dữ liệu AI trả về không đúng cấu trúc yêu cầu: ${errorDetails}`,
            rawText,
        };
    }

    return { success: true, data: validation.data };
}
