import { GoogleGenAI } from "@google/genai";
import type { RubricCriterion } from "@/lib/grading-contract";

export type ParsedRubricResult = {
    rubric: RubricCriterion[];
    source: "gemini" | "heuristic";
    warnings: string[];
};

type ParseRubricInput = {
    rubricText: string;
    maxScore: number;
    assignmentTitle?: string;
    language?: string;
};

function slugifyCriterionCode(value: string) {
    return value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "") || "criterion";
}

function inferGradingSource(text: string): RubricCriterion["gradingSource"] {
    const normalized = text.toLowerCase();

    if (
        /(build|test|runner|required file|readme|cấu trúc|structure|gradle|manifest)/i.test(
            normalized
        )
    ) {
        return "hybrid";
    }

    return "ai";
}

function normalizeRubricCriterion(item: any, index: number): RubricCriterion {
    const title = String(item?.title || item?.name || `Tiêu chí ${index + 1}`).trim();
    const description = String(item?.description || title).trim();
    const maxPoints = Number(item?.maxPoints || item?.points || 0);

    return {
        code: String(item?.code || slugifyCriterionCode(title)),
        title,
        description,
        maxPoints: Number.isFinite(maxPoints) && maxPoints > 0 ? maxPoints : 1,
        gradingSource:
            item?.gradingSource === "runner" ||
            item?.gradingSource === "ai" ||
            item?.gradingSource === "hybrid" ||
            item?.gradingSource === "manual"
                ? item.gradingSource
                : inferGradingSource(`${title} ${description}`),
        requiredEvidence: Array.isArray(item?.requiredEvidence)
            ? item.requiredEvidence.map(String)
            : [],
        passThreshold:
            item?.passThreshold === null || item?.passThreshold === undefined
                ? null
                : Number(item.passThreshold),
        notes: String(item?.notes || ""),
    };
}

function rebalanceRubricPoints(
    rubric: RubricCriterion[],
    expectedMaxScore: number
): RubricCriterion[] {
    if (!rubric.length) return rubric;

    const total = rubric.reduce((sum, item) => sum + Number(item.maxPoints || 0), 0);
    if (!Number.isFinite(total) || total <= 0) return rubric;

    if (Math.abs(total - expectedMaxScore) < 0.001) {
        return rubric;
    }

    const factor = expectedMaxScore / total;
    const scaled = rubric.map((item) => ({
        ...item,
        maxPoints: Number((item.maxPoints * factor).toFixed(2)),
    }));

    const scaledTotal = scaled.reduce((sum, item) => sum + item.maxPoints, 0);
    const delta = Number((expectedMaxScore - scaledTotal).toFixed(2));
    scaled[scaled.length - 1].maxPoints = Number(
        (scaled[scaled.length - 1].maxPoints + delta).toFixed(2)
    );

    return scaled;
}

function safeParseJson(text: string): any | null {
    try {
        return JSON.parse(text);
    } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) return null;

        try {
            return JSON.parse(match[0]);
        } catch {
            return null;
        }
    }
}

function heuristicParseRubricText(
    rubricText: string,
    maxScore: number
): RubricCriterion[] {
    const rawLines = rubricText
        .split(/\n|;/g)
        .map((line) => line.trim())
        .filter(Boolean);

    if (!rawLines.length) {
        return [
            {
                code: "overall",
                title: "Chấm tổng thể",
                description: "Chấm tổng thể theo yêu cầu bài tập.",
                maxPoints: maxScore,
                gradingSource: "ai",
                requiredEvidence: [],
                passThreshold: null,
                notes: "",
            },
        ];
    }

    const criteria: RubricCriterion[] = [];
    let currentQuestion = "";
    let pendingQuestionPoints: number | null = null;

    for (let index = 0; index < rawLines.length; index++) {
        const line = rawLines[index];
        const nextLine = rawLines[index + 1] || "";

        const questionMatch = line.match(/^câu\s*(\d+)\s*\(([\d.,]+)\s*điểm\)\s*:?\s*$/i);
        if (questionMatch) {
            currentQuestion = `Câu ${questionMatch[1]}`;
            pendingQuestionPoints = Number(questionMatch[2].replace(",", "."));
            continue;
        }

        if (
            /^hoàn thành các yêu cầu/i.test(line) &&
            /^[a-z][.)]\s*\(([\d.,]+)\s*điểm\)/i.test(nextLine)
        ) {
            continue;
        }

        const subMatch = line.match(/^([a-z])[.)]\s*\(([\d.,]+)\s*điểm\)\s*(.+)$/i);
        if (subMatch) {
            const title = `${currentQuestion} - ${subMatch[1].toLowerCase()}`;
            const description = subMatch[3].trim();

            criteria.push({
                code: slugifyCriterionCode(title),
                title,
                description,
                maxPoints: Number(subMatch[2].replace(",", ".")),
                gradingSource: inferGradingSource(description),
                requiredEvidence: [],
                passThreshold: null,
                notes: "",
            });
            continue;
        }

        const title = currentQuestion ? `${currentQuestion}` : `Tiêu chí ${criteria.length + 1}`;
        const pointsMatch = line.match(/(\d+(?:[.,]\d+)?)\s*(điểm|đ|pts|point|points)?/i);
        const parsedPoints = pointsMatch
            ? Number(String(pointsMatch[1]).replace(",", "."))
            : pendingQuestionPoints ?? 1;

        criteria.push({
            code: slugifyCriterionCode(`${title}_${criteria.length + 1}`),
            title,
            description: line,
            maxPoints: parsedPoints && parsedPoints > 0 ? parsedPoints : 1,
            gradingSource: inferGradingSource(line),
            requiredEvidence: [],
            passThreshold: null,
            notes: "",
        });

        pendingQuestionPoints = null;
    }

    return rebalanceRubricPoints(criteria, maxScore);
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
    const fallbackRubric = heuristicParseRubricText(input.rubricText, input.maxScore);

    if (!input.rubricText.trim()) {
        return {
            rubric: fallbackRubric,
            source: "heuristic",
            warnings: ["Rubric text đang trống, dùng rubric fallback."],
        };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return {
            rubric: fallbackRubric,
            source: "heuristic",
            warnings: ["Chưa có GEMINI_API_KEY, dùng parser heuristic."],
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
- Chuẩn hóa cho bài lập trình, đặc biệt phù hợp Android Kotlin Compose nếu ngữ cảnh liên quan.
- Nếu rubric có cấu trúc kiểu "Câu 2" rồi mới có "a, b, c" thì KHÔNG tạo tiêu chí thừa cho dòng mô tả trung gian.
- Nếu đề nói RecyclerView nhưng ngữ cảnh là Compose thì có thể ghi chú chấp nhận LazyColumn trong notes.
- Tổng maxPoints sau khi parse phải bằng ${input.maxScore}.
- Trả về DUY NHẤT JSON hợp lệ, không markdown.

JSON phải có dạng:
{
  "criteria": [
    {
      "code": "string",
      "title": "string",
      "description": "string",
      "maxPoints": 1,
      "gradingSource": "runner|ai|hybrid|manual",
      "requiredEvidence": ["string"],
      "passThreshold": null,
      "notes": "string"
    }
  ],
  "warnings": ["string"]
}
        `.trim();

        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-3.8-flash",
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

        const parsed = safeParseJson(response.text || "");
        const items = Array.isArray(parsed?.criteria) ? parsed.criteria : [];

        if (!items.length) {
            return {
                rubric: fallbackRubric,
                source: "heuristic",
                warnings: ["AI không trả về criteria hợp lệ, dùng parser heuristic."],
            };
        }

        const normalized = items.map((item: any, index: number) =>
            normalizeRubricCriterion(item, index)
        );
        const validated = validateRubric(normalized);
        const rubric = rebalanceRubricPoints(validated, input.maxScore);

        return {
            rubric,
            source: "gemini",
            warnings: Array.isArray(parsed?.warnings)
                ? parsed.warnings.map(String)
                : [],
        };
    } catch {
        return {
            rubric: fallbackRubric,
            source: "heuristic",
            warnings: ["Gọi Gemini lỗi, dùng parser heuristic."],
        };
    }
}