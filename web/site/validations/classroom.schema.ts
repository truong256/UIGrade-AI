// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { z } from "zod";

export function validateAcademicYear(value: unknown): {
    isValid: boolean;
    error?: string;
    normalizedYear: string;
} {
    if (typeof value !== "string" || !value.trim()) {
        return {
            isValid: false,
            error: "Vui lòng nhập năm học (Ví dụ: 2025-2026)",
            normalizedYear: "",
        };
    }

    const trimmed = value.trim().replace(/–/g, "-");
    const match = trimmed.match(/^(\d{4})-(\d{4})$/);
    if (!match) {
        return {
            isValid: false,
            error: "Năm học phải theo định dạng YYYY-YYYY (Ví dụ: 2025-2026)",
            normalizedYear: trimmed,
        };
    }

    const startYear = parseInt(match[1], 10);
    const endYear = parseInt(match[2], 10);

    if (endYear <= startYear) {
        return {
            isValid: false,
            error: "Năm kết thúc phải lớn hơn năm bắt đầu.",
            normalizedYear: trimmed,
        };
    }

    if (endYear !== startYear + 1) {
        return {
            isValid: false,
            error: "Năm học phải kéo dài liên tiếp 1 năm (Ví dụ: 2025-2026).",
            normalizedYear: trimmed,
        };
    }

    const currentYear = new Date().getFullYear();
    const minStartYear = currentYear - 3;
    const maxStartYear = currentYear + 3;

    if (startYear < minStartYear || startYear > maxStartYear) {
        return {
            isValid: false,
            error: `Năm học không hợp lệ. Vui lòng chọn trong khoảng từ ${minStartYear}-${minStartYear + 1} đến ${maxStartYear}-${maxStartYear + 1}.`,
            normalizedYear: trimmed,
        };
    }

    return {
        isValid: true,
        normalizedYear: `${startYear}-${endYear}`,
    };
}

export const academicYearSchema = z
    .string()
    .trim()
    .superRefine((val, ctx) => {
        const result = validateAcademicYear(val);
        if (!result.isValid) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: result.error || "Năm học không hợp lệ",
            });
        }
    })
    .transform((val) => validateAcademicYear(val).normalizedYear);

export const createClassroomSchema = z.object({
    name: z.string().trim().min(2, "Tên lớp phải có ít nhất 2 ký tự"),
    code: z
        .string()
        .trim()
        .min(3, "Mã lớp phải có ít nhất 3 ký tự")
        .max(20, "Mã lớp tối đa 20 ký tự")
        .transform((value) => value.toUpperCase()),
    description: z.string().trim().optional().default(""),
    semester: z.enum(["HK1", "HK2", "HK3"]),
    academicYear: academicYearSchema,
});

export const updateClassroomSchema = z
    .object({
        name: z.string().trim().min(2, "Tên lớp phải có ít nhất 2 ký tự").optional(),
        code: z
            .string()
            .trim()
            .min(3, "Mã lớp phải có ít nhất 3 ký tự")
            .max(20, "Mã lớp tối đa 20 ký tự")
            .transform((value) => value.toUpperCase())
            .optional(),
        description: z.string().trim().optional(),
        semester: z.enum(["HK1", "HK2", "HK3"]).optional(),
        academicYear: academicYearSchema.optional(),
        status: z.enum(["active", "archived"]).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "Dữ liệu cập nhật không được để trống",
    });