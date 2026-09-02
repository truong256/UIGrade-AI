import { GoogleGenAI } from "@google/genai";
import type {
    AiFeedbackResult,
    RubricCriterion,
    RunnerReportInput,
} from "@/lib/grading-contract";
import type { GeminiInlinePart } from "@/services/grading-context.service";

type GenerateAiFeedbackInput = {
    assignmentTitle: string;
    gradingContextText: string;
    multimodalParts?: GeminiInlinePart[];
    rubric: RubricCriterion[];
    runnerReport?: RunnerReportInput | null;
    model?: string;
    language?: string;
};

type ParsedIssue = {
    severity?: unknown;
    title?: unknown;
    evidence?: unknown;
    fix?: unknown;
};

type ParsedCriterionFeedback = {
    criterionCode?: unknown;
    awardedPoints?: unknown;
    confidence?: unknown;
    summary?: unknown;
    strengths?: unknown;
    issues?: unknown;
    suggestions?: unknown;
};

type ParsedAiFeedback = {
    summary?: unknown;
    strengths?: unknown;
    issues?: unknown;
    nextSteps?: unknown;
    criterionFeedback?: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function toStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.map(String) : [];
}

function fallbackAiFeedback(rubric: RubricCriterion[]): AiFeedbackResult {
    return {
        summary:
            "Chưa cấu hình Gemini API hoặc AI chưa trả về dữ liệu hợp lệ. Hệ thống giữ lại phần chấm cứng và chờ giáo viên xem thêm.",
        strengths: [],
        issues: [],
        nextSteps: [
            "Kiểm tra GEMINI_API_KEY trong .env.local",
            "Chạy lại chấm tự động sau khi cấu hình Gemini",
        ],
        criterionFeedback: rubric.map((item) => ({
            criterionCode: item.code,
            awardedPoints: 0,
            confidence: 0.1,
            summary: "Chưa có dữ liệu AI.",
            strengths: [],
            issues: ["Chưa có phản hồi AI cho tiêu chí này."],
            suggestions: ["Kiểm tra cấu hình Gemini rồi chấm lại."],
        })),
    };
}

function safeParseJson(text: string): ParsedAiFeedback | null {
    try {
        const parsed: unknown = JSON.parse(text);
        return isObject(parsed) ? (parsed as ParsedAiFeedback) : null;
    } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) return null;

        try {
            const parsed: unknown = JSON.parse(match[0]);
            return isObject(parsed) ? (parsed as ParsedAiFeedback) : null;
        } catch {
            return null;
        }
    }
}

export async function generateAiFeedback(
    input: GenerateAiFeedbackInput
): Promise<AiFeedbackResult> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        return fallbackAiFeedback(input.rubric);
    }

    try {
        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
Bạn là AI chấm bài cho hệ thống AutoGrade.

MỤC TIÊU:
- Chấm bài sinh viên dựa trên:
  1) mô tả đề bài
  2) rubric ngắn
  3) file rubric chi tiết
  4) file đề bài / ảnh / pdf giáo viên upload
  5) template / starter code / test case giáo viên upload
  6) file zip bài nộp của sinh viên
  7) ảnh screenshot do sinh viên nộp (nếu có)
- So sánh bài sinh viên với yêu cầu và rubric.
- Chỉ chấm các tiêu chí có gradingSource là "ai" hoặc "hybrid".
- awardedPoints phải nằm trong [0, maxPoints].
- confidence trong [0,1].
- Nếu không đủ bằng chứng thì KHÔNG cho full điểm.
- Luôn nêu evidence cụ thể theo tên file, class, hàm, hoặc thành phần UI quan sát được.
- Không bịa file không tồn tại.
- Ngôn ngữ phản hồi: ${input.language || "vi"}.
- Trả về DUY NHẤT JSON hợp lệ.
- Không dùng markdown.

CẤU TRÚC JSON:
{
  "summary": "string",
  "strengths": ["string"],
  "issues": [
    {
      "severity": "low|medium|high",
      "title": "string",
      "evidence": "string",
      "fix": "string"
    }
  ],
  "nextSteps": ["string"],
  "criterionFeedback": [
    {
      "criterionCode": "string",
      "awardedPoints": 0,
      "confidence": 0.0,
      "summary": "string",
      "strengths": ["string"],
      "issues": ["string"],
      "suggestions": ["string"]
    }
  ]
}
        `.trim();

        const parts: any[] = [
            { text: prompt },
            {
                text: `ASSIGNMENT TITLE:\n${input.assignmentTitle}`,
            },
            {
                text: `RUBRIC JSON:\n${JSON.stringify(input.rubric, null, 2)}`,
            },
            {
                text: `RUNNER REPORT:\n${JSON.stringify(input.runnerReport || null, null, 2)}`,
            },
            ...(input.multimodalParts || []),
            {
                text: `GRADING CONTEXT:\n${input.gradingContextText}`,
            },
        ];

        const response = await ai.models.generateContent({
            model: input.model || process.env.GEMINI_MODEL || "gemini-3.7-flash",
            contents: [
                {
                    role: "user",
                    parts,
                },
            ],
            config: {
                temperature: 0.2,
            },
        });

        const rawText = response.text || "";
        const parsed = safeParseJson(rawText);

        if (!parsed) {
            return fallbackAiFeedback(input.rubric);
        }

        return {
            summary: String(parsed.summary || ""),
            strengths: toStringArray(parsed.strengths),
            issues: Array.isArray(parsed.issues)
                ? parsed.issues.map((item) => {
                    const issue = isObject(item) ? (item as ParsedIssue) : {};

                    return {
                        severity:
                            issue.severity === "high" ||
                            issue.severity === "medium" ||
                            issue.severity === "low"
                                ? issue.severity
                                : "medium",
                        title: String(issue.title || ""),
                        evidence: String(issue.evidence || ""),
                        fix: String(issue.fix || ""),
                    };
                })
                : [],
            nextSteps: toStringArray(parsed.nextSteps),
            criterionFeedback: Array.isArray(parsed.criterionFeedback)
                ? parsed.criterionFeedback.map((item) => {
                    const feedback = isObject(item)
                        ? (item as ParsedCriterionFeedback)
                        : {};

                    const rubricItem = input.rubric.find(
                        (criterion) =>
                            criterion.code === String(feedback.criterionCode || "")
                    );

                    const maxPoints = Number(rubricItem?.maxPoints || 0);
                    const awarded = Number(feedback.awardedPoints || 0);

                    return {
                        criterionCode: String(feedback.criterionCode || ""),
                        awardedPoints: Math.min(Math.max(awarded, 0), maxPoints),
                        confidence: Math.min(
                            Math.max(Number(feedback.confidence || 0), 0),
                            1
                        ),
                        summary: String(feedback.summary || ""),
                        strengths: toStringArray(feedback.strengths),
                        issues: toStringArray(feedback.issues),
                        suggestions: toStringArray(feedback.suggestions),
                    };
                })
                : [],
        };
    } catch {
        return fallbackAiFeedback(input.rubric);
    }
}