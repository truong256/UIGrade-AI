# Changelog

Định dạng dựa trên Keep a Changelog và dự án dùng Semantic Versioning.

## [Unreleased]

### Added

- Bộ tài liệu build, kiến trúc, kiểm thử, bảo mật, AI, release và demo.
- LICENSE MIT, thông báo dependency, issue/PR template và Dependabot.
- Quy trình CI/release tạo APK, checksum và artifact kiểm tra.
- Scorecard đối chiếu tiêu chí cuộc thi bằng bằng chứng repository.

### Changed

- Đồng bộ Java/Kotlin target với JDK 17.
- Tách rõ `DATA_SOURCE_MODE=DEMO` và loại dependency production chưa sử dụng.
- Script Windows tự tìm Android SDK thay vì dùng đường dẫn cá nhân.

### Fixed

- Phản hồi lỗi thao tác Admin không còn bị gắn nhãn thành công.
- Loại callback `onValueChange` rỗng ở bộ chọn vai trò Admin.
- Loại độ trễ mạng giả khỏi repository in-memory.

### Security

- Tắt Android backup và cleartext traffic mặc định.
- Bổ sung hướng dẫn xử lý secret, signing và báo cáo lỗ hổng.

## [1.0.0] - Chưa phát hành

### Added

- Khung Android Compose, Clean Architecture, Hilt và navigation theo ba vai trò.
- Luồng Sinh viên: lớp học, bài tập, draft/nộp bài, điểm, thông báo, hồ sơ.
- Luồng Giảng viên: lớp, mã tham gia, bài tập, rubric, bài nộp và chấm điểm.
- Luồng Admin: dashboard, người dùng, rubric, rule, metric và audit log.
- Mock data dùng chung, chấm điểm deterministic và phản hồi hỗ trợ local.
- Unit test, Compose smoke test và Android CI.

Mục này tổng hợp chức năng đã có trên `main` đến 2026-08-29; chỉ thay “Chưa phát
hành” bằng ngày thực tế sau khi tag và GitHub Release được tạo.

[Unreleased]: https://github.com/truong256/UIGrade-AI/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/truong256/UIGrade-AI/releases/tag/v1.0.0
