# Quyền riêng tư và bảo mật

## Dữ liệu hiện tại

Bản demo dùng dữ liệu giả trong bộ nhớ và tài khoản demo công khai. Không nhập dữ
liệu cá nhân thật. Process dừng thì session và dữ liệu phát sinh bị xóa.

## Biện pháp trong Android app

- Role guard cho Student/Lecturer/Admin, cộng kiểm tra quyền trong use case và
  mock repository.
- Sinh viên chỉ đọc membership, submission, grade đã công bố của mình.
- Giảng viên bị giới hạn vào lớp/bài tập thuộc quyền.
- Admin repository kiểm tra actor Admin và bảo vệ Super Admin.
- Logout xóa session và navigation back stack.
- Password demo/đăng ký chỉ được giữ dạng SHA-256 trong RAM; không log password.
- Manifest tắt backup và cleartext traffic; chỉ Activity launcher được exported.
- File nộp dùng Storage Access Framework, có kiểm tra extension/kích thước/số lượng.
- `.gitignore` loại `local.properties`, APK/AAB và build output.

SHA-256 trong mock không phải cơ chế lưu mật khẩu production. Backend thật phải
dùng thuật toán password hashing chuyên dụng (Argon2id/bcrypt/scrypt), salt riêng,
TLS và session/token có thời hạn.

## Yêu cầu backend

- Không tin role/owner ID do client gửi; suy ra từ token.
- Authorization server-side cho mọi object ID và deep link.
- RLS/policy cho class, membership, submission, grade, feedback, notification.
- Admin action cần audit bất biến; service-role key không tới client.
- Validate MIME bằng nội dung, tên file an toàn, giới hạn kích thước và chống path traversal.
- Mã hóa khi truyền và khi lưu; quy định retention/xóa dữ liệu.
- Token hết hạn trả 401 để app xóa session; tài khoản khóa phải bị thu hồi session.

## Secret và signing

Không commit `.env`, keystore, `*.jks`, key password, API key hoặc token. GitHub
Actions release chỉ đọc secret đã cấu hình. Nếu secret từng bị commit, phải revoke
ngay và làm sạch lịch sử có kiểm soát.

## Hạn chế

Chưa có backend, token refresh, Room encryption, Supabase RLS hoặc pentest. Do đó
APK hiện là demo, không phù hợp xử lý dữ liệu sinh viên thật.
