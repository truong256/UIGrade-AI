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

  const knownDatabaseMessages: Array<[RegExp, string]> = [
    [/only an active student/i, "Chỉ sinh viên đang hoạt động mới được thực hiện thao tác này."],
    [/assignment is unavailable/i, "Bài tập không tồn tại hoặc hiện không thể nộp."],
    [/late submissions are not allowed/i, "Bài tập đã hết hạn và không cho phép nộp trễ."],
    [/resubmission is not allowed/i, "Bài tập này không cho phép nộp lại."],
    [/published grade locks|grading has started/i, "Bài nộp đã được chấm và không thể thay đổi."],
    [/maximum submission attempts reached/i, "Bạn đã dùng hết số lần nộp cho bài tập này."],
    [/source zip.*required/i, "Bài tập yêu cầu một tệp ZIP mã nguồn."],
    [/file does not exist or violates assignment policy/i, "Tệp nộp không tồn tại hoặc không đúng chính sách của bài tập."],
    [/repository url is not allowed/i, "Bài tập này không cho phép đường dẫn repository hoặc đường dẫn không an toàn."],
    [/file or repository url is required/i, "Vui lòng tải tệp hoặc cung cấp repository trước khi nộp."],
    [/class not found or inactive/i, "Không tìm thấy lớp học đang hoạt động với mã này."],
    [/already (joined|requested)|membership.*active/i, "Bạn đã tham gia hoặc đã gửi yêu cầu vào lớp học này."],
  ];
  const known = knownDatabaseMessages.find(([pattern]) => pattern.test(message));
  if (known) return known[1];

  return "Đã xảy ra lỗi khi xử lý yêu cầu. Vui lòng thử lại sau.";
}
