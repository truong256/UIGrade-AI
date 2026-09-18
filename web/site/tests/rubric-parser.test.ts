// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    generateContent: vi.fn(),
}));

vi.mock("@google/genai", () => ({
    GoogleGenAI: class {
        models = { generateContent: mocks.generateContent };
    },
}));

import { parseRubricTextWithAI } from "@/services/rubric-parser.service";

const SAMPLE_RUBRIC = `
1. Hàm analyze_scores(scores) đúng tên và nhận danh sách điểm: 1.0 điểm
2. Tính average đúng và làm tròn 2 chữ số: 1.5 điểm
3. Tìm highest đúng: 1.0 điểm
4. Tìm lowest đúng: 1.0 điểm
5. passed_count đúng với điều kiện >= 5.0: 1.5 điểm
6. classification đúng đủ 4 mức: 1.5 điểm
7. Xử lý danh sách rỗng đúng: 1.0 điểm
8. Kiểm tra điểm ngoài [0,10] và raise đúng ValueError: 1.0 điểm
9. Code rõ ràng, dễ đọc: 0.5 điểm
Tổng: 10 điểm
`.trim();

describe("rubric parser", () => {
    const originalApiKey = process.env.GEMINI_API_KEY;

    beforeEach(() => {
        delete process.env.GEMINI_API_KEY;
        mocks.generateContent.mockReset();
    });

    afterEach(() => {
        if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
        else process.env.GEMINI_API_KEY = originalApiKey;
    });

    it("only reads explicit point expressions and excludes total metadata", async () => {
        const result = await parseRubricTextWithAI({
            rubricText: SAMPLE_RUBRIC,
            maxScore: 10,
        });

        expect(result.rubric).toHaveLength(9);
        expect(result.rubric.map((criterion) => criterion.maxPoints)).toEqual([
            1, 1.5, 1, 1, 1.5, 1.5, 1, 1, 0.5,
        ]);
        expect(result.rubric.reduce((sum, criterion) => sum + criterion.maxPoints, 0)).toBe(10);
    });

    it.each([
        "Tổng: 10 điểm",
        "Tổng điểm: 10",
        "Total: 10",
        "Total points: 10",
    ])("does not create a criterion from total line %s", async (totalLine) => {
        const result = await parseRubricTextWithAI({
            rubricText: `Tiêu chí A: 4 điểm\nTiêu chí B - 6 điểm\n${totalLine}`,
            maxScore: 10,
        });

        expect(result.rubric).toHaveLength(2);
        expect(result.rubric.map((criterion) => criterion.maxPoints)).toEqual([4, 6]);
    });

    it("does not create a criterion from a bulleted total line", async () => {
        const result = await parseRubricTextWithAI({
            rubricText: "- A: 4 điểm\n- B: 6 điểm\n- Tổng: 10 điểm",
            maxScore: 10,
        });

        expect(result.rubric).toHaveLength(2);
        expect(result.rubric.map((criterion) => criterion.maxPoints)).toEqual([4, 6]);
    });

    it("supports decimal commas and an explicit Điểm label", async () => {
        const result = await parseRubricTextWithAI({
            rubricText: "Độ chính xác - 2,5 điểm\nChất lượng code Điểm: 7.5",
            maxScore: 10,
        });

        expect(result.rubric.map((criterion) => criterion.maxPoints)).toEqual([2.5, 7.5]);
    });

    it("preserves the existing Câu and lettered sub-criterion format", async () => {
        const result = await parseRubricTextWithAI({
            rubricText: [
                "Câu 2 (3 điểm):",
                "Hoàn thành các yêu cầu sau:",
                "a.) (1 điểm) Build thành công",
                "b.) (2 điểm) Test chạy đúng",
            ].join("\n"),
            maxScore: 3,
        });

        expect(result.rubric).toHaveLength(2);
        expect(result.rubric.map((criterion) => criterion.maxPoints)).toEqual([1, 2]);
    });

    it("parses a parenthesized point expression before its description", async () => {
        const result = await parseRubricTextWithAI({
            rubricText: "A: 4 điểm\nB (6 điểm): Kiểm tra >= 5.0",
            maxScore: 10,
        });

        expect(result.rubric).toHaveLength(2);
        expect(result.rubric.map((criterion) => criterion.maxPoints)).toEqual([4, 6]);
    });

    it("preserves a continuation description after a standalone Câu score", async () => {
        const result = await parseRubricTextWithAI({
            rubricText: "Câu 1 (4 điểm):\nTriển khai thuật toán theo yêu cầu",
            maxScore: 4,
        });

        expect(result.rubric).toHaveLength(1);
        expect(result.rubric[0].maxPoints).toBe(4);
        expect(result.rubric[0].description).toContain("Triển khai thuật toán theo yêu cầu");
    });

    it("does not borrow sub-criteria from the next Câu section", async () => {
        const result = await parseRubricTextWithAI({
            rubricText: [
                "Câu 1 (4 điểm):",
                "Viết hàm tính tổng",
                "Câu 2 (6 điểm):",
                "a) (3 điểm) Build thành công",
                "b) (3 điểm) Test chạy đúng",
            ].join("\n"),
            maxScore: 10,
        });

        expect(result.rubric).toHaveLength(3);
        expect(result.rubric.map((criterion) => criterion.maxPoints)).toEqual([4, 3, 3]);
        expect(result.rubric[0].description).toContain("Viết hàm tính tổng");
    });

    it("marks fallback output as fallback/manual when AI is unavailable", async () => {
        const result = await parseRubricTextWithAI({
            rubricText: "Đúng yêu cầu: 10 điểm",
            maxScore: 10,
        });

        expect(result.source).toBe("fallback");
        expect(result.rubric.every((criterion) => criterion.gradingSource === "manual")).toBe(true);
    });

    it("marks fallback output as fallback/manual when the AI request fails", async () => {
        process.env.GEMINI_API_KEY = "test-key";
        mocks.generateContent.mockRejectedValueOnce(new Error("network failed"));

        const result = await parseRubricTextWithAI({
            rubricText: "Đúng yêu cầu: 10 điểm",
            maxScore: 10,
        });

        expect(result.source).toBe("fallback");
        expect(result.rubric[0].gradingSource).toBe("manual");
        expect(result.warnings.join(" ")).toMatch(/thủ công/i);
    });

    it("accepts validated structured AI criteria with positive points", async () => {
        process.env.GEMINI_API_KEY = "test-key";
        mocks.generateContent.mockResolvedValueOnce({
            text: JSON.stringify({
                criteria: [
                    { title: "Đúng chức năng", description: "Chạy đúng", points: 6 },
                    { title: "Chất lượng code", description: "Dễ đọc", points: 4 },
                ],
                warnings: [],
            }),
        });

        const result = await parseRubricTextWithAI({
            rubricText: "Đúng chức năng\nChất lượng code",
            maxScore: 10,
        });

        expect(result.source).toBe("gemini");
        expect(result.rubric.map((criterion) => criterion.maxPoints)).toEqual([6, 4]);
    });

    it("drops total metadata returned as a structured AI criterion", async () => {
        process.env.GEMINI_API_KEY = "test-key";
        mocks.generateContent.mockResolvedValueOnce({
            text: JSON.stringify({
                criteria: [
                    { title: "Đúng chức năng", description: "Chạy đúng", points: 4 },
                    { title: "Chất lượng code", description: "Dễ đọc", points: 6 },
                    { title: "Tổng", description: "Tổng: 10 điểm", points: 10 },
                ],
            }),
        });

        const result = await parseRubricTextWithAI({
            rubricText: "Đúng chức năng: 4 điểm\nChất lượng code: 6 điểm\nTổng: 10 điểm",
            maxScore: 10,
        });

        expect(result.rubric).toHaveLength(2);
        expect(result.rubric.map((criterion) => criterion.maxPoints)).toEqual([4, 6]);
    });

    it("keeps explicit source points when AI confuses numbers in descriptions", async () => {
        process.env.GEMINI_API_KEY = "test-key";
        mocks.generateContent.mockResolvedValueOnce({
            text: JSON.stringify({
                criteria: [
                    { title: "Hàm analyze_scores", description: "Nhận danh sách điểm", points: 1 },
                    { title: "Average", description: "Làm tròn 2 chữ số", points: 2 },
                    { title: "Highest", description: "Tìm highest", points: 1 },
                    { title: "Lowest", description: "Tìm lowest", points: 1 },
                    { title: "Passed count", description: ">= 5.0", points: 5 },
                    { title: "Classification", description: "Đủ 4 mức", points: 4 },
                    { title: "Danh sách rỗng", description: "Xử lý đúng", points: 1 },
                    { title: "Validation", description: "Ngoài [0,10]", points: 10 },
                    { title: "Code", description: "Dễ đọc", points: 0.5 },
                ],
            }),
        });

        const result = await parseRubricTextWithAI({
            rubricText: SAMPLE_RUBRIC,
            maxScore: 10,
        });

        expect(result.source).toBe("gemini");
        expect(result.rubric.map((criterion) => criterion.maxPoints)).toEqual([
            1, 1.5, 1, 1, 1.5, 1.5, 1, 1, 0.5,
        ]);
    });

    it("keeps deterministic criterion identity when AI reorders criteria", async () => {
        process.env.GEMINI_API_KEY = "test-key";
        mocks.generateContent.mockResolvedValueOnce({
            text: JSON.stringify({
                criteria: [
                    { title: "B", description: "Tiêu chí B", points: 8 },
                    { title: "A", description: "Tiêu chí A", points: 2 },
                ],
            }),
        });

        const result = await parseRubricTextWithAI({
            rubricText: "A: 2 điểm\nB: 8 điểm",
            maxScore: 10,
        });

        expect(result.source).toBe("gemini");
        expect(result.rubric.map((criterion) => criterion.title)).toEqual(["A", "B"]);
        expect(result.rubric.map((criterion) => criterion.maxPoints)).toEqual([2, 8]);
    });

    it("does not let a partial deterministic parse replace complete AI criteria", async () => {
        process.env.GEMINI_API_KEY = "test-key";
        mocks.generateContent.mockResolvedValueOnce({
            text: JSON.stringify({
                criteria: [
                    { title: "A", description: "Tiêu chí A", points: 4 },
                    { title: "B", description: "Tiêu chí B chưa ghi điểm rõ ràng", points: 6 },
                ],
            }),
        });

        const result = await parseRubricTextWithAI({
            rubricText: "A: 4 điểm\nB cần được kiểm tra đầy đủ",
            maxScore: 10,
        });

        expect(result.source).toBe("gemini");
        expect(result.rubric).toHaveLength(2);
        expect(result.rubric.map((criterion) => criterion.maxPoints)).toEqual([4, 6]);
    });

    it("rejects structured AI criteria with non-positive points", async () => {
        process.env.GEMINI_API_KEY = "test-key";
        mocks.generateContent.mockResolvedValueOnce({
            text: JSON.stringify({
                criteria: [
                    { title: "Đúng chức năng", description: "Chạy đúng", points: 0 },
                ],
            }),
        });

        const result = await parseRubricTextWithAI({
            rubricText: "Đúng chức năng: 10 điểm",
            maxScore: 10,
        });

        expect(result.source).toBe("fallback");
        expect(result.rubric[0].maxPoints).toBe(10);
    });

    it("preserves points when the criterion total already matches maxScore", async () => {
        const result = await parseRubricTextWithAI({
            rubricText: "A: 1.5 điểm\nB: 8.5 điểm",
            maxScore: 10,
        });

        expect(result.rubric.map((criterion) => criterion.maxPoints)).toEqual([1.5, 8.5]);
    });

    it("normalizes only when a valid positive criterion total differs from maxScore", async () => {
        const result = await parseRubricTextWithAI({
            rubricText: "A: 1 điểm\nB: 2 điểm",
            maxScore: 10,
        });

        expect(result.rubric.map((criterion) => criterion.maxPoints)).toEqual([3.33, 6.67]);
        expect(result.warnings.join(" ")).toMatch(/chuẩn hóa/i);
    });
});
