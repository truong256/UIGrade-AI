# UIGrade AI — Báo Cáo Tuân Thủ Tiêu Chí Cuộc Thi (Competition Compliance Report)

> **Tài liệu tổng hợp và tự đánh giá chi tiết mức độ đáp ứng thể lệ Cuộc thi "Phát triển phần mềm mã nguồn mở tích hợp AI 2026"**
>
> *Đề tài: UIGrade AI — Nền tảng Đánh giá Giao diện Người dùng và Chấm bài Lập trình Android Tích hợp Trí tuệ Nhân tạo Đa phương thức*

---

## 1. Thông Tin Kho Mã Nguồn & Phát Hành

- **Tác giả / Nhóm phát triển:** `truong256` & UIGrade AI contributors
- **Kho mã nguồn chính thức:** [https://github.com/truong256/UIGrade-AI](https://github.com/truong256/UIGrade-AI)
- **Nhánh mặc định (Default branch):** `main`
- **Khả năng truy cập:** Công khai (Public repository)
- **Trực quan hoá trực tuyến (Live Demo):** [https://site-truong257.vercel.app](https://site-truong257.vercel.app)
- **Bản phát hành chính thức (Release):** [v1.0.1](https://github.com/truong256/UIGrade-AI/releases/tag/v1.0.1) (`UIGrade AI v1.0.1 — Competition Readiness Update`)
- **Git Tag:** `v1.0.1`

---

## 2. Bảng Đối Chiếu Toàn Diện Tiêu Chí Cuộc Thi (Comprehensive Compliance Matrix)

Bảng đối chiếu dưới đây áp dụng nghiêm ngặt 4 trạng thái chuẩn theo quy định đánh giá:
- `PASS`: Đã đáp ứng đầy đủ và có bằng chứng kỹ thuật xác thực trong kho mã nguồn.
- `PARTIAL`: Đã hoàn thiện một phần, còn điểm cần bổ trợ.
- `MISSING`: Chưa có trong kho mã nguồn hoặc chưa thực hiện.
- `NEEDS_MANUAL_CONFIRMATION`: Yêu cầu thí sinh / nhóm phát triển xác nhận thủ công bằng hồ sơ hành chính, chữ ký hoặc làm việc trực tiếp với Ban Tổ chức.

| Hạng mục yêu cầu (Requirement) | Bằng chứng thực tế hiện có (Current Evidence) | Trạng thái (Status) | Hạng mục còn thiếu (Missing) | Hành động cần thực hiện (Action) |
|---|---|---|---|---|
| **1. Quản lý mã nguồn công khai (Public Source Control - 5đ)** | Repo chế độ Public trên GitHub; lịch sử Git thể hiện tiến trình làm việc liên tục, minh bạch qua từng tính năng logic. | **PASS** | Không có | Duy trì branch và commit sạch sẽ. |
| **2. Giấy phép nguồn mở OSI (OSI-approved License - 10đ)** | Toàn văn giấy phép **MIT License** tại `LICENSE`; 461 tệp mã nguồn nguyên bản có gắn header SPDX chuẩn; thông cáo [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) chi tiết. | **PASS** | Xác nhận biểu mẫu hành chính với BTC | Tích chọn giấy phép MIT trong hồ sơ nộp dự thi chính thức. |
| **3. Bản phát hành chính thức (Release - 5đ)** | Gắn Git tag `v1.0.1` và công bố phát hành trên GitHub Releases kèm changelog chuẩn; phân phối bằng mã nguồn mở qua tarball Git. | **PASS** | Không có | Giữ nguyên phiên bản release ổn định `v1.0.1`. |
| **4. Cài đặt & Dịch từ mã nguồn (Build From Source - 10đ)** | Hướng dẫn rõ ràng từng bước trong `README.md`; `npm ci`, `npm run lint`, `npm run type-check`, `npm test` (51 test files, 444 tests), `npm run build` (53 routes) thành công 100%. | **PASS** | Không có | Bảo đảm developer mới có thể dựng lại môi trường từ `.env.example`. |
| **5. Quản lý thư viện phụ thuộc (Dependencies - 10đ)** | Khai báo tường minh qua `package.json`, `package-lock.json`, Gradle libs toml; không commit `node_modules` hay thư mục build; cách ly dữ liệu nghiên cứu trong `web/project-files/`. | **PASS** | Không có | Giữ đồng bộ lockfiles trước khi nộp. |
| **6. Tài liệu & Giao tiếp cộng đồng (Docs & Communication - 10đ)** | Hệ thống tài liệu chuyên sâu 6 phần trong `docs/`; `CHANGELOG.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`; Issue templates chuẩn YAML trên GitHub. | **PASS** | Không có | Kiểm tra tính toàn vẹn liên kết qua `scripts/check-doc-links.js`. |
| **7. Tư cách thành viên đội thi (Team Eligibility)** | Tài khoản GitHub `truong256`. Các thông tin cá nhân/thẻ sinh viên không lưu trên repo công khai để bảo vệ quyền riêng tư. | **NEEDS_MANUAL_CONFIRMATION** | Giấy tờ xác nhận sinh viên / học viên của các thành viên | Đội thi hoàn thiện hồ sơ thành viên theo biểu mẫu riêng của BTC. |
| **8. Sản phẩm chưa từng dự thi giải khác (Originality)** | Đề tài được phát triển mới cho mùa giải 2026; các mã nguồn tham khảo học thuật nền tảng được ghi rõ trong `NOTICE.md` và `web/project-files/`. | **NEEDS_MANUAL_CONFIRMATION** | Bản cam kết không trùng lặp giải thưởng có chữ ký của nhóm | Đại diện nhóm ký cam kết tính nguyên bản theo biểu mẫu cuộc thi. |
| **9. Quyền sở hữu trí tuệ (IP Rights / Authorship)** | Bản quyền thuộc về UIGrade AI contributors theo MIT License; ghi công tác giả minh bạch. | **NEEDS_MANUAL_CONFIRMATION** | Thỏa thuận phân định quyền tác giả giữa các thành viên | Toàn bộ thành viên ký thỏa thuận đồng sở hữu mã nguồn. |
| **10. Tài nguyên ngoài được BTC chấp thuận (External Approval)** | Sử dụng Google Gemini API và các thư viện nguồn mở tương thích MIT. | **NEEDS_MANUAL_CONFIRMATION** | Văn bản/Email xác nhận của BTC về việc chấp thuận sử dụng Gemini API | Nhóm gửi email xác nhận việc sử dụng API AI với BTC nếu quy chế yêu cầu. |
| **11. Video trình diễn dự thi (Showcase Video)** | Đã có hệ thống Live Demo trực tuyến tại [https://site-truong257.vercel.app](https://site-truong257.vercel.app); chưa có link video clip thuyết trình 3-5 phút chính thức trong repo. | **NEEDS_MANUAL_CONFIRMATION** | Video demo trình diễn tính năng theo format cuộc thi | Quay video demo hoàn chỉnh, tải lên YouTube/Drive và đính kèm vào hồ sơ nộp bài. |
| **12. Chữ ký & Cam kết nộp bài (Pledges & Signatures)** | Các cam kết kỹ thuật được thể hiện trong `CONTRIBUTING.md` và `SECURITY.md`. | **NEEDS_MANUAL_CONFIRMATION** | Phiếu nộp bài có chữ ký của đội trưởng và giảng viên hướng dẫn (nếu có) | In phiếu đăng ký, ký tên và scan nộp cùng hồ sơ trực tuyến. |

---

## 3. Hệ Thống Hồ Sơ Kỹ Thuật Đính Kèm (Technical Dossier)

Hồ sơ kỹ thuật của đề tài được cấu trúc đầy đủ, mạch lạc trong thư mục `docs/`:

1. 📄 **[Mô Tả Giải Pháp (docs/SOLUTION_DESCRIPTION.md)](SOLUTION_DESCRIPTION.md)**:
   - Tổng quan bài toán chấm bài giao diện Android, phân tích hạn chế của phương pháp thủ công và AI hộp đen.
   - Đặc tả kiến trúc giải pháp ba trụ cột: Deterministic First — Multimodal AI Second — Human-in-the-Loop Always.
   - Phân tích 3 nhóm tác tử: Student, Lecturer, Admin; tính mới và khả năng ứng dụng thực tế.
2. 📐 **[Kiến Trúc Hệ Thống (docs/ARCHITECTURE.md)](ARCHITECTURE.md)**:
   - Sơ đồ tương tác chi tiết giữa Web Next.js 16, Supabase Auth, PostgreSQL RLS, Storage, Deterministic Runner và Gemini AI.
   - Bản đồ 53 tuyến API và cơ chế phòng thủ bảo mật đa tầng (Defense-in-Depth).
3. 🤖 **[Quy Trình Chấm Bài AI & Con Người Kiểm Soát (docs/AI_GRADING.md)](AI_GRADING.md)**:
   - Đặc tả quy trình 10 bước từ khi sinh viên nộp bài đến khi giảng viên phát hành điểm.
   - Cơ chế neo bằng chứng (Evidence Grounding) với định danh `evidenceIds` chống ảo giác.
   - Mô hình Grader-Critic hai giai đoạn và khẳng định nguyên tắc con người nắm quyền quyết định cuối cùng.
4. 🛡️ **[Kiểm Toán An Toàn Thông Tin & Bảo Mật (docs/SECURITY.md)](SECURITY.md)**:
   - Bảng ma trận 13 biện pháp kiểm soát an ninh đối ứng với 13 mối đe dọa thực tế.
   - Chi tiết về chống IDOR, bảo vệ phiên cookie HTTP-only, bảo vệ Last-Admin qua Transaction Advisory Lock, và an toàn giải nén Zip Slip.
5. 📜 **[Thông Cáo Cấu Phần Bên Thứ Ba (docs/THIRD_PARTY_NOTICES.md)](THIRD_PARTY_NOTICES.md)**:
   - Phân loại chi tiết Framework, Library, AI Service, Cloud Hosting, Database, Storage, và Fonts.
   - Xác minh tính tương thích 100% của các giấy phép thành phần với giấy phép MIT của dự án.

---

## 4. Bằng Chứng Kiểm Thử Tự Động (Continuous Integration Evidence)

Hệ thống tích hợp liên tục (CI) được tự động kích hoạt trên GitHub Actions:
- **Web CI Workflow (`.github/workflows/web-ci.yml`):**
  - Môi trường: Ubuntu, Node.js 22 LTS.
  - Cổng chất lượng:
    - `npm ci`: Cài đặt gói phụ thuộc nguyên bản.
    - `npm run lint`: 0 lỗi ESLint.
    - `npm run type-check`: 0 lỗi TypeScript compiler (`tsc --noEmit`).
    - `npm test`: 51/51 test suites, 444/444 tests hoàn thành thành công (bao gồm Unit test, RBAC test, Security migration test, UI regression test).
    - `npm run build`: Đóng gói thành công toàn bộ 53 static và dynamic routes trên Next.js App Router.
- **Tính toàn vẹn tài liệu:**
  - Lệnh kiểm tra `node scripts/check-doc-links.js` xác nhận 100% liên kết nội bộ hợp lệ, không tồn tại đường dẫn rò rỉ máy cá nhân.
