# Kiểm Toán An Toàn Thông Tin & Kiến Trúc Bảo Mật (Security Architecture & Audit)

> **Tài liệu kiểm toán bảo mật và phân tích các biện pháp kiểm soát kỹ thuật trong UIGrade AI**
>
> *Tham gia Cuộc thi "Phát triển phần mềm mã nguồn mở tích hợp AI 2026"*

---

## 1. Tổng Quan Triết Lý Bảo Mật

UIGrade AI áp dụng nguyên lý **Phòng thủ theo chiều sâu (Defense-in-Depth)** và **Đặc quyền tối thiểu (Principle of Least Privilege)**. Hệ thống không chỉ dựa vào các bộ lọc tại tầng giao diện hoặc API, mà thiết lập các rào chắn cưỡng chế tại cấp động cơ cơ sở dữ liệu (Database Engine Level) thông qua PostgreSQL Row Level Security (RLS) và Database Triggers.

Báo cáo này mô tả chi tiết từng cơ chế kiểm soát kỹ thuật (Technical Controls) tương ứng với từng mối đe dọa thực tế.

---

## 2. Ma Trận Các Biện Pháp Kiểm Soát An Ninh (Security Controls Matrix)

| Lĩnh vực kiểm soát | Mối đe dọa an ninh | Cơ chế kiểm soát kỹ thuật cụ thể trong Source Code | Tệp tin / Migration chịu trách nhiệm |
|---|---|---|---|
| **1. Authentication (Xác thực)** | Giả mạo danh tính, brute force mật khẩu, đăng ký hàng loạt | Supabase Auth quản lý mã hóa bcrypt, Google OAuth 2.0 một chạm, xác thực email học thuật `.edu.vn` | `proxy.ts`, `auth.supabase.ts`, migration `20260912000001` |
| **2. Session Handling (Quản lý phiên)** | Đánh cắp token qua XSS, rò rỉ phiên làm việc | Token được lưu trữ trong **HTTP-only, Secure, SameSite=Lax Cookie**; tự động làm mới qua `@supabase/ssr` | `web/site/lib/supabase/client.ts`, `proxy.ts` |
| **3. OAuth Flow & Redirects** | Tấn công Open Redirect, lỗi đăng nhập hai lần, sai lệch callback origin | Kiểm tra strict redirect URL, giải mã an toàn `returnTo`, đồng bộ origin giữa Vercel Production và localhost qua header `x-forwarded-host` | `web/site/app/auth/callback/route.ts`, `app-url.ts`, `tests/oauth-callback-cookie.test.ts` |
| **4. Role Isolation (Phân lập vai trò)** | Sinh viên thao tác tính năng giảng viên; người dùng thường vào trang admin | Kiểm tra vai trò 2 lớp: Application Guards (`requireStudent`, `requireLecturer`, `requireAdmin`) và RLS Policies | `web/site/lib/authorization.ts`, `web/site/proxy.ts` |
| **5. Supabase RLS (Phân quyền DB)** | Bypass logic nghiệp vụ thông qua gọi trực tiếp PostgREST API | RLS kích hoạt trên 100% các bảng; các hàm `SECURITY DEFINER` được thiết lập `SET search_path = public, pg_temp;` | `20260902000001_fix_rls_security.sql`, `20260909000001_mvp_security_lockdown.sql` |
| **6. IDOR Protection (Chống IDOR)** | Đọc trộm bài nộp, sửa bài tập của lớp khác bằng cách đổi ID trên URL | Kiểm tra quan hệ sở hữu kép: sinh viên chỉ xem `submission.student_id = auth.uid()`; giảng viên chỉ truy cập `class.lecturer_id = auth.uid()` | `web/site/services/supabase/submission.supabase.ts`, RLS policies |
| **7. Storage Access (Bảo vệ file)** | Tải trái phép mã nguồn của học sinh khác từ link Storage | Storage Buckets ở chế độ Private; chỉ truy xuất qua **Signed URLs có thời hạn ngắn (Short-lived signed URLs)** kèm kiểm tra quyền truy cập | `web/site/services/supabase/storage.supabase.ts` |
| **8. Submission Ownership (Sở hữu bài)** | Nộp bài thay cho bạn, ghi đè bài nộp sau deadline | Hàm `save_student_submission` (`SECURITY DEFINER`) tự động trích xuất `auth.uid()` từ JWT, kiểm tra hạn chót nộp bài và giới hạn số lần nộp | `20260911000001_harden_submission_and_profile_privacy.sql` |
| **9. Grade Visibility (Bảo mật điểm)** | Sinh viên xem trộm điểm hoặc nhận xét AI trước khi giáo viên duyệt | Cờ `is_published = false` ngăn chặn truy vấn ở cả cấp RLS Database và API response; sinh viên chỉ thấy kết quả khi `is_published = true` | `20260910000002_isolate_ai_grading_suggestions.sql`, `grading.supabase.ts` |
| **10. Admin Protection (Bảo vệ Admin)** | Admin vô tình tự khóa mình hoặc xóa tài khoản Admin duy nhất làm tê liệt hệ thống | Trigger `trg_protect_last_admin` sử dụng khóa giao dịch cố vấn `pg_advisory_xact_lock(hashtext('admin_last_invariant_lock'))` chặn xóa/khóa Last-Admin | `20260902000001_fix_rls_security.sql`, `user-management.service.ts` |
| **11. Self-Role Escalation (Chống tự leo quyền)** | Người dùng gửi payload giả mạo sửa trường `role: "admin"` | Trigger `trg_prevent_self_role_escalation` kiểm tra và ném exception nếu người dùng không phải Admin tìm cách thay đổi trường `role` | `20260902000001_fix_rls_security.sql` |
| **12. ZIP / File Validation (An toàn file nén)** | Tấn công Zip Slip, Path Traversal, chèn file độc vào máy chủ | Dịch vụ giải nén an toàn chuẩn hóa đường dẫn (`path.normalize`), kiểm tra `!targetPath.startsWith(extractDir)`, giới hạn kích thước file | `web/site/services/runner.service.ts` |
| **13. Secret Management (Quản lý khóa)** | Lộ khóa bí mật Service Role Key hoặc AI Key lên Git/Client | Khóa Service Role và Gemini API Key chỉ lưu trong biến môi trường server-side (`.env.local`), không bao giờ xuất hiện tiền tố `NEXT_PUBLIC_` | `.env.example`, `.gitignore`, `web-ci.yml` |

---

## 3. Phân Tích Kỹ Thuật Chi Tiết Từng Hạng Mục

### 3.1. Xác Thực & Ràng Buộc Tên Miền Giáo Dục
Hệ thống hỗ trợ hai phương thức xác thực thông qua Supabase Auth:
1. **Google OAuth 2.0:** Tích hợp trực tiếp qua luồng OAuth PKCE an toàn, giảm thiểu rủi ro đặt mật khẩu yếu.
2. **Đăng ký Bằng Email Giáo dục:** Để đảm bảo tính chính danh trong môi trường học thuật, hàm kiểm tra email cưỡng chế quy tắc:
   ```typescript
   function isEducationEmail(value: string) {
       const email = value.trim().toLowerCase();
       const domain = email.split("@")[1] || "";
       return Boolean(email && (domain === "edu.vn" || domain.endsWith(".edu.vn")));
   }
   ```
   Quy tắc này cũng được sao chép và thực thi bằng Trigger tại cơ sở dữ liệu nhằm ngăn chặn việc bypass qua việc gọi REST API trực tiếp.

### 3.2. Ngăn Ngừa Lỗ Hổng IDOR (Insecure Direct Object References)
Trong một hệ thống giáo dục, nguy cơ học sinh đổi ID trên thanh địa chỉ URL để xem bài tập, mã nguồn hoặc điểm số của bạn cùng lớp là rất lớn. UIGrade AI bảo vệ đa tầng:
- **Tầng 1 - Truy vấn có điều kiện người sở hữu:** Các truy vấn lấy bài nộp luôn bổ sung điều kiện lọc `user_id = actor.id` hoặc `class_id IN (các lớp giảng viên phụ trách)`.
- **Tầng 2 - Cưỡng chế RLS trên bảng `submissions`:**
  ```sql
  CREATE POLICY "Students can view own submissions"
  ON public.submissions FOR SELECT
  USING (auth.uid() = student_id);
  ```

### 3.3. Bảo Mật Cấp Lưu Trữ (Supabase Storage Access)
- Không bật chế độ Public Bucket cho mã nguồn sinh viên.
- Toàn bộ đường dẫn tải file `.zip` đều được ký bằng cơ chế HMAC thông qua hàm `createSignedUrl` với thời gian hết hạn (Time-To-Live) chỉ vài phút.
- Giảng viên chỉ có thể lấy link ký sau khi API đã xác nhận giảng viên đó thực sự phụ trách lớp học chứa bài tập tương ứng.

### 3.4. Bảo Vệ Quản Trị Viên Cuối Cùng (Last Admin Invariant Lock)
Để giải quyết bài toán tranh chấp đồng thời (race condition) khi hai Admin cùng lúc thao tác hạ quyền hoặc xóa nhau:
```sql
CREATE OR REPLACE FUNCTION public.enforce_last_admin_protection()
RETURNS TRIGGER AS $$
DECLARE
  v_admin_count INT;
BEGIN
  -- Tuần tự hóa giao dịch bằng khóa cố vấn cấp transaction
  PERFORM pg_advisory_xact_lock(hashtext('admin_last_invariant_lock'));

  IF (TG_OP = 'DELETE' AND OLD.role = 'admin') OR
     (TG_OP = 'UPDATE' AND OLD.role = 'admin' AND (NEW.role <> 'admin' OR NEW.status <> 'active')) THEN
    SELECT COUNT(*) INTO v_admin_count FROM public.profiles WHERE role = 'admin' AND status = 'active';
    IF v_admin_count <= 1 THEN
      RAISE EXCEPTION 'Không thể xóa, hạ quyền hoặc khóa tài khoản Quản trị viên cuối cùng của hệ thống.';
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
```

### 3.5. Kiểm Soát An Toàn Khi Giải Nén Tệp Tin (Zip Slip Protection)
Khi xử lý tệp `.zip` do sinh viên tải lên:
```typescript
for (const entry of zipEntries) {
    const rawPath = entry.entryName;
    // Chống Zip Slip: chuẩn hóa và kiểm tra đường dẫn đích
    const resolvedPath = path.resolve(extractDir, rawPath);
    if (!resolvedPath.startsWith(path.resolve(extractDir) + path.sep)) {
        throw new Error(`Phát hiện đường dẫn không an toàn trong tệp nén: ${rawPath}`);
    }
}
```

---

## 4. Quản Lý Khóa Bí Mật & Tuân Thủ CI/CD

1. **Không Commit Khóa Bí Mật:**
   - Kho Git được bảo vệ bằng file `.gitignore` nghiêm ngặt, loại bỏ `.env`, `.env.local`, `.env.*.local`.
   - Các tệp mẫu `.env.example` chỉ sử dụng các chuỗi giả định (placeholder) như `https://placeholder-project.supabase.co`.
2. **Cấu Hình Môi Trường CI Tự Động:**
   - Pipeline GitHub Actions (`.github/workflows/web-ci.yml`) sử dụng các biến placeholder an toàn để chạy build và unit test mà không cần truy cập cơ sở dữ liệu thật.
3. **Quy Trình Xử Lý Sự Cố Khóa (Credential Rotation):**
   - Được định nghĩa rõ trong [../SECURITY.md](../SECURITY.md): Trong trường hợp nghi ngờ lộ khóa, quản trị viên sẽ tiến hành thu hồi và sinh khóa mới ngay lập tức trên dashboard của Supabase và Google AI Studio, sau đó mới dọn dẹp lịch sử Git.
