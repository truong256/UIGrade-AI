import { GoogleGenAI } from "@google/genai";

type ScoreDistributionItem = {
    label: string;
    count: number;
    percent: number;
};

type CompletionByGroupItem = {
    label: string;
    value: number;
    submitted: number;
    expected: number;
};

type StudentHighlight = {
    studentId: string;
    initials: string;
    name: string;
    className: string;
    score: number;
    badge: string;
    note: string;
};

type WarningStudent = {
    studentId: string;
    initials: string;
    name: string;
    className: string;
    score: number;
    level: string;
    note: string;
};

type LearningReportOverview = {
    generatedAt: string;
    filters: {
        selectedClassroomId: string;
        selectedAssignmentId: string;
    };
    stats: {
        averageScore: number;
        gradedCount: number;
        onTimeRate: number;
        onTimeSubmitted: number;
        expectedSubmissions: number;
        totalStudents: number;
        totalClasses: number;
        warningCount: number;
        totalAssignments: number;
        totalSubmissions: number;
    };
    scoreDistribution: ScoreDistributionItem[];
    completionByGroup: CompletionByGroupItem[];
    highlightStudents: StudentHighlight[];
    warningStudents: WarningStudent[];
};

type AiAlert = {
    title: string;
    detail: string;
    severity: "low" | "medium" | "high";
};

type AiStudentInsight = {
    studentId: string;
    name: string;
    level: "low" | "medium" | "high";
    reason: string;
    action: string;
};

type AiReportInsight = {
    generatedAt: string;
    source: "gemini" | "rule-based";
    summary: string;
    alerts: AiAlert[];
    recommendations: string[];
    chartInsights: string[];
    studentInsights: AiStudentInsight[];
};

type ParsedAiAlert = {
    title?: unknown;
    detail?: unknown;
    severity?: unknown;
};

type ParsedStudentInsight = {
    studentId?: unknown;
    name?: unknown;
    level?: unknown;
    reason?: unknown;
    action?: unknown;
};

type ParsedAiInsight = {
    summary?: unknown;
    alerts?: unknown;
    recommendations?: unknown;
    chartInsights?: unknown;
    studentInsights?: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
}

function toStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function round1(value: number) {
    return Math.round(value * 10) / 10;
}

function safePercent(value: number) {
    if (!Number.isFinite(value)) return 0;
    return Math.max(0, Math.min(round1(value), 100));
}

function formatPercent(value: number) {
    return `${safePercent(value)}%`;
}

function formatScore(value: number) {
    const safe = Number.isFinite(value) ? value : 0;
    return Number.isInteger(safe) ? `${safe}.0` : safe.toFixed(1);
}

function getMostCrowdedBucket(items: ScoreDistributionItem[]) {
    return [...items].sort((a, b) => b.count - a.count)[0] || null;
}

function getWeakestGroup(items: CompletionByGroupItem[]) {
    return [...items].sort((a, b) => a.value - b.value)[0] || null;
}

function getStrongestGroup(items: CompletionByGroupItem[]) {
    return [...items].sort((a, b) => b.value - a.value)[0] || null;
}

function buildFallbackInsight(report: LearningReportOverview): AiReportInsight {
    const weakestGroup = getWeakestGroup(report.completionByGroup);
    const strongestGroup = getStrongestGroup(report.completionByGroup);
    const mainBucket = getMostCrowdedBucket(report.scoreDistribution);
    const lowScoreBucket = report.scoreDistribution
        .filter((item) => item.label === "0-3" || item.label === "3-5")
        .reduce((sum, item) => sum + item.percent, 0);
    const warningTop = report.warningStudents[0] || null;
    const highlightTop = report.highlightStudents[0] || null;

    const summaryParts: string[] = [];

    if (report.stats.gradedCount > 0) {
        summaryParts.push(
            `Điểm trung bình hiện ở mức ${formatScore(report.stats.averageScore)}/10 trên ${report.stats.gradedCount} bài đã chấm.`
        );
    } else {
        summaryParts.push("Chưa có đủ bài đã chấm để AI đưa ra nhận định sâu về chất lượng học tập.");
    }

    if (weakestGroup) {
        summaryParts.push(
            `${weakestGroup.label} đang có tỷ lệ nộp đúng hạn thấp nhất, khoảng ${formatPercent(weakestGroup.value)}.`
        );
    }

    if (mainBucket && mainBucket.count > 0) {
        summaryParts.push(
            `Phổ điểm tập trung nhiều nhất ở nhóm ${mainBucket.label}, cho thấy mặt bằng kết quả đang dồn vào vùng này.`
        );
    }

    const alerts: AiAlert[] = [];

    if (report.stats.warningCount > 0) {
        alerts.push({
            title: "Có học sinh cần theo dõi",
            detail: `${report.stats.warningCount} học sinh đang rơi vào nhóm điểm thấp, thiếu bài hoặc nộp muộn nhiều lần.`,
            severity: report.stats.warningCount >= 5 ? "high" : "medium",
        });
    }

    if (weakestGroup && weakestGroup.value < 80) {
        alerts.push({
            title: "Tỷ lệ hoàn thành chưa tốt",
            detail: `${weakestGroup.label} chỉ đạt ${formatPercent(weakestGroup.value)} lượt nộp đúng hạn (${weakestGroup.submitted}/${weakestGroup.expected}).`,
            severity: weakestGroup.value < 60 ? "high" : "medium",
        });
    }

    if (lowScoreBucket >= 35) {
        alerts.push({
            title: "Phổ điểm thấp chiếm tỷ trọng lớn",
            detail: `${formatPercent(lowScoreBucket)} bài đã chấm đang nằm trong nhóm điểm dưới 5.0.`,
            severity: lowScoreBucket >= 50 ? "high" : "medium",
        });
    }

    if (highlightTop) {
        alerts.push({
            title: "Có nhóm học sinh nổi bật",
            detail: `${highlightTop.name} đang dẫn đầu với điểm trung bình ${formatScore(highlightTop.score)} và trạng thái ${highlightTop.badge.toLowerCase()}.`,
            severity: "low",
        });
    }

    const recommendations: string[] = [];

    if (warningTop) {
        recommendations.push(
            `Ưu tiên làm việc với ${warningTop.name} vì hiện đang có dấu hiệu rủi ro cao: ${warningTop.note.toLowerCase()}.`
        );
    }

    if (weakestGroup) {
        recommendations.push(
            `Tập trung nhắc nộp bài và kiểm tra deadline ở ${weakestGroup.label} để kéo tỷ lệ hoàn thành lên khỏi mức ${formatPercent(weakestGroup.value)}.`
        );
    }

    if (lowScoreBucket >= 25) {
        recommendations.push(
            "Tạo một buổi phụ đạo hoặc bài luyện tập bổ sung cho nhóm học sinh có điểm dưới 5.0 để kéo mặt bằng chung lên nhanh hơn."
        );
    }

    if (strongestGroup) {
        recommendations.push(
            `Có thể dùng cách tổ chức giao bài của ${strongestGroup.label} làm mẫu vì nhóm này đang dẫn đầu với ${formatPercent(strongestGroup.value)} nộp đúng hạn.`
        );
    }

    const chartInsights: string[] = [];

    if (mainBucket) {
        chartInsights.push(`Nhóm điểm xuất hiện nhiều nhất là ${mainBucket.label} với ${mainBucket.count} bài.`);
    }

    if (weakestGroup) {
        chartInsights.push(
            `${weakestGroup.label} là nhóm có tiến độ yếu nhất: ${weakestGroup.submitted}/${weakestGroup.expected} lượt đúng hạn.`
        );
    }

    if (strongestGroup && weakestGroup && strongestGroup.label !== weakestGroup.label) {
        chartInsights.push(
            `Chênh lệch tiến độ giữa ${strongestGroup.label} và ${weakestGroup.label} đang là ${formatPercent(strongestGroup.value - weakestGroup.value)}.`
        );
    }

    const studentInsights = report.warningStudents.slice(0, 5).map<AiStudentInsight>((student) => {
        const reasons: string[] = [];
        const lowerNote = student.note.toLowerCase();

        if (student.score < 5) {
            reasons.push(`điểm trung bình chỉ ở mức ${formatScore(student.score)}`);
        }

        if (lowerNote.includes("thiếu")) {
            reasons.push(student.note.toLowerCase());
        }

        if (lowerNote.includes("muộn")) {
            reasons.push(student.note.toLowerCase());
        }

        return {
            studentId: student.studentId,
            name: student.name,
            level: student.score < 4 || lowerNote.includes("thiếu 3") || lowerNote.includes("thiếu 4") ? "high" : "medium",
            reason: reasons.length ? reasons.join(", ") : "có dấu hiệu giảm hiệu suất học tập",
            action:
                lowerNote.includes("thiếu")
                    ? "Nên nhắc nộp bù các bài còn thiếu và theo dõi ở lần giao bài kế tiếp."
                    : student.score < 5
                        ? "Nên giao bài bù hoặc phụ đạo ngắn để kéo lại nền tảng."
                        : "Nên theo dõi thêm 1-2 tuần và nhắc học sinh nộp bài đúng hạn.",
        };
    });

    return {
        generatedAt: new Date().toISOString(),
        source: "rule-based",
        summary: summaryParts.join(" "),
        alerts: alerts.slice(0, 4),
        recommendations: recommendations.slice(0, 4),
        chartInsights: chartInsights.slice(0, 4),
        studentInsights,
    };
}

function safeParseJson(text: string): ParsedAiInsight | null {
    try {
        const parsed: unknown = JSON.parse(text);
        return isObject(parsed) ? (parsed as ParsedAiInsight) : null;
    } catch {
        const match = text.match(/\{[\s\S]*\}/);
        if (!match) return null;

        try {
            const parsed: unknown = JSON.parse(match[0]);
            return isObject(parsed) ? (parsed as ParsedAiInsight) : null;
        } catch {
            return null;
        }
    }
}

function normalizeAlert(item: unknown): AiAlert | null {
    const alert = isObject(item) ? (item as ParsedAiAlert) : null;
    if (!alert) return null;

    const title = String(alert.title || "").trim();
    const detail = String(alert.detail || "").trim();
    const severity =
        alert.severity === "high" || alert.severity === "medium" || alert.severity === "low"
            ? alert.severity
            : "medium";

    if (!title || !detail) return null;

    return { title, detail, severity };
}

function normalizeStudentInsight(item: unknown): AiStudentInsight | null {
    const insight = isObject(item) ? (item as ParsedStudentInsight) : null;
    if (!insight) return null;

    const level =
        insight.level === "high" || insight.level === "medium" || insight.level === "low"
            ? insight.level
            : "medium";

    const studentId = String(insight.studentId || "").trim();
    const name = String(insight.name || "").trim();
    const reason = String(insight.reason || "").trim();
    const action = String(insight.action || "").trim();

    if (!studentId && !name) return null;
    if (!reason || !action) return null;

    return {
        studentId,
        name,
        level,
        reason,
        action,
    };
}

async function generateWithGemini(report: LearningReportOverview): Promise<AiReportInsight | null> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `
Bạn là AI phân tích báo cáo học tập cho giáo viên trong hệ thống AutoGrade.

Nhiệm vụ:
- Đọc JSON báo cáo học tập.
- Viết nhận định ngắn gọn, dễ hiểu, đúng ngữ cảnh giáo dục.
- Chỉ dựa trên dữ liệu có trong JSON, không bịa thêm dữ kiện.
- Trả về DUY NHẤT JSON hợp lệ, không markdown.
- Ngôn ngữ: tiếng Việt.

JSON cần trả về:
{
  "summary": "string",
  "alerts": [
    {
      "title": "string",
      "detail": "string",
      "severity": "low|medium|high"
    }
  ],
  "recommendations": ["string"],
  "chartInsights": ["string"],
  "studentInsights": [
    {
      "studentId": "string",
      "name": "string",
      "level": "low|medium|high",
      "reason": "string",
      "action": "string"
    }
  ]
}

Quy tắc:
- summary tối đa 3 câu.
- alerts từ 2 đến 4 mục.
- recommendations từ 2 đến 4 mục, phải có tính hành động.
- chartInsights từ 2 đến 4 mục.
- studentInsights tối đa 5 mục, ưu tiên đúng các học sinh trong warningStudents.
`.trim();

        const response = await ai.models.generateContent({
            model: process.env.GEMINI_MODEL || "gemini-3.7-flash",
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        { text: `REPORT JSON:\n${JSON.stringify(report, null, 2)}` },
                    ],
                },
            ],
            config: {
                temperature: 0.2,
            },
        });

        const parsed = safeParseJson(response.text || "");
        if (!parsed) return null;

        const summary = String(parsed.summary || "").trim();
        const alerts = Array.isArray(parsed.alerts)
            ? parsed.alerts.map(normalizeAlert).filter((item): item is AiAlert => Boolean(item)).slice(0, 4)
            : [];
        const recommendations = toStringArray(parsed.recommendations).filter(Boolean).slice(0, 4);
        const chartInsights = toStringArray(parsed.chartInsights).filter(Boolean).slice(0, 4);
        const studentInsights = Array.isArray(parsed.studentInsights)
            ? parsed.studentInsights
                .map(normalizeStudentInsight)
                .filter((item): item is AiStudentInsight => Boolean(item))
                .slice(0, 5)
            : [];

        if (!summary) return null;

        return {
            generatedAt: new Date().toISOString(),
            source: "gemini",
            summary,
            alerts: alerts.length ? alerts : buildFallbackInsight(report).alerts,
            recommendations: recommendations.length
                ? recommendations
                : buildFallbackInsight(report).recommendations,
            chartInsights: chartInsights.length ? chartInsights : buildFallbackInsight(report).chartInsights,
            studentInsights: studentInsights.length
                ? studentInsights
                : buildFallbackInsight(report).studentInsights,
        };
    } catch {
        return null;
    }
}

export const reportAiService = {
    async generateLearningReportInsight(report: LearningReportOverview): Promise<AiReportInsight> {
        const fallback = buildFallbackInsight(report);
        const geminiInsight = await generateWithGemini(report);
        return geminiInsight || fallback;
    },
};
