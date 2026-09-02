/**
 * Chuyển đổi mã lỗi Supabase sang thông báo tiếng Việt thân thiện, rõ ràng.
 */
export function mapSupabaseErrorToVietnamese(error: unknown): string {
  if (!error) return "Đã có lỗi xảy ra, vui lòng thử lại.";

  const message = typeof error === "string" ? error : (error as { message?: string; code?: string }).message || "";
  const code = (error as { code?: string }).code || "";

  if (message.includes("Invalid login credentials") || message.includes("invalid_credentials")) {
    return "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.";
  }

  if (message.includes("User already registered") || message.includes("user_already_exists")) {
    return "Email này đã được đăng ký tài khoản trong hệ thống.";
  }

  if (message.includes("Password should be at least")) {
    return "Mật khẩu phải có ít nhất 6 ký tự.";
  }

  if (message.includes("Email not confirmed")) {
    return "Email của bạn chưa được xác thực. Vui lòng kiểm tra hộp thư đến.";
  }

  if (message.includes("JWT expired") || message.includes("session_not_found")) {
    return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  }

  if (message.includes("row-level security") || message.includes("permission denied") || code === "42501") {
    return "Bạn không có quyền thực hiện thao tác này.";
  }

  if (message.includes("duplicate key value") || code === "23505") {
    if (message.includes("class_code")) return "Mã lớp này đã tồn tại trong hệ thống.";
    if (message.includes("email")) return "Email này đã tồn tại.";
    if (message.includes("unique_class_student")) return "Sinh viên đã tham gia lớp học này.";
    return "Dữ liệu đã tồn tại trong hệ thống.";
  }

  if (message.includes("foreign key") || code === "23503") {
    return "Dữ liệu liên kết không tồn tại hoặc đã bị xóa.";
  }

  if (message.includes("violates not-null") || code === "23502") {
    return "Thiếu thông tin bắt buộc để thực hiện thao tác.";
  }

  if (message.includes("rate limit") || message.includes("too many requests")) {
    return "Bạn đã gửi quá nhiều yêu cầu. Vui lòng chờ giây lát rồi thử lại.";
  }

  return message || "Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại sau.";
}
