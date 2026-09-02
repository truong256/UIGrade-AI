import { describe, it, expect } from "vitest";

interface RubricCriterion {
  id: string;
  name: string;
  maxScore: number;
  weight: number;
  score?: number;
}

function calculateRubricScore(criteria: RubricCriterion[]): number {
  if (!criteria.length) return 0;
  let totalScore = 0;
  let totalWeight = 0;

  for (const item of criteria) {
    const rawScore = Math.max(0, Math.min(item.score ?? 0, item.maxScore));
    const normalizedPercent = item.maxScore > 0 ? rawScore / item.maxScore : 0;
    totalScore += normalizedPercent * item.weight;
    totalWeight += item.weight;
  }

  if (totalWeight === 0) return 0;
  const finalScale10 = (totalScore / totalWeight) * 10;
  return Number(finalScale10.toFixed(2));
}

function applyLatePenalty(rawScore: number, isLate: boolean, penaltyPercent = 10): number {
  if (!isLate || penaltyPercent <= 0) return rawScore;
  const deduction = (rawScore * penaltyPercent) / 100;
  const finalScore = Math.max(0, rawScore - deduction);
  return Number(finalScore.toFixed(2));
}

describe("Grading & Score Calculation Tests", () => {
  describe("Rubric Score Calculation", () => {
    it("should calculate correct score for fully matched rubric", () => {
      const criteria: RubricCriterion[] = [
        { id: "c1", name: "UI Layout Match", maxScore: 10, weight: 40, score: 10 },
        { id: "c2", name: "Button Interactions", maxScore: 10, weight: 30, score: 10 },
        { id: "c3", name: "Clean Architecture", maxScore: 10, weight: 30, score: 10 },
      ];

      expect(calculateRubricScore(criteria)).toBe(10);
    });

    it("should calculate correct weighted score with partial completion", () => {
      const criteria: RubricCriterion[] = [
        { id: "c1", name: "UI Layout Match", maxScore: 10, weight: 50, score: 8 }, // 4.0
        { id: "c2", name: "State Handling", maxScore: 10, weight: 50, score: 6 }, // 3.0
      ];

      expect(calculateRubricScore(criteria)).toBe(7.0);
    });

    it("should clamp individual scores within [0, maxScore]", () => {
      const criteria: RubricCriterion[] = [
        { id: "c1", name: "Negative Score", maxScore: 10, weight: 50, score: -5 }, // clamped to 0
        { id: "c2", name: "Overflow Score", maxScore: 10, weight: 50, score: 15 }, // clamped to 10
      ];

      expect(calculateRubricScore(criteria)).toBe(5.0);
    });
  });

  describe("Late Submission Penalty Calculation", () => {
    it("should deduct penalty percentage when submission is late", () => {
      expect(applyLatePenalty(10, true, 20)).toBe(8.0);
      expect(applyLatePenalty(8.5, true, 10)).toBe(7.65);
    });

    it("should not deduct penalty when on time or penalty is 0", () => {
      expect(applyLatePenalty(9.5, false, 20)).toBe(9.5);
      expect(applyLatePenalty(9.5, true, 0)).toBe(9.5);
    });

    it("should never drop score below 0", () => {
      expect(applyLatePenalty(0, true, 50)).toBe(0);
    });
  });
});
