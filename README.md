# UIGrade AI

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-cyan)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Tests-51%20suites%20%7C%20444%20passed-brightgreen)](https://vitest.dev/)
[![Live Demo](https://img.shields.io/badge/Demo-Live%20on%20Vercel-success)](https://site-truong257.vercel.app)

> **Nền tảng Đánh giá Giao diện Người dùng và Chấm bài Lập trình Android Tích hợp Trí tuệ Nhân tạo Đa phương thức**
>
> Đề tài tham gia Cuộc thi *"Phát triển phần mềm mã nguồn mở tích hợp AI 2026"* (Bảng thi Phần mềm mã nguồn mở).

---

## 1. Tổng quan

**UIGrade AI** là nền tảng mã nguồn mở phục vụ giảng dạy, thực hành và chấm điểm tự động các bài tập lập trình giao diện di động (Android UI). Hệ thống kết hợp giữa công cụ đo đạc kỹ thuật tất định (Deterministic Runner) và mô hình trí tuệ nhân tạo đa phương thức (Multimodal AI) nhằm tự động hóa quá trình đánh giá bài tập giao diện, giảm tải 80% thời gian chấm bài cho giảng viên và cung cấp phản hồi trực quan có bằng chứng kỹ thuật tức thì cho sinh viên.

---

## 2. Vấn đề

Trong đào tạo kỹ thuật phần mềm và phát triển ứng dụng di động:
- **Chấm bài thủ công tốn kém thời gian:** Giảng viên phải mở từng dự án trong Android Studio, build, chạy trên máy ảo để so sánh bằng mắt (15–25 phút/bài). Với lớp 50–100 sinh viên, giảng viên quá tải và dễ thiên lệch.
- **Phản hồi sinh viên chậm trễ và chung chung:** Sinh viên nhận điểm sau 1–2 tuần mà không rõ thuộc tính layout nào bị sai, độ tương phản màu sắc WCAG lệch ở đâu.
- **Rủi ro của AI "Hộp Đen" (Black-box AI Hallucination):** Nếu chỉ dùng LLM thông thường để chấm mã nguồn, mô hình dễ bị ảo giác, bịa ra lỗi hoặc cho điểm không căn cứ, không thể dùng làm điểm đánh giá học phần chính thức.
- **Nguy cơ an ninh khi nhận bài nộp:** Tệp nén `.zip` của sinh viên tiềm ẩn nguy cơ bảo mật hệ thống (Zip Slip, Path Traversal).

---

## 3. Giải pháp

UIGrade AI giải quyết bài toán trên bằng triết lý kiến trúc ba tầng:

> **"Deterministic First — Multimodal AI Second — Human-in-the-Loop Always"**

1. **Đo đạc tất định (Deterministic First):** Mọi yếu tố kỹ thuật kiểm tra được bằng toán học (cấu trúc tệp, XML layout, SSIM, MSE, độ tương phản WCAG) được đo lường khách quan bằng Runner.
2. **AI có bằng chứng (Evidence Grounding):** Trí tuệ nhân tạo (Gemini 2.5) chỉ phân tích ngữ nghĩa, tổ chức mã và trải nghiệm người dùng; bắt buộc phải trích dẫn mã định danh bằng chứng cụ thể (`evidenceIds`).
3. **Giảng viên phê duyệt (Human-in-the-Loop):** AI chỉ đóng vai trò trợ tá đưa ra khuyến nghị điểm số sơ bộ (`needs_teacher_review`). Điểm số chỉ được phát hành cho sinh viên khi giảng viên đã thẩm định và phê duyệt chính thức.

---

## 4. Tính năng chính

### Dành cho Sinh viên (Student)
- Tham gia lớp học nhanh chóng qua mã mời (Invite Code).
- Xem danh sách bài tập, hạn nộp và tiêu chí Rubric minh bạch.
- Nộp bài nháp (Draft) hoặc bài chính thức (Final) dưới dạng file `.zip`.
- Xem lịch sử nộp bài và trạng thái xử lý.
- Xem bảng điểm chính thức, nhận xét chi tiết từng tiêu chí, ảnh so sánh trực quan (Visual Diff) và gợi ý cải thiện sau khi giảng viên đã công bố.

### Dành cho Giảng viên (Lecturer)
- Quản lý lớp học, duyệt danh sách sinh viên.
- Tạo bài tập với Rubric thông minh: dán văn bản tự nhiên để AI tự động trích xuất tiêu chí và cân bằng điểm số.
- Tải lên ảnh giao diện mẫu (UI Baseline) và cấu hình Runner.
- Không gian chấm bài trực quan (Grading Workspace): xem đồng thời ảnh bài nộp, ảnh mẫu, ảnh diff, log runner và đề xuất từ AI.
- Điều chỉnh/ghi đè điểm (Manual Override) và bấm phát hành kết quả (Publish Grade).
- Theo dõi biểu đồ phổ điểm và phân tích học tập của lớp.

### Dành cho Quản trị viên (Admin)
- Quản lý tài khoản toàn hệ thống, tìm kiếm và phân trang người dùng.
- Phân quyền (Student / Lecturer / Admin) và khóa/kích hoạt tài khoản.
- Cấu hình hệ thống và dịch vụ gửi email SMTP.
- Cơ chế bảo vệ bất biến: không cho phép tự khóa tài khoản hoặc xóa Quản trị viên cuối cùng.

---

## 5. Kiến trúc

Hệ thống được phát triển theo kiến trúc monorepo phân tầng rõ rệt:

```text
UIGrade AI/
├── docs/                        # Hồ sơ kỹ thuật và báo cáo tuân thủ cuộc thi
│   ├── SOLUTION_DESCRIPTION.md  # Đặc tả giải pháp chi tiết
│   ├── ARCHITECTURE.md          # Kiến trúc hệ thống tổng thể
│   ├── AI_GRADING.md            # Quy trình chấm AI & Evidence Grounding
│   ├── SECURITY.md              # Kiểm toán an toàn thông tin & RLS
│   ├── THIRD_PARTY_NOTICES.md   # Danh mục thành phần bên thứ ba
│   └── COMPETITION_COMPLIANCE.md# Báo cáo tuân thủ thể lệ cuộc thi
│
├── web/
│   ├── site/                    # [SẢN PHẨM CHÍNH] Nền tảng Web Portal
│   │   ├── app/                 # Next.js 16 App Router (UI & 53 API endpoints)
│   │   ├── components/          # React 19 UI Components (Soft UI, Auth, Grading)
│   │   ├── services/            # Runner, AI Grader-Critic, Supabase Data Services
│   │   ├── lib/                 # Authorization, Grading Contract, Supabase Clients
│   │   ├── tests/               # 51 Vitest test suites (444 tests)
│   │   ├── supabase/            # 18 PostgreSQL migration files & seed data
│   │   └── .env.example         # Biến môi trường mẫu
│   │
│   └── project-files/           # Dữ liệu thực nghiệm, đề cương NCKH & baseline
│
├── app/                         # [ỨNG DỤNG ĐỒNG HÀNH] Android Native App
│   ├── src/main/java/com/uigrade/ai/ # Kotlin, Jetpack Compose, Hilt DI, Material 3
│   └── build.gradle.kts         # Cấu hình build Android (SDK 35)
│
├── .github/workflows/           # CI/CD Workflows tự động kiểm thử
├── LICENSE                      # Giấy phép mã nguồn mở MIT
├── NOTICE.md                    # Thông cáo bản quyền bên thứ ba
├── CHANGELOG.md                 # Lịch sử thay đổi Keep a Changelog
├── CONTRIBUTING.md              # Hướng dẫn đóng góp mã nguồn
└── SECURITY.md                  # Chính sách bảo mật dự án
```

Chi tiết xem tại **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

---

## 6. AI Grading Pipeline

Quy trình chấm điểm kết hợp tự động diễn ra qua 10 bước nghiêm ngặt:

```text
[Sinh viên nộp .zip]
         ↓
[Giải nén an toàn] ──► Chống Zip Slip & Path Traversal
         ↓
[Kiểm tra Tất định] ──► Cấu trúc AndroidManifest, Layout XML, SSIM, WCAG
         ↓
[Đóng gói Bằng chứng] ──► Gán Evidence IDs cho từng file, snippet, và metric
         ↓
[AI Grader (Stage 1)] ──► Gemini 2.5 đề xuất điểm kèm Evidence IDs bắt buộc
         ↓
[AI Critic (Stage 2)] ──► Rà soát độc lập, phát hiện hallucination (ACCEPT / ADJUST / REVIEW)
         ↓
[Zod Validation] ──► Ràng buộc kiểu dữ liệu, giới hạn thang điểm tối đa
         ↓
[Khuyến nghị Sơ bộ] ──► Lưu CSDL ở trạng thái is_published = false
         ↓
[Giảng viên Thẩm định] ──► Xem xét ảnh đối chiếu, điều chỉnh điểm nếu cần
         ↓
[Xuất bản (Publish)] ──► Điểm số chính thức hiển thị cho sinh viên
```

Chi tiết xem tại **[docs/AI_GRADING.md](docs/AI_GRADING.md)**.

---

## 7. Human-in-the-loop

UIGrade AI triệt để tuân thủ nguyên tắc con người làm chủ:
- **AI không bao giờ tự ý công bố điểm:** Mọi kết quả chấm máy đều lưu ở trạng thái `needs_teacher_review` và `is_published = false`.
- **Cơ sở dữ liệu cô lập kết quả:** Chính sách Supabase Row-Level Security (RLS) chặn đứng quyền đọc của sinh viên đối với các bài nộp chưa được giảng viên `publish`.
- **Giảng viên có toàn quyền:** Giảng viên có thể sửa điểm từng tiêu chí thành phần, nhập nhận xét sư phạm bổ sung hoặc ghi đè toàn bộ điểm số bài thi.

---

## 8. Công nghệ

- **Web Frontend:** Next.js 16.2.2 (App Router), React 19.2.3, TypeScript 5, Tailwind CSS v4, Lucide Icons, Recharts 3.8.
- **Backend & APIs:** Next.js Serverless API routes (53 routes), Zod Schema validation, Adm-zip safe extractor.
- **Cơ sở dữ liệu & Xác thực:** Supabase PostgreSQL (18 migrations, RLS, DB triggers), Supabase Auth (Google OAuth 2.0, HTTP-only Cookie), Supabase Storage.
- **Trí tuệ nhân tạo:** Google Gemini API (`@google/genai`, `gemini-2.5-flash`, `gemini-2.5-pro`), mô hình phản biện Grader-Critic hai giai đoạn.
- **Thị giác máy tính (Runner):** Sharp, Pixelmatch, PNGjs (so sánh ảnh giao diện, tính toán sai khác pixel).
- **Ứng dụng di động:** Kotlin 2.0, Jetpack Compose BOM 2024.12, Hilt DI, Material 3, Android SDK 35.
- **Kiểm thử tự động:** Vitest 4.1, React Testing Library, ESLint 9.

Chi tiết xem tại **[docs/THIRD_PARTY_NOTICES.md](docs/THIRD_PARTY_NOTICES.md)**.

---

## 9. Demo

- **Trực quan hoá trực tuyến (Live Production Demo):** [https://site-truong257.vercel.app](https://site-truong257.vercel.app)
- **Phương thức trải nghiệm:**
  - Đăng nhập bằng **Google OAuth 2.0** một chạm.
  - Đăng ký tài khoản với email học thuật `.edu.vn`.
  - Chọn vai trò **Giảng viên** để trải nghiệm tạo lớp, tạo bài tập, cấu hình Rubric và không gian chấm bài trực quan.
  - Chọn vai trò **Sinh viên** để trải nghiệm vào lớp, xem bài tập và nộp bài.

---

## 10. Cài đặt local (từ máy sạch)

### Yêu cầu tiên quyết
- **Node.js**: Phiên bản `>= 20.0.0` (Khuyến nghị Node.js 20 LTS hoặc 22 LTS).
- **npm**: Đi kèm với Node.js.
- **Git**: Đã cài đặt.

### Các bước cài đặt và khởi chạy Web Portal (`web/site`)

```bash
# 1. Sao chép kho mã nguồn
git clone https://github.com/truong256/UIGrade-AI.git
cd UIGrade-AI/web/site

# 2. Cài đặt các gói phụ thuộc nguyên bản (sử dụng package-lock.json)
npm ci

# 3. Thiết lập biến môi trường từ mẫu
cp .env.example .env.local
# Trên Windows PowerShell:
Copy-Item .env.example .env.local

# 4. Khởi chạy môi trường phát triển (Development Mode)
npm run dev
```

Ứng dụng sẽ sẵn sàng phục vụ tại: `http://localhost:3000`.

---

## 11. Environment Variables

Các biến môi trường cấu hình trong `web/site/.env.local` (tham khảo mẫu chuẩn tại `web/site/.env.example`):

| Tên biến | Bắt buộc | Mục đích | Ví dụ |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Có | URL gốc của ứng dụng (dùng cho OAuth callback) | `http://localhost:3000` |
| `NEXT_PUBLIC_SUPABASE_URL` | Có | Địa chỉ Project Supabase | `https://your-project.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Có | Khóa công khai ẩn danh Supabase | `eyJh...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Có | Khóa quản trị Server-side (không để lộ cho Client) | `eyJh...` |
| `JWT_SECRET` | Có | Chuỗi bí mật ký phiên làm việc (tối thiểu 32 ký tự) | `your-secure-jwt-secret-min-32-chars` |
| `GEMINI_API_KEY` | Tùy chọn | Khóa API Google Gemini phục vụ AI Grading | `AIzaSy...` |
| `SMTP_*` | Tùy chọn | Cấu hình máy chủ gửi email thông báo | `smtp.gmail.com` |

> [!CAUTION]
> **Tuyệt đối không commit tệp `.env.local` hoặc bất kỳ khóa bí mật nào lên kho mã nguồn Git.**

---

## 12. Database Setup

Hệ thống sử dụng Supabase PostgreSQL:
1. Tạo một dự án mới trên [Supabase](https://supabase.com).
2. Lấy `URL`, `anon key` và `service_role key` từ phần **Project Settings -> API** và điền vào `.env.local`.
3. Áp dụng các tệp migration trong thư mục `web/site/supabase/migrations/` theo thứ tự thời gian (hoặc sử dụng Supabase CLI: `supabase db push`).
4. (Tùy chọn) Chạy tệp `web/site/supabase/seed.sql` nếu muốn nạp dữ liệu mẫu ban đầu để kiểm thử.

---

## 13. Testing

Dự án duy trì bộ kiểm thử tự động nghiêm ngặt được kích hoạt qua CI:

```bash
cd web/site

# 1. Kiểm tra quy chuẩn mã nguồn (ESLint 9)
npm run lint

# 2. Kiểm tra an toàn kiểu dữ liệu TypeScript (0 errors)
npm run type-check

# 3. Chạy toàn bộ 51 bộ kiểm thử tự động (Vitest)
npm test

# 4. Kiểm tra biên dịch đóng gói sản phẩm (Production Build)
npm run build

# 5. Kiểm tra tính toàn vẹn liên kết tài liệu (từ thư mục gốc)
cd ../..
node scripts/check-doc-links.js
```

Kết quả kiểm thử hiện tại: **51 test files passed, 444 tests passed (100%)**.

---

## 14. Security

- **Kiểm soát truy cập dữ liệu:** 100% các bảng được bảo vệ bởi PostgreSQL Row-Level Security (RLS).
- **Phân lập vai trò:** 3 cấp phân quyền (Student, Lecturer, Admin) được xác thực ở cả Middleware, API guard và CSDL.
- **Bảo vệ phiên:** Cookie HTTP-only, chống tấn công XSS và CSRF.
- **Chống IDOR:** Sinh viên không thể xem bài nộp hoặc điểm số của người khác qua thao tác đổi URL.
- **Bảo vệ Quản trị viên:** Trigger PostgreSQL Advisory Lock ngăn chặn việc tự khóa hoặc xóa Admin cuối cùng của hệ thống.
- **Giải nén an toàn:** Kiểm tra chống tấn công Zip Slip và Path Traversal đối với các tệp `.zip` nộp bài.

Chi tiết xem tại **[docs/SECURITY.md](docs/SECURITY.md)**.

---

## 15. Tài liệu

Bộ hồ sơ kỹ thuật chi tiết dành cho Ban Giám khảo và các nhà phát triển:

- 📄 **[Mô Tả Giải Pháp (docs/SOLUTION_DESCRIPTION.md)](docs/SOLUTION_DESCRIPTION.md)**: Đặc tả bài toán, giải pháp, người dùng mục tiêu và tính mới.
- 📐 **[Kiến Trúc Hệ Thống (docs/ARCHITECTURE.md)](docs/ARCHITECTURE.md)**: Sơ đồ tương tác phân tầng, bản đồ 53 API routes và hạ tầng triển khai.
- 🤖 **[Quy Trình Chấm AI & Evidence Grounding (docs/AI_GRADING.md)](docs/AI_GRADING.md)**: Cơ chế Grader-Critic hai giai đoạn và nguyên tắc Human-in-the-Loop.
- 🛡️ **[Kiểm Toán An Toàn Thông Tin (docs/SECURITY.md)](docs/SECURITY.md)**: Ma trận 13 biện pháp kiểm soát kỹ thuật và RLS policies.
- 📜 **[Thông Cáo Cấu Phần Bên Thứ Ba (docs/THIRD_PARTY_NOTICES.md)](docs/THIRD_PARTY_NOTICES.md)**: Phân loại chi tiết và xác minh tương thích giấy phép.
- 🏆 **[Báo Cáo Tuân Thủ Cuộc Thi (docs/COMPETITION_COMPLIANCE.md)](docs/COMPETITION_COMPLIANCE.md)**: Bảng đối chiếu toàn diện tiêu chí Cuộc thi Thực Chiến AI 2026.

---

## 16. Competition

Đề tài được phát triển nhằm tham gia Cuộc thi **"Phát triển phần mềm mã nguồn mở tích hợp AI 2026"**.

Báo cáo tuân thủ đầy đủ các tiêu chí kỹ thuật và hành chính được trình bày chi tiết tại:
👉 **[Báo Cáo Tuân Thủ Tiêu Chí Cuộc Thi (docs/COMPETITION_COMPLIANCE.md)](docs/COMPETITION_COMPLIANCE.md)**

---

## 17. License

Toàn bộ mã nguồn nguyên bản do nhóm phát triển UIGrade AI sáng tạo được phát hành theo giấy phép chuẩn mã nguồn mở **[MIT License](LICENSE)** (được tổ chức Open Source Initiative phê duyệt).

Mọi cấu phần và thư viện bên thứ ba được ghi nhận và tuân thủ minh bạch tại **[NOTICE.md](NOTICE.md)** và **[docs/THIRD_PARTY_NOTICES.md](docs/THIRD_PARTY_NOTICES.md)**.
