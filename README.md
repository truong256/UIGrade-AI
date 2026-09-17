# UIGrade AI

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Android](https://img.shields.io/badge/Android-SDK%2035-green)](https://developer.android.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-cyan)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-yellow)](https://vitest.dev/)

> **Nền tảng Đánh giá Giao diện Người dùng và Chấm bài Lập trình Android Tích hợp Trí tuệ Nhân tạo Đa phương thức**
>
> Sản phẩm tham gia Cuộc thi *"Phát triển phần mềm mã nguồn mở tích hợp AI 2026"* (Bảng thi Phần mềm mã nguồn mở).

---

## 1. Giới thiệu dự án

**UIGrade AI** là nền tảng công nghệ giáo dục mã nguồn mở phục vụ giảng dạy và đánh giá bài tập lập trình giao diện di động (Android UI). Dự án giải quyết bài toán chấm bài giao diện thủ công tốn thời gian của giảng viên, đồng thời cung cấp phản hồi lập tức, trực quan và có bằng chứng cụ thể cho sinh viên.

Khác với các công cụ chấm bài AI dạng "hộp đen" (Black-box AI) vốn dễ bị ảo giác (hallucination) và thiếu tính nhất quán, UIGrade AI tiên phong với nguyên tắc:

> **"Deterministic First — Multimodal AI Second — Human-in-the-Loop Always"**
> 
> Điểm số kỹ thuật và độ chuẩn xác giao diện được đo lường bằng **chỉ số tất định (Deterministic Runner)** (cấu trúc tệp, build test, độ tương phản WCAG, SSIM/MSE). Trí tuệ nhân tạo (**Multimodal AI v2.0**) đóng vai trò phân tích ngữ nghĩa, giải thích chi tiết lỗi dựa trên **bằng chứng cụ thể (Evidence IDs)**, và toàn bộ điểm đề xuất đều phải qua **cổng phê duyệt của Giảng viên** trước khi công bố.

---

## 2. Cấu trúc Hệ sinh thái (Repository Layout)

Kho mã nguồn được tổ chức theo mô hình Monorepo rõ ràng:

```text
UIGrade AI/
├── docs/                        # Tài liệu kiến trúc và hướng dẫn kỹ thuật
│   ├── ARCHITECTURE.md          # Kiến trúc hệ thống tổng thể
│   └── AI_ARCHITECTURE.md       # Kiến trúc chi tiết phân hệ AI Grader-Critic
│
├── web/
│   ├── site/                    # [SẢN PHẨM CHÍNH] Nền tảng Web Portal
│   │   ├── app/                 # Next.js 16 App Router (UI & API endpoints)
│   │   ├── components/          # React 19 UI Components (Auth, Classes, Grading)
│   │   ├── services/            # Dịch vụ Runner, Gemini AI v2, Supabase Backend
│   │   ├── lib/                 # Core utilities, Grading Contract, Supabase Auth
│   │   ├── tests/               # Bộ kiểm thử tự động Vitest
│   │   ├── package.json         # Khai báo phụ thuộc & npm scripts
│   │   └── .env.example         # Mẫu biến môi trường chuẩn
│   │
│   └── project-files/           # Dữ liệu thực nghiệm, đề cương NCKH & baseline
│       ├── data/                # Dataset ảnh giao diện & ground truth
│       ├── docs/                # Kế hoạch dự thi, sổ tay dữ liệu NCKH
│       └── reports/             # Báo cáo thực nghiệm MAE/bias
│
├── app/                         # [ỨNG DỤNG ĐỒNG HÀNH] Android Native App
│   ├── src/main/java/com/uigrade/ai/
│   │   ├── presentation/        # Jetpack Compose UI (Student & Lecturer screens)
│   │   ├── domain/              # Clean Architecture (Use cases, Models)
│   │   └── data/                # Data & Repository layer
│   └── build.gradle.kts         # Cấu hình build Android (SDK 35, Compose BOM)
│
├── .github/
│   ├── workflows/               # CI/CD Workflows (Web CI, Android CI)
│   └── ISSUE_TEMPLATE/          # Mẫu gửi Issue (Bug report, Feature request)
│
├── LICENSE                      # Giấy phép mã nguồn mở MIT
├── NOTICE.md                    # Thông cáo bản quyền và cấu phần bên thứ ba
├── CHANGELOG.md                 # Lịch sử thay đổi theo chuẩn Keep a Changelog
├── CONTRIBUTING.md              # Quy chuẩn và quy trình đóng góp mã nguồn
├── CODE_OF_CONDUCT.md           # Quy tắc ứng xử cộng đồng Contributor Covenant
└── SECURITY.md                  # Chính sách bảo mật & báo cáo lỗ hổng
```

---

## 3. Tài liệu Kỹ thuật Chi tiết

Để hiểu sâu về hệ thống, vui lòng tham khảo các tài liệu chuyên sâu:
- 📐 **[Kiến trúc Hệ thống (docs/ARCHITECTURE.md)](docs/ARCHITECTURE.md)**: Luồng dữ liệu, phân tầng ứng dụng, cơ chế bảo mật và cô lập sandbox.
- 🤖 **[Kiến trúc Tích hợp AI (docs/AI_ARCHITECTURE.md)](docs/AI_ARCHITECTURE.md)**: Quy trình Grader-Critic hai giai đoạn, cơ chế neo bằng chứng (Evidence Grounding), và dữ liệu thực nghiệm.
- 📜 **[Lịch sử Phiên bản (CHANGELOG.md)](CHANGELOG.md)**: Lịch sử phát triển và thay đổi qua các mốc phát hành.
- 🤝 **[Hướng dẫn Đóng góp (CONTRIBUTING.md)](CONTRIBUTING.md)**: Tiêu chuẩn code, commit message và quy trình gửi Pull Request.

---

## 4. Yêu cầu Môi trường (System Requirements)

- **Node.js**: Phiên bản `>= 20.0.0` (Khuyến nghị Node.js 20 LTS hoặc 22 LTS).
- **Trình quản lý gói**: `npm` (đi kèm Node.js).
- **Java Development Kit (JDK)**: JDK 17 (dành cho phần Android hoặc kiểm thử Android Runner).
- **Cơ sở dữ liệu**: Supabase (PostgreSQL với RLS, Auth, và Storage).
- **Dịch vụ AI**: Google Gemini API key (Mô hình `gemini-2.5-flash` / `gemini-2.5-pro`).

---

## 5. Cài đặt & Khởi chạy từ Mã nguồn (Build from Source)

### 5.1. Nền tảng Web (`web/site`) — Sản phẩm cốt lõi

1. **Di chuyển vào thư mục Web:**
   ```bash
   cd web/site
   ```

2. **Cài đặt các gói phụ thuộc chính xác:**
   ```bash
   npm ci
   ```

3. **Thiết lập biến môi trường:**
   Sao chép tệp cấu hình mẫu:
   ```bash
   cp .env.example .env.local
   # Trên Windows PowerShell:
   Copy-Item .env.example .env.local
   ```
   Cập nhật các giá trị biến môi trường trong `.env.local`:
   - `NEXT_PUBLIC_APP_URL`: URL chạy ứng dụng (ví dụ: `http://localhost:3000`).
   - `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Khóa kết nối Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY`: Khóa quản trị Supabase backend.
   - `JWT_SECRET`: Chuỗi khóa ký phiên làm việc (tối thiểu 32 ký tự).
   - `GEMINI_API_KEY`: Khóa API Google Gemini.

4. **Khởi chạy môi trường phát triển (Development Mode):**
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ hoạt động tại địa chỉ: `http://localhost:3000`.

5. **Đóng gói phiên bản phát hành (Production Build):**
   ```bash
   npm run build
   npm run start
   ```

### 5.2. Ứng dụng Di động Android (`app/`) — Ứng dụng đồng hành

1. **Thực hiện tại thư mục gốc repository:**
   ```bash
   # Dành cho Windows:
   .\gradlew.bat assembleDebug

   # Dành cho macOS / Linux:
   ./gradlew assembleDebug
   ```

2. **Cài đặt vào thiết bị giả lập / thiết bị thật đang cắm qua USB:**
   ```bash
   .\gradlew.bat installDebug
   ```

---

## 6. Kiểm thử Tự động & Chất lượng Mã nguồn (Testing & Quality)

Repository được thiết lập kiểm tra chất lượng tự động nghiêm ngặt trên GitHub Actions CI:

### Kiểm thử Web (`web/site`)
```bash
cd web/site

# 1. Kiểm tra an toàn kiểu dữ liệu TypeScript
npm run type-check

# 2. Kiểm tra quy chuẩn mã nguồn (ESLint 9)
npm run lint

# 3. Chạy bộ kiểm thử tự động (Vitest)
npm test
```

### Kiểm thử Android
```bash
# Chạy bộ kiểm thử đơn vị
.\gradlew.bat testDebugUnitTest

# Chạy rà soát lỗi mã nguồn Android Lint
.\gradlew.bat lintDebug
```

---

## 7. Quy trình Chấm điểm Lai (Hybrid Grading Flow)

```text
[Bài nộp của sinh viên (.zip)]
       │
       ▼
[Bộ giải nén an toàn & Quét cấu trúc] ──► (Kiểm tra tệp bắt buộc, AndroidManifest, Layout XML)
       │
       ▼
[Runner Tất định & Đo đạc Giao diện] ──► (Tính toán chỉ số SSIM, MSE, Độ tương phản màu WCAG)
       │
       ▼
[Đóng gói Bằng chứng (Evidence Bundle)] ──► (Gán Evidence IDs cho mã nguồn, ảnh chụp, log)
       │
       ▼
[Grader-Critic Multimodal AI Pipeline] ──► (Phân tích ngữ nghĩa, đề xuất điểm, phản biện lỗi)
       │
       ▼
[Cổng Giảng viên (Human-in-the-Loop)] ──► (Xem bằng chứng, duyệt điểm hoặc ghi đè chính thức)
       │
       ▼
[Phát hành Kết quả cho Sinh viên]
```

---

## 8. Bảo mật & Giấy phép Bản quyền

- **Giấy phép**: Toàn bộ mã nguồn do nhóm dự án UIGrade AI phát triển được phát hành theo giấy phép chuẩn mã nguồn mở **[MIT License](LICENSE)** (được tổ chức OSI phê duyệt).
- **Thành phần bên thứ ba**: Các thư viện nguồn mở, mô hình nghiên cứu tham khảo và dataset được ghi nhận chi tiết, minh bạch tại **[NOTICE.md](NOTICE.md)**.
- **Chính sách bảo mật**: Quy trình thông báo và xử lý lỗ hổng bảo mật tuân thủ **[SECURITY.md](SECURITY.md)**.
