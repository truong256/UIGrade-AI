# Hướng Dẫn Áp Dụng Migration RLS Security & Database Triggers: `20260902000001_fix_rls_security.sql`

> [!WARNING]
> **KHÔNG tự động chạy migration này trực tiếp trên môi trường Production mà không có quy trình review & backup.**
> Việc apply migration trên Production phải do DBA hoặc người quản trị hệ thống thực hiện có kiểm soát.

---

## 1. Mục Đích & Nội Dung Migration

Migration này khắc phục triệt để các lỗ hổng phân quyền cấp cơ sở dữ liệu (Row Level Security - RLS) và ngăn chặn bypass nghiệp vụ qua API PostgREST trực tiếp trên Supabase:

1. **Bảo mật hàm `SECURITY DEFINER`**: Bổ sung `SET search_path = public, pg_temp;` cho `is_admin()`, `is_lecturer()`, `is_lecturer_or_admin()` nhằm ngăn chặn tấn công chiếm quyền qua thao tác `search_path`.
2. **Siết chặt quyền đọc bảng `profiles`**: Thay vì cho phép mọi người dùng đã đăng nhập đọc toàn bộ profile của hệ thống, chính sách mới chỉ cho phép:
   - Người dùng xem chính mình.
   - Admin xem tất cả.
   - Giảng viên xem sinh viên trong các lớp mình phụ trách.
   - Sinh viên xem bạn cùng lớp (chung lớp học).
3. **Bảo vệ bảng `system_configs`**: Chỉ `admin` mới được đọc cấu hình hệ thống (trước đây mọi user đăng nhập đều đọc được).
4. **Chặn tự leo quyền (Privilege Escalation)**: Chính sách `UPDATE` trên `profiles` và Trigger `trg_prevent_self_role_escalation` kiểm tra nghiêm ngặt không cho phép người dùng tự thay đổi trường `role` của chính mình.
5. **Bảo vệ Last-Admin ở cấp Database Engine với Advisory Lock**: Trigger `trg_protect_last_admin` sử dụng `pg_advisory_xact_lock(hashtext('admin_last_invariant_lock'))` để tuần tự hóa các transaction đồng thời, ngăn chặn bất kỳ Admin nào xóa, hạ quyền, hoặc khóa Admin cuối cùng kể cả khi gọi trực tiếp qua Supabase REST/PostgREST.

---

## 2. Bảng, Policies & Triggers Bị Ảnh Hưởng

| Bảng | Thao tác | Policy / Trigger | Mô tả |
|---|---|---|---|
| `public.profiles` | `SELECT` | `Profiles viewable by self, classmates, or admin` | Chỉ xem bản thân, bạn cùng lớp, hoặc admin xem tất cả |
| `public.profiles` | `UPDATE` | `Users can update their own profile (not role)` | User không sửa được `role` |
| `public.profiles` | `ALL` | `Admins can update any profile` | Admin quản lý profiles |
| `public.profiles` | `UPDATE/DELETE` | Trigger: `trg_protect_last_admin` | Sử dụng `pg_advisory_xact_lock` ngăn xóa/hạ quyền/khóa Admin cuối cùng |
| `public.profiles` | `UPDATE` | Trigger: `trg_prevent_self_role_escalation` | Chặn non-admin sửa trường `role` |
| `public.system_configs` | `SELECT` | `Only admins can read system configs` | Chỉ Admin đọc cấu hình |

---

## 3. Quy Trình Chuẩn Bị & Sao Lưu Trước Khi Apply

### Bước 1: Sao lưu cơ sở dữ liệu
```bash
# Sử dụng Supabase CLI để export dữ liệu hiện tại
supabase db dump -f backup_before_rls_fix_$(date +%Y%m%d).sql
```
Hoặc trên Supabase Dashboard: Vào **Database** -> **Backups** -> Tạo manual backup snapshot.

### Bước 2: Kiểm tra trên môi trường Staging / Local
```bash
# Chạy migration trên Supabase local (Docker)
supabase migration up
```

---

## 4. Các Câu Truy Vấn Kiểm Tra (SQL Verification Queries)

Sau khi chạy migration trên staging/production, thực hiện các câu truy vấn sau trong SQL Editor để xác nhận:

### 4.1. Kiểm tra functions đã được gán search_path an toàn
```sql
SELECT proname, prosecdef, proconfig
FROM pg_proc
WHERE proname IN ('is_admin', 'is_lecturer', 'is_lecturer_or_admin', 'enforce_last_admin_protection', 'prevent_self_role_escalation');
-- Kỳ vọng: prosecdef = true, proconfig chứa {search_path=public, pg_temp}
```

### 4.2. Kiểm tra RLS policies trên bảng profiles
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';
-- Kỳ vọng: Thấy policy "Profiles viewable by self, classmates, or admin"
```

### 4.3. Kiểm tra Triggers bảo vệ Last Admin
```sql
SELECT tgname, tgrelid::regclass, tgenabled
FROM pg_trigger
WHERE tgname IN ('trg_protect_last_admin', 'trg_prevent_self_role_escalation');
-- Kỳ vọng: Cả 2 trigger đều tồn tại và tgenabled = 'O' (Origin/Enabled)
```

---

## 5. Kế Hoạch Rollback (Nếu Cần Thiết)

Nếu có sự cố không tương thích với frontend cũ trên staging, có thể chạy đoạn SQL sau để rollback về trạng thái trước:

```sql
-- ROLLBACK SCRIPT:
DROP TRIGGER IF EXISTS trg_protect_last_admin ON public.profiles;
DROP FUNCTION IF EXISTS public.enforce_last_admin_protection();

DROP TRIGGER IF EXISTS trg_prevent_self_role_escalation ON public.profiles;
DROP FUNCTION IF EXISTS public.prevent_self_role_escalation();

DROP POLICY IF EXISTS "Profiles viewable by self, classmates, or admin" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Only admins can read system configs" ON public.system_configs;
CREATE POLICY "System configs viewable by authenticated users"
ON public.system_configs FOR SELECT TO authenticated USING (true);
```
