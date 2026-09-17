// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { describe, expect, it } from "vitest";
import { validateAcademicYear, createClassroomSchema } from "@/validations/classroom.schema";

describe("validateAcademicYear", () => {
    const currentYear = new Date().getFullYear();

    it("accepts valid consecutive academic years around current year", () => {
        const validYears = [
            `${currentYear - 1}-${currentYear}`,
            `${currentYear}-${currentYear + 1}`,
            `${currentYear + 1}-${currentYear + 2}`,
            `${currentYear}–${currentYear + 1}`, // with en-dash
        ];

        for (const yr of validYears) {
            const res = validateAcademicYear(yr);
            expect(res.isValid, `Expected ${yr} to be valid`).toBe(true);
            expect(res.normalizedYear).toMatch(/^\d{4}-\d{4}$/);
        }
    });

    it("rejects reversed academic years (e.g. 2027-2026)", () => {
        const res = validateAcademicYear("2027-2026");
        expect(res.isValid).toBe(false);
        expect(res.error).toBe("Năm kết thúc phải lớn hơn năm bắt đầu.");
    });

    it("rejects multi-year spans (e.g. 2026-2024, 2024-2026)", () => {
        expect(validateAcademicYear("2026-2024").isValid).toBe(false);
        expect(validateAcademicYear("2024-2026").isValid).toBe(false);
        expect(validateAcademicYear("2024-2026").error).toContain("kéo dài liên tiếp 1 năm");
    });

    it("rejects invalid formats", () => {
        const invalidFormats = ["2026", "2026/2027", "26-27", "abc", "", "   "];
        for (const input of invalidFormats) {
            expect(validateAcademicYear(input).isValid).toBe(false);
        }
    });

    it("rejects years outside dynamic range", () => {
        const tooOld = `${currentYear - 10}-${currentYear - 9}`;
        const tooFar = `${currentYear + 10}-${currentYear + 11}`;
        expect(validateAcademicYear(tooOld).isValid).toBe(false);
        expect(validateAcademicYear(tooFar).isValid).toBe(false);
    });

    it("validates through createClassroomSchema", () => {
        const validPayload = {
            name: "Lập trình Web",
            code: "WEB2026",
            description: "Mô tả môn học",
            semester: "HK1",
            academicYear: `${currentYear}-${currentYear + 1}`,
        };
        expect(() => createClassroomSchema.parse(validPayload)).not.toThrow();

        const invalidPayload = {
            ...validPayload,
            academicYear: "2027-2026",
        };
        expect(() => createClassroomSchema.parse(invalidPayload)).toThrow();
    });
});
