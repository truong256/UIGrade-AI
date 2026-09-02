import { describe, it, expect } from "vitest";
import { mapSupabaseErrorToVietnamese } from "@/lib/supabase/errors";

describe("Supabase Error Mapper Tests", () => {
  it("should translate unique constraint violation (23505) to Vietnamese", () => {
    const error = { code: "23505", message: "duplicate key value violates unique constraint" };
    expect(mapSupabaseErrorToVietnamese(error)).toContain("Dữ liệu đã tồn tại");
  });

  it("should translate foreign key violation (23503) to Vietnamese", () => {
    const error = { code: "23503", message: "foreign key violation" };
    expect(mapSupabaseErrorToVietnamese(error)).toContain("Dữ liệu liên kết không tồn tại");
  });

  it("should translate not null violation (23502) to Vietnamese", () => {
    const error = { code: "23502", message: "null value in column violates not-null constraint" };
    expect(mapSupabaseErrorToVietnamese(error)).toContain("Thiếu thông tin bắt buộc");
  });

  it("should translate RLS policy violation (42501) to Vietnamese", () => {
    const error = { code: "42501", message: "permission denied for table" };
    expect(mapSupabaseErrorToVietnamese(error)).toContain("Bạn không có quyền thực hiện");
  });

  it("should translate auth invalid login credentials to Vietnamese", () => {
    const error = { message: "Invalid login credentials" };
    expect(mapSupabaseErrorToVietnamese(error)).toContain("Email hoặc mật khẩu không chính xác");
  });

  it("should translate email already in use to Vietnamese", () => {
    const error = { message: "User already registered" };
    expect(mapSupabaseErrorToVietnamese(error)).toContain("Email này đã được đăng ký tài khoản");
  });

  it("should handle generic unknown error gracefully", () => {
    const error = "An unexpected error occurred";
    expect(mapSupabaseErrorToVietnamese(error)).toBe("An unexpected error occurred");
  });
});
