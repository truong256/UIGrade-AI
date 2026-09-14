# Web Supabase-Only Design

## Mục tiêu

Chuyển toàn bộ Web UIGrade AI sang một nguồn dữ liệu duy nhất là Supabase, loại bỏ hoàn toàn MongoDB/Mongoose và cơ chế JWT cũ khỏi mã nguồn Web đang chạy. Mọi luồng hiện có phải giữ nguyên hợp đồng API và trải nghiệm giao diện, đồng thời tiếp tục tuân thủ phân quyền Student/Lecturer/Admin.

## Hiện trạng đã xác minh

- Web dùng Next.js 16, React 19, TypeScript và Supabase Auth/PostgreSQL/Storage cho phần lớn luồng MVP.
- Các luồng lớp học, bài tập, bài nộp, chấm điểm, tài khoản và dashboard chính đã đi qua các dịch vụ Supabase.
- Năm nhóm API vẫn phụ thuộc trực tiếp vào MongoDB: cấu hình server, gửi email thử, báo cáo học tập, AI summary của báo cáo và nhắc hạn bài tập.
- `current-user.ts` vẫn cho phép fallback từ Supabase session sang cookie JWT được đối chiếu bằng MongoDB.
- Repository vẫn chứa Mongoose models, Mongo repositories/controllers/services, Mongo seed script và các dependencies `mongodb`, `mongoose`, `bcryptjs`, `jsonwebtoken`.
- Baseline trước thay đổi: 32 test files với 422 tests đều pass; TypeScript và production build pass; ESLint có 5 cảnh báo không chặn build.

## Phạm vi

### Bao gồm

1. Xác thực server chỉ dùng Supabase Auth và `profiles`.
2. Chuyển cấu hình hệ thống sang bảng `system_configs` của Supabase.
3. Chuyển báo cáo học tập và AI summary sang truy vấn Supabase có giới hạn theo actor.
4. Chuyển tác vụ nhắc hạn và log chống gửi trùng sang Supabase.
5. Xóa toàn bộ code MongoDB/Mongoose không còn được sử dụng trong Web.
6. Xóa dependencies, biến môi trường, seed và hướng dẫn triển khai MongoDB/JWT cũ.
7. Bổ sung migration, database types và regression tests cho kiến trúc Supabase-only.
8. Giữ nguyên response shape hiện tại để các màn hình Web không phải viết lại ngoài phần cần thiết.

### Không bao gồm

- Thay đổi ứng dụng Android.
- Thiết kế lại giao diện hoặc thêm tính năng sản phẩm mới.
- Thay đổi nhà cung cấp email hoặc AI.
- Di chuyển dữ liệu từ một MongoDB production cụ thể vì repository không chứa thông tin kết nối hay bản dump được cấp quyền.
- Kích hoạt hoặc chỉnh trực tiếp Supabase production khi chưa có kết nối dự án hợp lệ; migration phải sẵn sàng để áp dụng qua quy trình triển khai hiện có.

## Kiến trúc đích

### Xác thực và phân quyền

- `current-user.ts` chỉ gọi `supabase.auth.getUser()` để xác minh danh tính.
- Role và trạng thái tài khoản luôn lấy từ `public.profiles`; không tin `user_metadata` để phân quyền.
- Không đọc cookie `token`, không ký/xác minh JWT riêng và không fallback khi Supabase lỗi.
- Thiếu cấu hình Supabase trả 503; không có session trả 401; profile pending/locked/không hợp lệ trả 403.
- Các API người dùng dùng Supabase client gắn với session để RLS tiếp tục là lớp bảo vệ bắt buộc.

### Cấu hình hệ thống

- Tạo `SupabaseSystemConfigService` chịu trách nhiệm đọc, chuẩn hóa và cập nhật các key trong `public.system_configs`.
- API chỉ cho Admin truy cập và giữ response shape `judge`, `limits`, `email`, `backup` hiện tại.
- Các giá trị bí mật không bao giờ được trả lại nguyên văn; API tiếp tục dùng `hasApiKey` và `hasSmtpPass`.
- Việc cập nhật giữ bí mật cũ khi client gửi chuỗi rỗng và ghi `updated_by` bằng actor hiện tại.
- SMTP test sử dụng cùng service cấu hình; lỗi cấu hình phải trả thông báo tiếng Việt rõ ràng.

### Báo cáo học tập

- Tạo `SupabaseLearningReportService` với đầu vào là actor và bộ lọc `classroomId`/`assignmentId`.
- Lecturer chỉ thấy lớp do mình sở hữu và dữ liệu liên quan; Admin thấy toàn hệ thống; Student bị từ chối.
- Dữ liệu lấy từ `classes`, `class_members`, `assignments`, `submissions` và `profiles` qua client gắn session/RLS.
- Giữ nguyên cấu trúc filters, stats, phân phối điểm, xu hướng và danh sách cảnh báo mà trang báo cáo đang tiêu thụ.
- AI summary chỉ nhận dữ liệu báo cáo đã được phân quyền, không tự truy vấn bảng bằng quyền rộng hơn.

### Nhắc hạn và email

- Tạo `SupabaseAssignmentNotificationService` để tìm assignment đã publish, sinh viên đang active và các mốc nhắc hợp lệ.
- Tạo bảng `email_notification_logs` với `unique_key` duy nhất để chống gửi trùng giữa nhiều instance/serverless invocation.
- Endpoint cho phép Admin/Lecturer chạy bằng session; cron chạy bằng token server-side và một Supabase service client riêng.
- `SUPABASE_SERVICE_ROLE_KEY` chỉ tồn tại ở server, không có tiền tố `NEXT_PUBLIC_`, không được import vào Client Component và không được log.
- Mọi bảng mới bật RLS. `email_notification_logs` không cấp quyền truy cập trực tiếp cho `anon` hoặc `authenticated`; chỉ background service và database owner thao tác.
- Tác vụ ghi log theo cơ chế giữ chỗ nguyên tử trước khi gửi; nếu gửi thất bại phải ghi trạng thái lỗi để có thể retry có kiểm soát mà không gửi trùng.

## Migration cơ sở dữ liệu

Migration mới cần:

1. Chuẩn hóa các key cấu hình mặc định trong `system_configs` mà không ghi đè cấu hình đã tồn tại.
2. Tạo `email_notification_logs` với foreign keys UUID tới assignment/student, trạng thái gửi, metadata, thời gian và unique constraint cho `unique_key`.
3. Thêm index phục vụ truy vấn nhắc hạn và lịch sử gửi.
4. Bật RLS và thu hồi quyền Data API không cần thiết đối với log nội bộ.
5. Chỉ thêm RPC nếu không thể đạt tính nguyên tử bằng insert/upsert có unique constraint; RPC đặc quyền phải nằm trong schema không exposed, tự kiểm tra actor khi áp dụng và không được cấp execute cho `PUBLIC`.
6. Cập nhật `types/database.types.ts` tương ứng.

## Loại bỏ code cũ

Sau khi các luồng thay thế có regression tests và pass:

- Xóa `lib/mongodb.ts`, `lib/distributed-lock.ts`, JWT helpers cũ và Mongo seed.
- Xóa Mongoose models, repositories, controllers và services chỉ còn phục vụ MongoDB.
- Xóa hoặc viết lại tests đang mock MongoDB/legacy controllers.
- Xóa `mongodb`, `mongoose`, `bcryptjs`, `jsonwebtoken` cùng type packages không còn dùng; cập nhật lockfile bằng npm.
- Xóa `MONGODB_URI`, `JWT_SECRET` và toàn bộ hướng dẫn MongoDB khỏi `.env.example`, README/DEPLOYMENT và tài liệu Web đang được duy trì.
- Giữ các alias role chỉ khi cần tương thích dữ liệu Supabase đang tồn tại; comment không được mô tả chúng là MongoDB fallback.

## Xử lý lỗi

- Dùng một mapper lỗi Supabase thống nhất và thông báo tiếng Việt ở biên API.
- Không fallback sang nguồn dữ liệu khác khi Supabase không khả dụng.
- Lỗi quyền truy cập trả 401/403; dữ liệu không tồn tại trả 404; validation trả 400/422; thiếu cấu hình hạ tầng trả 503; lỗi nội bộ không làm lộ secret hoặc raw SQL.
- Các thao tác gửi email và cập nhật cấu hình phải chống nhấn/chạy lặp bằng trạng thái hiện có ở UI và ràng buộc phía server.

## Chiến lược kiểm thử

Mỗi thay đổi production tuân theo red-green-refactor:

1. Viết test thất bại cho hành vi Supabase mới hoặc để chứng minh dependency MongoDB còn tồn tại.
2. Chạy test mục tiêu và xác nhận thất bại đúng lý do.
3. Viết code tối thiểu để test pass, sau đó refactor khi test vẫn xanh.
4. Bổ sung test cho 401/403/404, actor scope, Supabase unavailable, cấu hình bí mật, dedupe reminder và retry lỗi gửi mail.
5. Thêm architecture test kiểm tra runtime Web không import MongoDB/Mongoose/JWT cũ và `package.json` không chứa dependencies tương ứng.
6. Chạy toàn bộ `npm test`, `npm run lint`, `npx tsc --noEmit`, `npm run build`, `git diff --check` và secret scan trước khi kết luận.

## Tiêu chí hoàn thành

- Không còn runtime import hoặc package dependency MongoDB/Mongoose/JWT riêng trong `web/site`.
- Năm nhóm API còn lại chạy qua Supabase và giữ hợp đồng dữ liệu cho UI hiện tại.
- Web hoạt động chỉ với Supabase/Auth/Storage cùng các biến email/AI/runner cần thiết; không yêu cầu `MONGODB_URI` hoặc `JWT_SECRET`.
- RLS được bật cho mọi bảng exposed mới; background secret không xuất hiện trong bundle phía client.
- Tất cả test, lint không lỗi, typecheck và production build đều pass.
- Không sửa file Android và không đưa secret thật vào Git.

## Thứ tự triển khai

1. Cố định kiến trúc Supabase-only và auth bằng regression tests.
2. Chuyển system config và email test.
3. Chuyển learning report và AI summary.
4. Chuyển reminder job cùng log chống trùng.
5. Xóa toàn bộ legacy modules/dependencies/docs.
6. Chạy verification đầy đủ và rà soát diff theo phạm vi Web.
