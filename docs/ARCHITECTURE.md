# Kiến trúc UIGrade AI

## Tổng quan

UIGrade AI là ứng dụng Android một module (`:app`), một Activity, UI Jetpack
Compose và điều hướng theo vai trò.

```text
Composable
  → ViewModel (StateFlow/one-time event)
  → Use case
  → Domain repository interface
  → Mock repository
  → MockDataStore in-memory
```

Hilt cung cấp repository singleton. `MockDataStore` là nguồn dữ liệu duy nhất
trong một phiên chạy, vì vậy thao tác tham gia lớp, nộp bài, chấm điểm và quản trị
được phản ánh giữa các màn hình. Dữ liệu sẽ mất khi process bị dừng.

## Các lớp

- `domain/model`: model Kotlin thuần cho user, lớp, assignment, submission,
  rubric, metric, rule, grade, feedback, thông báo và audit.
- `domain/repository`: hợp đồng dữ liệu độc lập framework.
- `domain/usecase`: validation, quyền và nghiệp vụ của từng vai trò.
- `data/mock`: seed data demo và source of truth in-memory.
- `data/repository`: implementation demo; không phải backend production.
- `presentation`: ViewModel, UI state, màn hình và navigation.
- `ui`: theme xanh Material 3, component dùng chung và mascot mèo.
- `di`: binding Hilt.

## Phân quyền

Route Sinh viên, Giảng viên và Admin được bọc bằng `RoleGuard`. Use case và
repository tiếp tục kiểm tra user, membership/ownership và trạng thái công bố.
Navigation guard chỉ là lớp đầu; backend thật vẫn phải xác thực token và quyền
server-side.

## Chấm điểm và AI

Điểm được tính từ metric/rule/rubric. `FeedbackRepository` tách khỏi
`GradingRepository`; `Feedback` chỉ chứa văn bản và không có trường sửa điểm.
Implementation hiện tại là local demo, không gọi mô hình AI thật. Xem
`AI_INTEGRATION.md`.

## Trạng thái và đồng bộ

ViewModel phát `StateFlow`, Composable dùng `collectAsStateWithLifecycle`. Các
thao tác ghi cập nhật `MockDataStore`; màn hình reload qua use case. Submission,
grading result, feedback và notification giữ quan hệ bằng ID.

## Giới hạn kiến trúc hiện tại

- Chưa có Room, Retrofit service hoặc Supabase client thực tế.
- Session chỉ nằm trong bộ nhớ; chưa có token refresh.
- Không có backend policy/RLS để bảo vệ dữ liệu ngoài thiết bị.
- Không có parser AI/network để kiểm thử timeout hoặc response malformed.

Khi tích hợp backend, giữ interface/use case/UI và thay binding trong
`AppModule`; không đưa secret vào Android client.
