# 🎓 UIGrade AI - Hệ Thống Chấm Điểm Giao Diện Android Tự Động & Thông Minh

UIGrade AI là nền tảng quản lý học tập và chấm điểm giao diện ứng dụng Android (Jetpack Compose & XML) tự động dành cho các trường đại học và cơ sở giáo dục đào tạo ngành Công nghệ thông tin.

Hệ thống kết hợp kiểm thử thị giác (Visual Testing), so khớp cấu trúc cây giao diện (Layout Inspector Tree matching) và mô hình ngôn ngữ AI (Google Gemini) để chấm điểm bài nộp của sinh viên theo tiêu chí Rubric chi tiết và khách quan.

---

## 🌊 Giao Diện & Bảng Màu Chuẩn (Ocean Blue Palette)

Dự án được thiết kế theo phong cách giáo dục hiện đại, chuyên nghiệp với tông màu chủ đạo **Xanh Nước Biển (Ocean Blue / Sky Blue)**:

- **Primary**: `#0284C7` (`sky-600`) - Nút chính, thương hiệu, badge chính.
- **Primary Hover**: `#0369A1` (`sky-700`) - Trạng thái tương tác chuột.
- **Secondary**: `#0EA5E9` (`sky-500`) - Điểm nhấn biểu đồ, icon nổi bật.
- **Accent**: `#38BDF8` (`sky-400`) - Đường dẫn, glow, viền active.
- **Background Main**: `#F0F9FF` (`sky-50`) - Nền trang chính dịu mắt.
- **Surface**: `#FFFFFF` - Nền thẻ card, modal, bảng dữ liệu.
- **Text Main**: `#0F172A` (`slate-900`) & **Text Muted**: `#475569` (`slate-600`).
- **Trạng thái**: Thành công (`#16A34A`), Cảnh báo (`#F59E0B`), Lỗi (`#DC2626`).

---

## 🚀 Công Nghệ Sử Dụng

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Material Symbols.
- **Backend & API**: Next.js Server Components, API Route Handlers, Zod Validation.
- **Cơ sở dữ liệu & Auth**: **Supabase** (PostgreSQL, Row Level Security - RLS, Supabase Auth, Supabase Storage).
- **Trí tuệ nhân tạo (AI)**: Google Gemini API & Multi-modal Vision Analysis.
- **Kiểm thử tự động**: Vitest (Unit & Integration Tests), ESLint 9, TypeScript Strict Typechecking.

---

## 📦 Hướng Dẫn Cài Đặt & Cấu Hình

### 1. Yêu cầu môi trường
- Node.js version `>= 20.0.0`
- Quản lý gói: `npm` (hoặc `pnpm` / `yarn`)

### 2. Cài đặt các gói phụ thuộc
```bash
npm install
```

### 3. Cấu hình biến môi trường (`.env.local`)
Tạo tệp `.env.local` tại thư mục gốc của dự án:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase Credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# AI Evaluation
GEMINI_API_KEY=your-gemini-api-key

# Email Server (Tùy chọn)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="UIGrade AI <noreply@uigrade.edu.vn>"
```

---

## 🗄️ Thiết Lập Supabase Database & Storage

Hệ thống cung cấp sẵn các tệp migration SQL đầy đủ trong thư mục `supabase/migrations/`:

1. **Schema & Tables**: `supabase/migrations/20260828000001_initial_schema.sql`
   - Bảng `profiles`: Thông tin người dùng, MSSV, vai trò (`student`, `lecturer`, `teacher`, `admin`).
   - Bảng `classes` & `class_members`: Quản lý lớp học, sinh viên tham gia bằng mã lớp.
   - Bảng `assignments`: Tiêu chí Rubric, kịch bản test, ảnh baseline UI, hạn nộp.
   - Bảng `submissions` & `grading_history`: Bài nộp APK, source ZIP, lịch sử chấm điểm.
   - Bảng `notifications` & `system_configs`: Thông báo và cấu hình hệ thống.
2. **Row Level Security (RLS)**: `supabase/migrations/20260828000002_rls_policies.sql`
   - Bảo vệ phân quyền chặt chẽ: Sinh viên chỉ xem bài của mình; Giảng viên quản lý lớp & bài tập do mình phụ trách; Quản trị viên toàn quyền.
3. **Storage Buckets**: `supabase/migrations/20260828000003_storage_setup.sql`
   - Tạo các bucket: `submissions_apk`, `assignments_attachment`, `avatars`, `baseline_images`.

---

## 🔑 Tài Khoản Mẫu Kiểm Thử (Demo Seed Accounts)

| Vai trò | Email | Mật khẩu mặc định | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@uigrade.edu.vn` | `Admin@123456` | Quản trị hệ thống, server config, người dùng |
| **Giảng viên (Lecturer)** | `giangvien@uigrade.edu.vn` | `Teacher@123456` | Tạo lớp học, ra đề bài tập, chấm điểm Rubric |
| **Sinh viên 1 (Student)** | `sinhvien1@uigrade.edu.vn` | `Student@123456` | Ghi danh lớp bằng mã, nộp bài APK, xem kết quả |
| **Sinh viên 2 (Student)** | `sinhvien2@uigrade.edu.vn` | `Student@123456` | Sinh viên kiểm thử nộp bài và nhận phản hồi |

---

## 🛠️ Các Lệnh Thao Tác Trong Dự Án

- **Khởi chạy môi trường phát triển (Dev Server)**:
  ```bash
  npm run dev
  ```
  Truy cập hệ thống tại: [http://localhost:3000](http://localhost:3000)

- **Chạy kiểm thử tự động (Unit & Integration Tests)**:
  ```bash
  npm test
  ```

- **Kiểm tra cú pháp & quy chuẩn mã nguồn (ESLint)**:
  ```bash
  npm run lint
  ```

- **Kiểm tra biên dịch TypeScript (Typecheck)**:
  ```bash
  npx tsc --noEmit
  ```

- **Đóng gói phiên bản phát hành (Production Build)**:
  ```bash
  npm run build
  ```

---

## 📄 Bản Quyền & Giấy Phép

Phát triển bởi đội ngũ Kỹ sư Phần mềm UIGrade AI dành cho hệ thống giáo dục đại học.
