# UIGrade AI

[![Android CI](https://github.com/truong256/UIGrade-AI/actions/workflows/android-ci.yml/badge.svg)](https://github.com/truong256/UIGrade-AI/actions/workflows/android-ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Android](https://img.shields.io/badge/Android-API%2026%2B-3DDC84.svg)](docs/BUILD_FROM_SOURCE.md)

UIGrade AI là ứng dụng Android hỗ trợ quản lý lớp học và chấm bài giao diện theo
rubric. Hệ thống tách điểm deterministic (metric + rule) khỏi phản hồi hỗ trợ,
giúp Sinh viên hiểu kết quả, Giảng viên kiểm soát điểm và Admin quản trị catalog.

> Trạng thái: bản demo in-memory. Repository chưa có backend, Room, token/RLS hay
> nhà cung cấp AI thật; không dùng dữ liệu sinh viên thật hoặc gọi đây là bản production.

## Người dùng và chức năng

### Sinh viên

- Dashboard, lớp học, tham gia bằng mã và yêu cầu chờ duyệt.
- Danh sách/chi tiết bài tập, trạng thái deadline tập trung.
- Lưu draft, chọn tệp bằng Storage Access Framework, xác nhận nộp/nộp lại.
- Lịch sử submission, điểm/rubric đã công bố, feedback, tiến độ và lịch.
- Thông báo, hồ sơ, đổi mật khẩu demo và đăng xuất an toàn.

### Giảng viên

- Dashboard, tạo/sửa/lưu trữ lớp, join code và quản lý sinh viên/yêu cầu.
- CRUD/publish/close bài tập và quản lý rubric.
- Xem submission, lưu nháp điểm, xem phản hồi hỗ trợ, xác nhận/công bố.
- Thống kê, thông báo, hồ sơ và đổi mật khẩu.

### Admin

- Dashboard và trạng thái AI feedback demo.
- Tìm kiếm/lọc/sắp xếp người dùng; tạo/sửa/khóa/mở/vô hiệu hóa.
- Quản lý rubric, rule, metric và bảo vệ dữ liệu đang sử dụng.
- Audit log, filter, phân trang và kiểm tra quyền Admin nhiều lớp.

## Nguyên tắc chấm điểm

```text
Submission
  → Metric extraction (mock/demo)
  → Rule evaluation
  → Rubric score deterministic
  → Lecturer review/release
  → Feedback text-only (local demo)
```

AI/feedback không có quyền sửa score, weight, threshold hoặc tự công bố điểm.
Chi tiết và contract backend: [Tích hợp AI](docs/AI_INTEGRATION.md).

## Công nghệ

- Kotlin 2.0.21, Jetpack Compose, Material 3.
- MVVM/Clean Architecture, Hilt, Coroutines/Flow/StateFlow.
- Navigation Compose với role guard.
- Gradle 8.13, AGP 8.13.2, JDK/JVM target 17, compile/target SDK 35.
- JUnit, Coroutines Test, MockK, Turbine và Compose UI Test.

## Kiến trúc

```text
Composable → ViewModel → UseCase → Repository interface
                                      ↓
                              Mock repository
                                      ↓
                           MockDataStore in-memory
```

Xem [tài liệu kiến trúc](docs/ARCHITECTURE.md). `BuildConfig.DATA_SOURCE_MODE`
được đặt thành `DEMO` để không nhầm implementation in-memory với production.

## Build từ source

Yêu cầu: Android Studio tương thích AGP 8.13.2, JDK 17, SDK 35.

```bash
git clone https://github.com/truong256/UIGrade-AI.git
cd UIGrade-AI
./gradlew clean assembleDebug
./gradlew testDebugUnitTest
./gradlew lintDebug
./gradlew assembleDebugAndroidTest
```

Windows thay `./gradlew` bằng `gradlew.bat`. APK debug:
`app/build/outputs/apk/debug/app-debug.apk`. Hướng dẫn IDE, emulator, thiết bị thật
và lỗi thường gặp: [Build từ mã nguồn](docs/BUILD_FROM_SOURCE.md).

## Tài khoản demo

| Email | Mật khẩu | Vai trò |
|---|---|---|
| `student@uigrade.ai` | `password123` | Sinh viên |
| `lecturer@uigrade.ai` | `password123` | Giảng viên |
| `admin@uigrade.ai` | `password123` | Admin |

Các tài khoản là dữ liệu giả công khai, chỉ dùng demo. Mã lớp nên lấy từ màn hình
Giảng viên vì trạng thái lớp thay đổi trong phiên chạy.

## Kiểm thử và CI

- Unit test: `./gradlew testDebugUnitTest`
- Lint: `./gradlew lintDebug`
- Biên dịch UI test: `./gradlew assembleDebugAndroidTest`
- Chạy UI test (cần thiết bị/emulator): `./gradlew connectedDebugAndroidTest`

GitHub Actions chạy các quality gate và lưu report/debug APK. Xem
[chiến lược kiểm thử](docs/TESTING.md).

## API contract minh họa

Contract grading hiện được thể hiện bằng domain model/mock data; endpoint backend
chưa tồn tại. Ví dụ JSON không được tự ý đổi khi tích hợp:

```json
{
  "assignmentId": "UI-001",
  "totalScore": 82,
  "maxScore": 100,
  "engineVersion": "1.0.0",
  "criteria": [
    {
      "id": "typography",
      "name": "Typography",
      "score": 16,
      "maxScore": 20,
      "metrics": [
        {
          "id": "font_size_body",
          "name": "Body Text Size",
          "actual": "14sp",
          "expected": ">=16sp",
          "unit": "sp",
          "status": "FAIL"
        }
      ],
      "rules": [
        {
          "id": "RULE_FONT_BODY_001",
          "description": "Body text size must be at least 16sp",
          "threshold": ">=16sp",
          "result": "FAIL",
          "earnedScore": 6,
          "maxScore": 10,
          "penalty": 4
        }
      ]
    }
  ]
}
```

## Tài liệu dự án

- [Kiến trúc](docs/ARCHITECTURE.md) · [Build](docs/BUILD_FROM_SOURCE.md) · [Test](docs/TESTING.md)
- [AI](docs/AI_INTEGRATION.md) · [Bảo mật/quyền riêng tư](docs/PRIVACY_AND_SECURITY.md)
- [Dependency](docs/DEPENDENCIES.md) · [Tuân thủ license](docs/LICENSE_COMPLIANCE.md)
- [Innovation](docs/INNOVATION.md) · [Demo script](docs/DEMO_SCRIPT.md) · [Roadmap](docs/ROADMAP.md)
- [Release process](docs/RELEASE_PROCESS.md) · [Scorecard cuộc thi](docs/COMPETITION_SCORECARD.md)

## Ảnh và video

Repository chưa lưu screenshot/video để tránh dùng ảnh giả hoặc ảnh không khớp
commit. Trước khi nộp bài, chạy đúng APK release candidate, chụp ba role và thêm
liên kết video theo checklist trong `docs/DEMO_SCRIPT.md`.

## Đóng góp, lỗi và bảo mật

- [Báo lỗi/đề xuất](https://github.com/truong256/UIGrade-AI/issues/new/choose)
- [Hướng dẫn đóng góp](CONTRIBUTING.md) và pull request template.
- Lỗ hổng: làm theo [SECURITY.md](SECURITY.md), không đăng secret công khai.
- Thay đổi phiên bản: [CHANGELOG.md](CHANGELOG.md) và [GitHub Releases](https://github.com/truong256/UIGrade-AI/releases).

## Hạn chế hiện tại

- Dữ liệu/session reset khi process dừng; chưa có Room/backend.
- Auth/password hash chỉ mô phỏng trong RAM, không phải bảo mật production.
- AI feedback là local demo; không có provider/API key.
- UI test đã compile trong CI nhưng runtime cần emulator/device.
- Chưa có screenshot/video, tag hoặc GitHub Release chính thức.

## Giấy phép

Mã nguồn do dự án sở hữu: [MIT License](LICENSE). Font Inter và dependency giữ
giấy phép riêng; xem [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) và
[NOTICE](NOTICE).
