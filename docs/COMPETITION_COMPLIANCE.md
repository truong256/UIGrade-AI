# UIGrade AI — Báo Cáo Tuân Thủ Tiêu Chí Mã Nguồn Mở (Competition Compliance)

> Tài liệu tổng hợp và tự đánh giá chi tiết mức độ đáp ứng thể lệ Cuộc thi **"Phát triển phần mềm mã nguồn mở tích hợp AI 2026"** (Phần I — Tiêu chí PoF 50 điểm) của đề tài **UIGrade AI**.

---

## Repository

- **Tổ chức/Tác giả:** `truong256`
- **Kho mã nguồn:** [https://github.com/truong256/UIGrade-AI](https://github.com/truong256/UIGrade-AI)
- **Nhánh chính (Default branch):** `main`
- **Khả năng truy cập:** Công khai (Public repository)
- **Trực quan hoá trực tuyến (Live Demo):** [https://site-truong257.vercel.app](https://site-truong257.vercel.app)

---

## Release

- **Bản phát hành chính thức hiện tại (Current Release):** [v1.0.1](https://github.com/truong256/UIGrade-AI/releases/tag/v1.0.1) (`UIGrade AI v1.0.1 — Competition Readiness Update`)
- **Git Tag tương ứng:** `v1.0.1`
- **Bản phát hành nền tảng trước đó (Previous Release):** [v1.0.0](https://github.com/truong256/UIGrade-AI/releases/tag/v1.0.0) (`UIGrade AI v1.0.0 — Competition Release`)
- **Ghi chú phát hành:** Chi tiết các tính năng hoàn thiện, kiến trúc bảo mật và thay đổi kỹ thuật đính kèm theo chuẩn Keep a Changelog.
- **Tính mở của định dạng phát hành:** Phát hành qua mã nguồn Git tag nguyên bản được GitHub tự động nén tarball; tuyệt đối không sử dụng định dạng đóng/không mở (`.zip`, `.rar`, `.arj`).

---

## 1. Public Source Control (Quản lý mã nguồn công khai — 5/5đ)

- **Trạng thái:** **PASS** (Đạt điểm tối đa)
- **Bằng chứng:**
  - Repository được thiết lập ở chế độ **Public** từ khi khởi tạo, có thể xem trực tuyến thông qua Web UI của GitHub mà không cần đăng nhập hay xin quyền.
  - Lịch sử Git thể hiện quá trình làm việc thực tế, liên tục qua nhiều đợt commit phân tách theo nhóm chức năng logic:
    - Cập nhật giao diện xác thực người dùng.
    - Bổ sung tài liệu chuẩn cộng đồng (Community files).
    - Kiến trúc hệ thống tổng thể và AI Grader-Critic.
    - Phủ định danh bản quyền SPDX trên toàn bộ cây mã nguồn.
    - Thiết lập và kiểm thử các cổng kiểm tra chất lượng CI.

---

## 2. OSI-approved License (Giấy phép mã nguồn mở — 10/10đ)

- **Trạng thái:** **PASS** (Đạt điểm tối đa)
- **Bằng chứng:**
  - **Giấy phép toàn văn tại gốc repo:** File [LICENSE](../LICENSE) chứa toàn văn giấy phép **MIT License** — một giấy phép được tổ chức Open Source Initiative (OSI) chính thức phê duyệt.
  - **Thông cáo bản quyền bên thứ ba:** File [NOTICE.md](../NOTICE.md) liệt kê chi tiết, minh bạch từng thư viện bên thứ ba (Next.js, React, Tailwind CSS, Supabase, Google GenAI SDK, Jetpack Compose, Kotlin, Vitest), giấy phép tương ứng, cũng như tuyên bố phạm vi sở hữu trí tuệ đối với các mô hình và tài liệu nghiên cứu tham khảo.
  - **Định danh giấy phép trên từng tệp mã (SPDX Identifiers):** Toàn bộ 461 tệp mã nguồn nguyên bản do nhóm phát triển (bao gồm các tệp Kotlin `.kt`, `.kts`, TypeScript `.ts`, `.tsx`, Python `.py`) đều được gắn header định danh bản quyền chuẩn:
    ```text
    SPDX-License-Identifier: MIT
    Copyright (c) 2026 UIGrade AI contributors
    ```
  - **Bảo toàn cú pháp:** Đối với các tệp Next.js có directive `"use client"` hoặc `"use server"`, directive prologue được bảo toàn nguyên vẹn ở dòng đầu tiên trước header SPDX nhằm tránh phá vỡ cơ chế biên dịch của bundler.

---

## 3. Release (Có bản phát hành — 5/5đ)

- **Trạng thái:** **PASS** (Đạt điểm tối đa)
- **Bằng chứng:**
  - Đã gắn Git Tag phiên bản chính thức: `v1.0.1` (cùng bản nền tảng `v1.0.0`).
  - Công bố bản phát hành trên GitHub Releases:
    - [UIGrade AI v1.0.1 — Competition Readiness Update](https://github.com/truong256/UIGrade-AI/releases/tag/v1.0.1)
    - [UIGrade AI v1.0.0 — Competition Release](https://github.com/truong256/UIGrade-AI/releases/tag/v1.0.0)
  - Bản phát hành sử dụng mã nguồn gốc gắn với tag commit cụ thể, phục vụ việc kiểm tra tính tái lập (Reproducibility).

---

## 4. Build From Source (Cài đặt/Dịch từ mã nguồn — 10/10đ)

- **Trạng thái:** **PASS** (Đạt điểm tối đa)
- **Bằng chứng:**
  - Tệp [README.md](../README.md) mô tả chi tiết, mạch lạc từng bước cài đặt môi trường và biên dịch từ mã nguồn cho cả hai phân hệ:
    - **Nền tảng Web (`web/site`):** Hỗ trợ đầy đủ các lệnh tiêu chuẩn `npm ci`, `npm run dev`, `npm run build`, `npm run start`, `npm run type-check`, `npm run lint`, `npm test`.
    - **Ứng dụng Android (`app/`):** Biên dịch qua Gradle Wrapper tiêu chuẩn `.\gradlew.bat assembleDebug` và `.\gradlew.bat testDebugUnitTest`.
  - **Cấu hình môi trường qua `.env.example`:** Mẫu biến môi trường [.env.example](../.env.example) và [web/site/.env.example](../web/site/.env.example) cung cấp đầy đủ danh mục biến cấu hình (Supabase URL/Key, JWT Secret, Gemini API Key, SMTP). Không yêu cầu người dùng sửa cứng giá trị vào tệp mã nguồn hay header.
  - **Kiểm chứng thực tế:**
    - `npm run type-check`: 0 lỗi TypeScript (`tsc --noEmit`).
    - `npm run lint`: 0 lỗi ESLint.
    - `npm run build`: Đóng gói thành công toàn bộ 53 dynamic & static routes trong Next.js App Router.
    - `./gradlew testDebugUnitTest`: Toàn bộ 64 kiểm thử Android đơn vị hoàn thành thành công.
    - `./gradlew lintDebug`: Rà soát mã nguồn Android thành công.
    - `./gradlew assembleDebug`: Đóng gói thành công tệp APK thử nghiệm.

---

## 5. Dependencies (Thư viện/Gói đính kèm — 10/10đ)

- **Trạng thái:** **PASS** (Đạt điểm tối đa)
- **Bằng chứng:**
  - Toàn bộ gói phụ thuộc được khai báo tường minh qua `package.json`, `package-lock.json` (phía Web) và `gradle/libs.versions.toml`, `build.gradle.kts` (phía Android).
  - Không commit thư mục `node_modules` hay các thư viện đã biên dịch sẵn vào kho Git.
  - Toàn bộ mã nguồn bên ngoài (như dữ liệu tham khảo từ paper) được cách ly trong thư mục riêng `web/project-files/` và được dẫn nguồn rõ ràng trong [NOTICE.md](../NOTICE.md).

---

## 6. Documentation and Communication (Tài liệu và Giao tiếp — 10/10đ)

- **Trạng thái:** **PASS** (Đạt điểm tối đa)
- **Bằng chứng:**
  - **Lịch sử thay đổi chuẩn:** Tệp [CHANGELOG.md](../CHANGELOG.md) tuân thủ chặt chẽ định dạng *Keep a Changelog* và *Semantic Versioning*.
  - **Hệ thống theo dõi lỗi (Bug Tracker) thực tế:**
    - Sử dụng **GitHub Issues** với các mẫu chuẩn YAML trong [../.github/ISSUE_TEMPLATE/](../.github/ISSUE_TEMPLATE/) (`bug_report.yml`, `feature_request.yml`, `config.yml`).
    - Quy trình xử lý lỗi thực tế được lưu vết rõ ràng: tạo Issue, đính kèm commit giải quyết (`Fixes #X`), chạy kiểm thử xác nhận và đóng Issue (ví dụ: Issue [#12](https://github.com/truong256/UIGrade-AI/issues/12), [#13](https://github.com/truong256/UIGrade-AI/issues/13), [#14](https://github.com/truong256/UIGrade-AI/issues/14)).
  - **Kênh thảo luận:** Bật tính năng **GitHub Discussions** nhằm hỗ trợ hỏi đáp và giao lưu cộng đồng.
  - **Tài liệu đóng góp & quy tắc ứng xử:** File [CONTRIBUTING.md](../CONTRIBUTING.md), [CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md) và [SECURITY.md](../SECURITY.md) định hình rõ quy trình gửi PR, tiêu chuẩn đạo đức và chính sách tiếp nhận lỗ hổng bảo mật.
  - **Tài liệu kiến trúc chuyên sâu:**
    - [ARCHITECTURE.md](ARCHITECTURE.md): Sơ đồ kiến trúc tổng thể, phân tầng hệ thống, cơ chế bảo mật sandbox giải nén và phân quyền dữ liệu RLS.
    - [AI_ARCHITECTURE.md](AI_ARCHITECTURE.md): Kiến trúc AI v2.0 Grader-Critic, cơ chế neo bằng chứng (Evidence Grounding), nguyên tắc con người kiểm soát (Human-in-the-Loop) và kết quả thực nghiệm mô hình.

---

## CI Evidence (Bằng chứng Kiểm thử Tự động CI)

Quy trình tích hợp liên tục (CI) được cấu hình tự động trên GitHub Actions:

- **Web CI Workflow ([../.github/workflows/web-ci.yml](../.github/workflows/web-ci.yml)):**
  - Tự động chạy trên mỗi lần `push` và `pull_request` vào nhánh `main`.
  - Các bước thực hiện: Checkout -> Cài đặt Node.js 22 -> `npm ci` -> `npm run lint` -> `npm run type-check` -> `npm test` -> `npm run build`.
  - Trạng thái kiểm tra gần nhất: **PASSED (Xanh)** trên GitHub Actions.
- **Android CI Workflow ([../.github/workflows/android-ci.yml](../.github/workflows/android-ci.yml)):**
  - Cấu hình môi trường JDK 17, Android SDK 35, Gradle setup.
  - Các bước thực hiện: Unit tests -> Android lint -> Compile Compose UI tests -> Assemble debug APK.
  - Trạng thái kiểm tra gần nhất: **PASSED (Xanh)** trên GitHub Actions.

---

## Remaining Risks (Rủi ro và Giới hạn Kỹ thuật được Công bố Minh bạch)

1. **Khóa API bên ngoài:** Để tính năng phân tích giao diện bằng AI hoạt động đầy đủ, hệ thống yêu cầu một khóa `GEMINI_API_KEY` hợp lệ. Trong trường hợp không có khóa hoặc mất kết nối, hệ thống kích hoạt cơ chế Fallback an toàn (giữ nguyên kết quả chấm tất định từ Runner và chuyển sang trạng thái chờ giáo viên duyệt).
2. **Độ chính xác của mô hình AI nhỏ:** Các thử nghiệm độc lập trên mô hình ngôn ngữ nhỏ (SLM dưới 3B tham số) chỉ ra tỉ lệ lỗi còn đáng kể trên các bố cục giao diện phức tạp; do đó UIGrade AI kiên định áp dụng nguyên tắc **Human-in-the-Loop**: điểm số AI chỉ là gợi ý tham khảo, giáo viên là người duyệt cuối cùng.
