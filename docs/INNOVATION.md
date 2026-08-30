# Điểm khác biệt của UIGrade AI

## Vấn đề

Chấm bài giao diện thường tốn thời gian, khó nhất quán và khó giải thích vì sao
một tiêu chí bị trừ điểm. AI thuần sinh có thể tạo nhận xét hữu ích nhưng không
đủ tin cậy để tự quyết định điểm.

## Giải pháp đã có trong code

UIGrade AI tách hai trách nhiệm:

1. Metric, rule và rubric tạo điểm deterministic có thể truy vết.
2. Feedback hỗ trợ chỉ tạo văn bản dựa trên kết quả đã tính.

Model `GradingResult` giữ điểm theo tiêu chí và bằng chứng metric/rule; model
`Feedback` không có trường sửa điểm. Giảng viên có luồng lưu nháp, điều chỉnh và
công bố; sinh viên chỉ thấy kết quả đã công bố.

## Giá trị kỹ thuật

- Ba vai trò dùng cùng source of truth nhưng bị giới hạn theo ownership.
- Giảng viên tạo lớp/mã tham gia/bài tập/rubric, xem bài nộp và xác nhận điểm.
- Sinh viên tham gia lớp, lưu draft, nộp/nộp lại và xem tiến độ/phản hồi.
- Admin quản lý catalog quy tắc/metric/rubric và audit hoạt động.
- Repository interface cho phép thay in-memory demo bằng API/Room mà không viết
  lại UI/use case.

## Giới hạn trung thực

Metric extraction, backend grading và nhà cung cấp AI thật chưa nằm trong
repository. Feedback hiện là local assistant deterministic; dữ liệu không bền.
Giá trị hiện tại là kiến trúc, nghiệp vụ Android và proof-of-flow, chưa phải hệ
thống chấm production.

## Hướng phát triển

Backend an toàn, parser/schema AI, metric extractor có benchmark, RLS/ownership,
offline cache, accessibility regression và đo độ đồng thuận giữa rule, AI và
giảng viên.
