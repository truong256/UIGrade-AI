# Hướng Dẫn Áp Dụng Migration RLS Security: `20260902000001_fix_rls_security.sql`

> [!WARNING]
> **KHÔNG tự động chạy migration này trực tiếp trên môi trường Production mà không có quy trình review & backup.**
> Việc apply migration trên Production phải do DBA hoặc người quản trị hệ thống thực hiện có kiểm soát.

---

## 1. Mục Đích & Nội Dung Migration

Migration này khắc phục các lỗ hổng phân quyền cấp cơ sở dữ liệu (Row Level Security - RLS) trên Supabase:

1. **Bảo mật hàm `SECURITY DEFINER`**: Bổ sung `SET search_path = public, pg_temp;` cho `is_admin()`, `is_lecturer()`, `is_lecturer_or_admin()` nhằm ngăn chặn tấn công chiếm quyền qua thao tác `search_path`.
2. **Siết chặt quyền đọc bảng `profiles`**: Thay vì cho phép mọi người dùng đã đăng nhập đọc toàn bộ profile của hệ thống, chính sách mới chỉ cho phép:
   - Người dùng xem chính mình.
   - Admin xem tất cả.
   - Giảng viên xem sinh viên trong các lớp mình phụ trách.
   - Sinh viên xem bạn cùng lớp (chung lớp học).
3. **Bảo vệ bảng `system_configs`**: Chỉ `admin` mới được đọc cấu hình hệ thống (trước đây mọi user đăng nhập đều đọc được).
4. **Chặn tự leo quyền (Privilege Escalation)**: Chính sách `UPDATE` trên `profiles` kiểm tra nghiêm ngặt không cho phép người dùng tự thay đổi trường `role` của chính mình.

---

## 2. Bảng & Policies Bị Ảnh Hưởng

| Bảng | Thao tác | Policy cũ | Policy mới |
|---|---|---|---|
| `public.profiles` | `SELECT` | `Profiles are viewable by authenticated users` (public toàn bộ) | `Profiles viewable by self, classmates, or admin` (cô lập) |
| `public.profiles` | `UPDATE` | `Users can update their own profile (except role)` | `Users can update their own profile (not role)` |
| `public.system_configs` | `SELECT` | `System configs viewable by authenticated users` | `Only admins can read system configs` |

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
WHERE proname IN ('is_admin', 'is_lecturer', 'is_lecturer_or_admin');
-- Kỳ vọng: prosecdef = true, proconfig chứa {search_path=public, pg_temp}
```

### 4.2. Kiểm tra RLS policies trên bảng profiles
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';
-- Kỳ vọng: Thấy policy "Profiles viewable by self, classmates, or admin"
```

### 4.3. Kiểm tra RLS policies trên bảng system_configs
```sql
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'system_configs';
-- Kỳ vọng: Thấy policy "Only admins can read system configs"
```

---

## 5. Kế Hoạch Rollback (Nếu Cần Thiết)

Nếu có sự cố không tương thích với frontend cũ trên staging, có thể chạy đoạn SQL sau để rollback về trạng thái trước:

```sql
-- ROLLBACK SCRIPT:
DROP POLICY IF EXISTS "Profiles viewable by self, classmates, or admin" ON public.profiles;
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Only admins can read system configs" ON public.system_configs;
CREATE POLICY "System configs viewable by authenticated users"
ON public.system_configs FOR SELECT TO authenticated USING (true);
```
