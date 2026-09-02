import { z } from "zod";

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
    academicYear: z.string().trim().min(4, "Vui lòng nhập năm học"),
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
        academicYear: z.string().trim().optional(),
        status: z.enum(["active", "archived"]).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "Dữ liệu cập nhật không được để trống",
    });