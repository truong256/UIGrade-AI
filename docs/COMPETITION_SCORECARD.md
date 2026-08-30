# Đối chiếu tiêu chí cuộc thi UIGrade AI

Ngày đánh giá: 2026-08-30. Điểm dưới đây là **ước tính có điều kiện**, không thay
thế quyết định của ban giám khảo. Bằng chứng chỉ tính khi tồn tại trong repository
hoặc GitHub; chức năng backend/AI chưa có không được chấm như đã hoàn thành.

## Tóm tắt

| Tiêu chí | Tối đa | Trước | Sau thay đổi | Bằng chứng chính | Rủi ro còn lại |
|---|---:|---:|---:|---|---|
| Quản lý mã nguồn Internet | 5 | 5 | 5 | Repo public, lịch sử Git, PR #1–#6, CI | Chưa bật branch protection |
| Giấy phép OSI | 10 | 0 | 9 | `LICENSE` MIT, `NOTICE`, SPDX, third-party notice | Chưa chạy REUSE/license scanner đầy đủ |
| Release theo phiên bản | 5 | 1 | 3 | `versionName=1.0.0`, changelog, release workflow/notes | Chưa có tag/GitHub Release thực tế |
| Build from source | 10 | 7 | 10 | Wrapper, JDK 17, CI #37 xanh, hướng dẫn build, config mẫu | Cần chạy UI test runtime trên thiết bị |
| Thư viện/gói | 10 | 6 | 8 | Version catalog, bỏ dependency thừa, notice, SBOM trực tiếp, Dependabot | SBOM chưa gồm dependency bắc cầu |
| Tài liệu/giao tiếp | 10 | 3 | 9 | README Việt hóa và bộ tài liệu `docs/` | Chưa có screenshot/video thật |
| Tính nguyên gốc | 10 | 7 | 8 | Deterministic rubric + feedback tách điểm, ba role, audit | Metric extractor/backend chưa có |
| Hoàn thiện sản phẩm | 10 | 8 | 8 | Student/Lecturer/Admin flow, unit/UI smoke tests | In-memory demo; chưa có production backend |
| Thân thiện người dùng | 10 | 8 | 8.5 | Material 3, xanh, mascot, state/error/validation | Chưa QA ma trận thiết bị/font scale đầy đủ |
| Tích hợp AI | 10 | 5 | 6 | Ranh giới `FeedbackRepository`, contract/tài liệu an toàn | Không có AI/backend thật |
| Demo/cộng đồng | 10 | 3 | 8 | Demo script, contribution/security templates, roadmap, CI artifact | Chưa có release, screenshot/video, cộng đồng thực tế |
| **Tổng** | **100** | **53** | **82.5** | | Điểm sau vẫn phụ thuộc kiểm tra thủ công/giám khảo |

## I. Tiêu chí PoF — 50 điểm

### 1. Quản lý mã nguồn — 5/5 ước tính

- Repository: <https://github.com/truong256/UIGrade-AI>, trạng thái public.
- Git được dùng thực tế; các PR hoàn thiện khung, Giảng viên, Sinh viên và Admin
  đã merge. GitHub Actions trên `main` đã có run xanh trước baseline.
- Issue tracker được bật; thêm bug/feature template và PR template.
- Còn thiếu: branch protection/review bắt buộc là cấu hình thủ công của chủ repo.

### 2. Giấy phép — 9/10 ước tính

- Trước: README ghi MIT nhưng không có toàn văn; GitHub không nhận diện license.
- Sau: `LICENSE` MIT (OSI-approved), `NOTICE`, `THIRD_PARTY_NOTICES.md`,
  `docs/LICENSE_COMPLIANCE.md` và SPDX trên file do dự án sở hữu.
- Font Inter giữ OFL riêng tại `licenses/OFL-Inter.txt`.
- Rủi ro: inventory direct chưa thay license scanner/SBOM resolved; asset vector
  cần chủ dự án xác nhận quyền tác giả nếu lấy từ nguồn ngoài.

### 3. Release — 3/5 ước tính

- `versionCode=1`, `versionName=1.0.0`, changelog dựa trên lịch sử PR/commit.
- Có release process, release notes, workflow build unsigned demo APK, checksum và
  draft release khi chủ repo đẩy tag.
- Chưa có tag/release thật; không tuyên bố APK production-signed.

### 4. Build from source — 10/10 ước tính

- Wrapper Gradle 8.13, AGP 8.13.2, Kotlin 2.0.21, SDK 35, JDK/JVM target 17.
- `docs/BUILD_FROM_SOURCE.md`, `local.properties.example`, script Windows không
  còn đường dẫn người dùng cụ thể.
- CI chạy unit, lint, UI-test compilation và assemble, lưu report/APK.
- Baseline local 2026-08-30 không tải được Gradle do network sandbox. GitHub
  Actions [run #37](https://github.com/truong256/UIGrade-AI/actions/runs/33319441697)
  từ clean checkout đã chạy thành công static checks, unit test, lint, biên dịch
  Compose UI test và assemble debug; report và APK debug được lưu làm artifact.

### 5. Dependency — 8/10 ước tính

- Version khóa trong catalog, chỉ dùng repository chính thức, không có jar/aar vendor.
- Đã gỡ Retrofit/OkHttp/Serialization/Coil vì chưa dùng.
- Có Dependabot, dependency doc, notice và SPDX inventory direct.
- Chưa có Gradle verification metadata và SBOM resolved dependency bắc cầu.

### 6. Tài liệu — 9/10 ước tính

- README và docs mô tả build, kiến trúc, test, AI, bảo mật, release, innovation,
  demo, roadmap và scorecard.
- Có CONTRIBUTING, SECURITY, CODE_OF_CONDUCT và community templates.
- Không tạo screenshot/video giả; đây là phần còn thiếu cần quay từ app thật.

## II. Tiêu chí sản phẩm — 50 điểm

### 1. Tính nguyên gốc — 8/10 ước tính

Bằng chứng: model metric/rule/rubric/result, use case chấm điểm, feedback text-only,
luồng lecturer review/release và audit Admin. Không tính metric extractor hay AI
provider vì chưa có code backend.

### 2. Mức độ hoàn thiện — 8/10 ước tính

- Auth/role navigation và luồng chính của ba role có màn hình, ViewModel, use case,
  repository demo và test.
- Student có join/draft/file/submit/history/grade/progress/notification/profile.
- Lecturer có class/join code/assignment/rubric/submission/grading/stats/profile.
- Admin có dashboard/user/catalog/audit và kiểm tra quyền.
- Trừ điểm do dữ liệu in-memory, session không bền, backend/API/Room chưa có.

### 3. UX — 8.5/10 ước tính

Material 3, blue theme/dark mode, mascot, Lazy list, content descriptions, dialog
xác nhận, validation, chống double-submit, loading/empty/error và Snackbar. Audit
đã loại callback rỗng và sửa lỗi Admin hiển thị lỗi như thành công. Chưa có bằng
chứng test runtime trên nhiều kích thước/font scale/TalkBack.

### 4. AI — 6/10 ước tính

Kiến trúc ngăn feedback sửa điểm và có local flow ổn định, nhưng không có AI
provider, secure backend, timeout/rate-limit/parser production. Tài liệu chỉ định
contract và test cần có; không giả lập rồi tuyên bố AI thật.

### 5. Demo/cộng đồng — 8/10 ước tính

Có tài khoản/dữ liệu demo, demo script, CI artifact, roadmap, issue/PR flow và tài
liệu nguồn mở. Chưa có release thực tế, video/screenshot thật hoặc số liệu cộng đồng.

## Lỗi và phần thiếu phát hiện trong baseline

- README ghi AGP 8.7.3 trong khi catalog là 8.13.2.
- Không có LICENSE toàn văn; GitHub metadata `license=null`.
- Không tag/release/changelog/release process.
- `run_app.bat` gắn cứng SDK theo `C:\Users\ASUS`.
- Android backup bật và chưa cấm cleartext traffic.
- Retrofit/OkHttp/Serialization/Coil khai báo nhưng không dùng.
- Một `onValueChange = {}` trong dropdown Admin.
- Lỗi thao tác Admin được gán vào `successMessage`.
- Repository demo dùng delay giả như độ trễ mạng.
- Thiếu bộ tài liệu/community/compliance/SBOM/Dependabot.

## Thao tác thủ công ưu tiên trước khi nộp

1. Review và merge PR #7 sau khi xác nhận phạm vi thay đổi.
2. Chạy `connectedDebugAndroidTest` trên Pixel 8/API 35 và thiết bị thật.
3. Chụp screenshot/quay video thật, thêm vào README.
4. Xác nhận quyền tác giả của mascot/vector và font bundle.
5. Tạo signed tag `v1.0.0`, kiểm tra draft release/artifact/checksum rồi publish.
6. Bật branch protection và private vulnerability reporting.
7. Nếu trình diễn AI thật: triển khai backend/secret/RLS/parser/test; không đặt key trong app.
