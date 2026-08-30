# Tích hợp AI

## Trạng thái hiện tại

Repository **chưa kết nối nhà cung cấp AI hoặc backend AI thật**.
`MockFeedbackRepository` tạo phản hồi local ổn định từ `GradingResult` để demo UI
và luồng dữ liệu. Không có API key trong ứng dụng và không được gọi đây là kết
quả của mô hình AI production.

Điểm số luôn đi theo pipeline deterministic:

```text
Submission → metric → rule → rubric score → lecturer review/release
                                      ↘ feedback text only
```

`Feedback` không có trường score/weight/threshold. Giảng viên quyết định công bố
kết quả; phản hồi hỗ trợ không tự nộp bài hoặc thay đổi điểm.

## Kiến trúc production đề xuất

Android chỉ gửi access token và ID tài nguyên tới backend HTTPS. Backend:

1. Xác thực token và role.
2. Kiểm tra quyền với lớp/submission.
3. Lấy rubric và kết quả deterministic đã lưu.
4. Loại dữ liệu cá nhân không cần thiết.
5. Gọi nhà cung cấp AI bằng secret server-side.
6. Validate response theo schema, giới hạn độ dài và loại trường ngoài contract.
7. Lưu audit/model version/trạng thái “cần giảng viên kiểm tra”.

Ví dụ endpoint cần triển khai (chưa tồn tại trong repository):

```http
POST /v1/grading-results/{resultId}/feedback
Authorization: Bearer <user-token>
Idempotency-Key: <uuid>
```

Response tối thiểu:

```json
{
  "resultId": "gr1",
  "summary": "...",
  "strengths": ["..."],
  "problems": [{"ruleId":"r1","metricId":"m1","description":"...","impact":"..."}],
  "recommendations": ["..."],
  "modelVersion": "provider/model-version",
  "requiresLecturerReview": true
}
```

Không chấp nhận field thay đổi điểm. Response thiếu/sai kiểu phải thành lỗi thân
thiện, giữ dữ liệu hiện có và cho retry có giới hạn.

## Vận hành và an toàn

- Timeout tổng thể đề xuất 30 giây; retry tối đa 2 lần cho lỗi tạm thời, dùng
  exponential backoff và idempotency key.
- Xử lý 401/403/408/429/5xx riêng; không retry lỗi quyền/validation.
- Không log prompt, bài làm, token, email hoặc nội dung phản hồi đầy đủ.
- Rate limit theo user/lớp và theo dõi chi phí.
- Không gửi đáp án mẫu hoặc dữ liệu sinh viên khác.
- UI phân biệt “Phản hồi giảng viên” và “Gợi ý hỗ trợ”.

## Kiểm thử còn cần khi có backend

Parser phải có test response hợp lệ, thiếu field, null, sai kiểu, payload quá lớn,
timeout, 429, 5xx, permission denied và field score không được phép. Integration
test phải dùng fake server, không gọi nhà cung cấp thật trong CI.

## Supabase (nếu chọn)

Dùng Edge Function cho AI call; Android chỉ giữ anon/publishable key. Service
role key và AI secret nằm trong secret store của Supabase. RLS phải giới hạn lớp,
submission, grade và feedback theo ownership; thao tác Admin nhạy cảm qua Edge
Function xác thực quyền server-side. Repository hiện chưa có Supabase/RLS nên
phần này là yêu cầu triển khai, không phải chức năng đã hoàn thành.
