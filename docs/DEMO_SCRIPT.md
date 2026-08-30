# Kịch bản demo UIGrade AI (8–10 phút)

## Chuẩn bị

- Dùng APK debug/demo, không dùng tài khoản hoặc dữ liệu thật.
- Đảm bảo AVD đã cài bản mới; xoay về portrait, font scale mặc định.
- Tài khoản: Student/Lecturer/Admin trong README, mật khẩu `password123`.
- Mã lớp mẫu: lấy trực tiếp từ màn hình lớp Giảng viên để tránh đọc mã cũ.
- Nói rõ AI hiện là local demo và điểm do rule/rubric tính.

## Luồng trình diễn

1. **Vấn đề và giải pháp (45 giây):** chấm UI cần nhất quán, truy vết; AI chỉ hỗ trợ nhận xét.
2. **Sinh viên (2 phút):** đăng nhập → dashboard → tham gia lớp → mở bài tập → lưu draft/chọn tệp → xác nhận nộp → xem trạng thái/điểm đã công bố/phản hồi.
3. **Giảng viên (3 phút):** đăng xuất → đăng nhập → xem/tạo lớp và join code → tạo/mở bài tập → xem submission → xem kết quả rule → chỉnh/xác nhận/công bố.
4. **Admin (1,5 phút):** đăng nhập → dashboard → lọc người dùng → khóa/mở tài khoản → xem rubric/rule/metric → audit log.
5. **Kiến trúc (1 phút):** Compose → ViewModel → UseCase → Repository → data source; role guard và ownership; deterministic score tách feedback.
6. **Nguồn mở (45 giây):** repository public, CI, test, LICENSE, issue/PR template, roadmap và release process.
7. **Kết luận (30 giây):** nêu lợi ích và giới hạn backend/AI thật.

## Kịch bản dự phòng

- Nếu file picker khó trình chiếu, dùng submission seed đã có và mở lịch sử.
- Nếu mạng mất, app demo vẫn chạy vì dữ liệu in-memory; không tuyên bố đây là offline production.
- Nếu AI backend được hỏi, mở `docs/AI_INTEGRATION.md` và nói rõ endpoint chưa triển khai.
- Nếu app restart, đăng nhập lại vì session/demo data reset.

## Checklist sau demo

Không để email/mật khẩu thật trong ảnh/video; không hiển thị Logcat có dữ liệu;
ghi đúng commit/tag đã demo và giữ APK/checksum tương ứng.
