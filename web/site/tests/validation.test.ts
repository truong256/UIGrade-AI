import { describe, it, expect } from "vitest";
import { z } from "zod";

const studentCodeSchema = z
  .string()
  .min(3, "Mã sinh viên tối thiểu 3 ký tự")
  .max(20, "Mã sinh viên tối đa 20 ký tự")
  .regex(/^[a-zA-Z0-9_-]+$/, "Mã sinh viên chỉ chứa chữ, số và dấu gạch");

const classCodeSchema = z
  .string()
  .min(3, "Mã lớp tối thiểu 3 ký tự")
  .max(15, "Mã lớp tối đa 15 ký tự")
  .transform((val) => val.trim().toUpperCase());

const emailSchema = z
  .string()
  .transform((val) => val.trim().toLowerCase())
  .pipe(z.string().email("Định dạng email không hợp lệ"));

const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Mật khẩu mới phải khác mật khẩu hiện tại",
    path: ["newPassword"],
  });

describe("Validation Logic Tests", () => {
  describe("Student Code Validation", () => {
    it("should accept valid student codes", () => {
      expect(studentCodeSchema.safeParse("SV001").success).toBe(true);
      expect(studentCodeSchema.safeParse("2026-IT-001").success).toBe(true);
      expect(studentCodeSchema.safeParse("STUDENT_99").success).toBe(true);
    });

    it("should reject student codes that are too short or contain invalid characters", () => {
      expect(studentCodeSchema.safeParse("S").success).toBe(false);
      expect(studentCodeSchema.safeParse("SV@001!").success).toBe(false);
      expect(studentCodeSchema.safeParse("").success).toBe(false);
    });
  });

  describe("Class Code Validation & Normalization", () => {
    it("should normalize class code to uppercase and trim spaces", () => {
      const result = classCodeSchema.safeParse("  andr101  ");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("ANDR101");
      }
    });

    it("should reject empty or overly long class codes", () => {
      expect(classCodeSchema.safeParse("").success).toBe(false);
      expect(classCodeSchema.safeParse("A".repeat(20)).success).toBe(false);
    });
  });

  describe("Email Validation", () => {
    it("should validate and lowercase emails", () => {
      const result = emailSchema.safeParse("Teacher@University.EDU.VN ");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("teacher@university.edu.vn");
      }
    });

    it("should reject invalid email formats", () => {
      expect(emailSchema.safeParse("notanemail").success).toBe(false);
      expect(emailSchema.safeParse("@domain.com").success).toBe(false);
    });
  });

  describe("Password Change Validation", () => {
    it("should accept valid password change data", () => {
      const result = passwordChangeSchema.safeParse({
        currentPassword: "OldPassword123",
        newPassword: "NewSecurePassword456",
        confirmPassword: "NewSecurePassword456",
      });
      expect(result.success).toBe(true);
    });

    it("should reject when confirmation does not match", () => {
      const result = passwordChangeSchema.safeParse({
        currentPassword: "OldPassword123",
        newPassword: "NewSecurePassword456",
        confirmPassword: "DifferentPassword789",
      });
      expect(result.success).toBe(false);
    });

    it("should reject when new password is identical to current password", () => {
      const result = passwordChangeSchema.safeParse({
        currentPassword: "SamePassword123",
        newPassword: "SamePassword123",
        confirmPassword: "SamePassword123",
      });
      expect(result.success).toBe(false);
    });
  });
});
