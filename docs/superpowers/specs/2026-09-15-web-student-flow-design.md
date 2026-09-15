# Web Student Flow Completion Design

## Goal

Hoàn thiện luồng sinh viên của UIGrade AI Web để sinh viên chỉ thấy dữ liệu được phép, luôn đi đúng bài tập khi chuyển giữa các màn hình, nộp bài an toàn một lần, và chỉ xem kết quả đã công bố.

## Scope

Phạm vi chỉ gồm `web/site`. Không thay đổi Android, không thay cơ chế xác thực Supabase, không bổ sung service-role key và không tạo dữ liệu giả trong giao diện production.

Luồng cần hoàn thiện:

1. Đăng nhập và phân quyền role `student` chuẩn.
2. Dashboard cá nhân với tiến độ dựa trên bài đã nộp chính thức.
3. Danh sách lớp và tham gia lớp bằng mã.
4. Danh sách, chi tiết và điều hướng tới đúng bài tập.
5. Lưu nháp, nộp chính thức, nộp lại và validation file/repository.
6. Xem kết quả đã công bố, deep-link tới đúng bài nộp và phản hồi AI.

## Confirmed Problems

- Chi tiết bài tập dẫn sinh viên tới `/ui/grading_detail`, trong khi route này chỉ dành cho giảng viên/admin.
- Nút nộp bài không truyền `assignmentId`, nên trang nộp có thể chọn nhầm bài đầu tiên.
- Trang kết quả không giữ `submissionId` từ URL và kiểu dữ liệu hiện tại bỏ trường này khi chuẩn hóa.
- API kết quả lấy `ai_feedback` nhưng DTO không trả nó cho giao diện.
- Dashboard coi bản nháp là bài đã hoàn thành và không tính bài nháp là bài chưa nộp.
- Hook nộp bài và dialog tham gia lớp chỉ dùng React state để khóa thao tác; hai lần bấm trong cùng nhịp có thể gửi hai request.
- Form nộp bài phụ thuộc hoàn toàn vào lỗi server cho file sai loại, file quá lớn, URL không hợp lệ hoặc bài nộp chính thức chưa có file/repository.
- Role lịch sử `User` vẫn được chấp nhận ở trang kết quả dù hệ thống đã chuẩn hóa role.
- Một số label form chưa liên kết bằng `htmlFor`/`id`, alert chưa khai báo live region và nút xóa file chưa có tên truy cập rõ ràng.

## Design

### Authorization and data boundaries

`student` là role duy nhất được dùng cho UI sinh viên. Middleware tiếp tục là lớp bảo vệ route; API và service vẫn tự kiểm tra role/quyền dữ liệu. Danh sách bài tập sinh viên chỉ gồm bài `published`, `is_active` và thuộc lớp mà RLS cho phép. Kết quả sinh viên chỉ gồm grade `published` của chính họ.

Các kiểm thử hồi quy sẽ xác nhận role cũ `User` không mở được trang kết quả và các liên kết sinh viên không trỏ vào route chấm nội bộ.

### Assignment navigation

Mọi CTA từ danh sách/chi tiết bài tập tới trang nộp dùng:

`/ui/submit_assignment?assignmentId=<assignment-id>`

CTA xem kết quả chỉ hiển thị khi `latestSubmission.gradeStatus` là kết quả đã công bố và dùng:

`/ui/my_results?submissionId=<submission-id>`

Hook nộp bài đọc `assignmentId` lúc tải dữ liệu. Nếu ID tồn tại trong danh sách được phép, nó được chọn; nếu không tồn tại thì chọn bài đầu tiên mà không tiết lộ dữ liệu.

Hook kết quả đọc `submissionId`; sau khi chuẩn hóa dữ liệu, nó chọn đúng kết quả có `submissionId` tương ứng, nếu không thì chọn kết quả đầu tiên.

### Submission validation and state

Validation client dùng cùng giới hạn nền với server:

- Tối đa một file trong UI hiện tại.
- Chỉ `.apk` hoặc `.zip`.
- Tối đa 100 MB theo giới hạn chung hiện tại.
- Repository nếu có phải là URL `https://github.com/...` hoặc `https://gitlab.com/...`.
- Nộp chính thức cần ít nhất file mới, file của bản nháp hiện tại, hoặc repository hợp lệ.
- Lưu nháp cho phép nội dung chưa hoàn chỉnh.

Một `useRef` giữ khóa mutation tức thời để chống double-click. Trong lúc gửi, chọn bài, input, upload, lưu nháp và nộp chính thức đều bị khóa. Thành công sẽ tải lại danh sách nhưng không xóa thông báo thành công; lỗi giữ nguyên dữ liệu người dùng để sửa.

### Join class

Nút tham gia lớp chỉ hiện với role `student`. Dialog chuẩn hóa mã bằng trim/uppercase, giới hạn 64 ký tự giống API và dùng khóa ref để chỉ gửi một request. Nút đóng/hủy bị khóa khi request đang chạy để trạng thái không biến mất giữa chừng. Lỗi và thành công có live region rõ ràng.

### Dashboard and results

Dashboard xem `draft` là chưa hoàn thành. Tỷ lệ hoàn thành chỉ tính `submitted` hoặc `late`; số bài cần chú ý gồm bài chưa có submission hoặc mới ở draft.

Kết quả chuẩn hóa thêm `submissionId` và ánh xạ `ai_feedback` thành `aiFeedback` trong DTO. Giao diện vẫn không hiển thị grade chưa công bố. Thống kê điểm trung bình chỉ dùng kết quả đã công bố.

### Accessibility and feedback

Các input/select/textarea có cặp `id` và `htmlFor`. Alert lỗi dùng `role="alert"`; thông báo thành công dùng `role="status"`. Nút biểu tượng và nút xóa file có `aria-label`. Trạng thái không thể nộp hiển thị lý do bằng chữ, không chỉ vô hiệu hóa nút.

## Testing Strategy

Tạo các test riêng cho sinh viên:

- `student-role-and-navigation.test.tsx`: role, CTA và route đích.
- `student-dashboard-and-class.test.tsx`: draft metric, nút tham gia lớp và khóa request.
- `student-submission-flow.test.tsx`: deep-link assignment, validation, giữ form và chống gửi lặp.
- `student-results-flow.test.tsx`: published-only mapping, AI feedback, deep-link selection và role guard.
- `student-interaction-regression.test.tsx`: label, alert, disabled state và tên truy cập.

Sau từng nhóm sửa chạy test mục tiêu. Cuối cùng chạy toàn bộ `npm test`, `npm run lint`, `npm run type-check`, `npm run build`, `git diff --check` và quét thay đổi ngoài `web/site`/tài liệu kế hoạch.

## Completion Criteria

- Không còn CTA sinh viên đi vào route giảng viên.
- Deep-link chọn đúng bài tập/kết quả.
- Không gửi lặp thao tác nộp bài hoặc tham gia lớp.
- Validation client và thông báo tiếng Việt hoạt động trước request.
- Dashboard không tính draft là hoàn thành.
- Phản hồi AI đã công bố được hiển thị.
- Toàn bộ test, type-check và production build đạt; lint không có lỗi mới.
