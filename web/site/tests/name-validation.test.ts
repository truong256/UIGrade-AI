// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { describe, expect, it } from "vitest";
import { validateFullName, NAME_VALIDATION_ERROR } from "@/validations/name.validation";

describe("validateFullName", () => {
    it("accepts valid Vietnamese and international names", () => {
        const validNames = [
            "Nguyễn Văn An",
            "Truong Nguyen",
            "An123",
            "Đặng Trần Côn",
            "Lê Thị Bích Ngọc",
            "John Doe",
            "Élodie Dubois",
        ];

        for (const name of validNames) {
            const result = validateFullName(name);
            expect(result.isValid, `Expected "${name}" to be valid`).toBe(true);
            expect(result.error).toBeUndefined();
            expect(result.normalizedName).toBeTruthy();
        }
    });

    it("rejects purely numeric inputs", () => {
        const numericNames = ["123456", "000001", "9999999", "123 456", "  012345  "];

        for (const name of numericNames) {
            const result = validateFullName(name);
            expect(result.isValid, `Expected "${name}" to be invalid`).toBe(false);
            expect(result.error).toBe(NAME_VALIDATION_ERROR);
        }
    });

    it("rejects empty or whitespace-only inputs", () => {
        const emptyInputs = ["", "   ", "\t", "\n  \t"];

        for (const input of emptyInputs) {
            const result = validateFullName(input);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe("Vui lòng nhập họ và tên của bạn.");
        }
    });

    it("rejects names shorter than 2 characters", () => {
        const shortInputs = ["A", " 1 ", "x"];

        for (const input of shortInputs) {
            const result = validateFullName(input);
            expect(result.isValid).toBe(false);
        }
    });

    it("rejects names without any letters (e.g. only symbols and numbers)", () => {
        const symbolInputs = ["123456!", "@#$%^", "---", "12-34"];

        for (const input of symbolInputs) {
            const result = validateFullName(input);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe(NAME_VALIDATION_ERROR);
        }
    });
});
