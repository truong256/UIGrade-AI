// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

export const NAME_VALIDATION_ERROR = "Họ tên phải chứa ít nhất một chữ cái và không được chỉ gồm chữ số.";

export type NameValidationResult = {
    isValid: boolean;
    error?: string;
    normalizedName: string;
};

/**
 * Validates a user's full name according to business rules:
 * - Must not be empty or whitespace-only
 * - Trimmed length must be between 2 and 100 characters
 * - Must not consist solely of numbers
 * - Must contain at least one letter (Unicode \p{L} supporting Vietnamese diacritics)
 */
export function validateFullName(rawName: unknown): NameValidationResult {
    if (typeof rawName !== "string") {
        return {
            isValid: false,
            error: "Vui lòng nhập họ và tên của bạn.",
            normalizedName: "",
        };
    }

    const normalizedName = rawName.trim().replace(/\s+/g, " ");

    if (!normalizedName) {
        return {
            isValid: false,
            error: "Vui lòng nhập họ và tên của bạn.",
            normalizedName: "",
        };
    }

    if (normalizedName.length < 2) {
        return {
            isValid: false,
            error: "Họ và tên phải có ít nhất 2 ký tự.",
            normalizedName,
        };
    }

    if (normalizedName.length > 100) {
        return {
            isValid: false,
            error: "Họ và tên không được vượt quá 100 ký tự.",
            normalizedName,
        };
    }

    // Must not be only digits (or digits + punctuation/spaces without any letters)
    const hasLetter = /\p{L}/u.test(normalizedName);
    if (!hasLetter) {
        return {
            isValid: false,
            error: NAME_VALIDATION_ERROR,
            normalizedName,
        };
    }

    // Must not be only numbers
    const isOnlyNumbers = /^\d+$/.test(normalizedName.replace(/\s+/g, ""));
    if (isOnlyNumbers) {
        return {
            isValid: false,
            error: NAME_VALIDATION_ERROR,
            normalizedName,
        };
    }

    return {
        isValid: true,
        normalizedName,
    };
}
