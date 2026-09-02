# Kế hoạch dự thi "Phát triển phần mềm mã nguồn mở tích hợp AI 2026" — UIGrade AI

Lập ngày 2026-08-05. Mốc thời gian theo thông báo thể lệ: nộp kho mã nguồn
01/07–30/09/2026, chấm mã nguồn 01–08/10/2026, chung kết 10/10/2026 (14h00,
hội trường tầng 5 nhà C1). **Hạn đăng ký ghi trong thể lệ là 30/06/2026, đã
qua tính đến hôm nay** — nhóm cần tự xác nhận với thầy Nguyễn Thanh Hải/Vũ Đức
Quang/Nguyễn Thế Vịnh là đã đăng ký thành công trước khi tập trung vào kỹ
thuật, vì bản dự thảo đăng ký trong `Du_thao_dang_ky_6_de_tai_PMMN_2026.md`
còn ghi "chưa gửi Google Form".

Thang điểm 100 chia hai phần: I. PoF 50đ (chấm trước chung kết, dựa trên kho mã
nguồn) và II. Sản phẩm 50đ (chấm tại chung kết). Kế hoạch dưới đây bám theo
đúng thứ tự các tiêu chí trong thể lệ, mỗi mục nêu trạng thái hiện tại (xem
`docs/04_KET_QUA_CAP_NHAT_TU_DU_AN_NEN.md`) và việc cần làm.

## I. Tiêu chí PoF (50đ)

### 1. Quản lý mã nguồn công khai (5đ)

Đã có: repo Git tại `github.com/dnphuongictu/SV06`, commit đầu
"Initial student project baseline". Việc cần làm:
- Xác nhận repo ở chế độ **public** (không phải private/internal), có web
  viewer bình thường của GitHub — đủ điều kiện tối đa.
- Từ nay nhóm phải **thực sự dùng** repo này để làm việc (commit thật, không
  chỉ một lần đẩy ban đầu rồi bỏ), tránh bị trừ theo mục "có nhưng thực tế
  không sử dụng" (-5). Nhóm 3 người nên mỗi người tự commit bằng tài khoản
  GitHub cá nhân, không dồn hết vào một người.

### 2. Giấy phép OSI-approved (10đ)

Chưa có LICENSE trong repo. Việc cần làm:
- Chọn một giấy phép OSI-approved phù hợp (khuyến nghị **MIT** hoặc
  **Apache-2.0** — đơn giản, tương thích với các thư viện npm đang dùng).
  Thêm file `LICENSE` đầy đủ toàn văn ở gốc repo.
- Thêm dòng thông báo giấy phép ngắn ở đầu các file mã nguồn chính (`src/`,
  các file `.ts`/`.tsx` do nhóm viết mới) — tránh bị trừ vì "giấy phép không
  được ghi trong từng tệp mã" (-5).
- Xử lý dứt điểm rủi ro không tương thích với `source_code/from_github_android_ui_grader_AI`
  (repo gốc chưa có giấy phép) như đã nêu ở mục 3.1 của
  `docs/04_KET_QUA_CAP_NHAT_TU_DU_AN_NEN.md`, trước khi gắn LICENSE cho toàn
  repo dự thi.
- Với model GGUF Qwen2.5-0.5B-Instruct và các thư viện bên thứ ba khác: ghi
  rõ nguồn + giấy phép trong `NOTICE.md` (đừng chỉ dựa vào README ngắn hiện
  tại của `models/`).

### 3. Có bản phát hành (release) (5đ)

Chưa có tag/release nào. Việc cần làm:
- Trước hạn nộp (30/09/2026), tạo ít nhất một **git tag phiên bản** (ví dụ
  `v0.1.0`) và một GitHub Release gắn với tag đó.
- Để bản phát hành ở dạng **snapshot mã nguồn qua tag Git** là chính; nếu có
  đính kèm file phát hành thủ công thì **tránh `.zip`/`.rar`/`.arj`** (thể lệ
  liệt kê rõ đây là định dạng không mở, trừ -3) — ưu tiên để GitHub tự sinh
  tarball từ tag, hoặc đính kèm `.tar.gz`.

### 4. Cài đặt/dịch từ mã nguồn (10đ)

**Đã kiểm chứng (2026-08-05)**: `npm install` + `npm run build` chạy sạch,
sinh đủ 39 route (xem `CHANGELOG.md`). Lưu ý khi build trên máy có OneDrive
đồng bộ với ký tự đặc biệt trong đường dẫn: `subst` không đủ để né lỗi
Turbopack, phải copy dự án ra ngoài OneDrive — đã ghi chi tiết trong
`README.md`. Việc còn lại:
- Viết lại `README.md` gốc của repo dự thi: hiện tại chỉ có lệnh chạy baseline
  Python (tài sản nền dành cho sinh viên học công cụ), **chưa có** hướng dẫn
  build/chạy ứng dụng Next.js thật. Cần thêm: yêu cầu hệ thống (Node.js 20+,
  MongoDB), `npm install`, `npm run build`, `npm run start`, và mô tả biến
  môi trường cần thiết.
- Thêm file `.env.example` liệt kê đủ biến môi trường (`MONGODB_URI`,
  `JWT_SECRET`, `GEMINI_API_KEY`, ...) — cấu hình qua env, **không** sửa tay
  vào file code/header (mục bị trừ điểm trong thể lệ).
- Kiểm thử thực tế: clone repo vào một thư mục sạch, làm đúng theo README, xác
  nhận build chạy được **không phụ thuộc** vị trí thư mục gốc trên máy (tránh
  bị trừ vì "chương trình không hoạt động nếu nằm ngoài thư mục mã nguồn").
- Dùng công cụ build chuẩn mở (`npm`/`next build`) — đã đúng sẵn, không cần
  đổi.

### 5. Thư viện/gói đính kèm (10đ)

Việc cần làm:
- `package.json` đã liệt kê rõ dependency — giữ nguyên, không copy mã nguồn
  gói ngoài vào repo (không sửa `node_modules`, không vendor thư viện).
- Với model GGUF và dữ liệu benchmark copy từ `paper_tu`: thêm ghi chú nguồn
  gốc + phiên bản trong `models/README.md` (đã có phần "Kết nối với
  paper_tu" nhưng chưa ghi rõ mã nguồn của các thư viện đó có bị chỉnh sửa
  hay không — cần xác nhận rõ "không chỉnh sửa" nếu đúng vậy).
- Không phát hành kèm bản sao chưa được phép của `android-ui-grader-AI` gốc
  nếu chưa xử lý xong mục giấy phép ở trên.

### 6. Tài liệu và giao tiếp (10đ)

Chưa có: bug tracker đang dùng, CHANGELOG. Việc cần làm:
- Bật và **thực sự dùng GitHub Issues** làm bug tracker — tạo vài issue thật
  trong quá trình phát triển (không tạo issue giả cho có).
- Thêm `CHANGELOG.md` theo dạng Keep a Changelog, cập nhật mỗi lần có thay đổi
  đáng kể, không chỉ viết một lần trước khi nộp.
- README phải mô tả được cách dùng sản phẩm (không chỉ cách chạy dev server).

## II. Tiêu chí sản phẩm (50đ, chấm tại chung kết)

### 1. Tính nguyên gốc (10đ)

Chuẩn bị phần trình bày nêu rõ điểm khác biệt so với các công cụ chấm bài AI
thông thường: chấm bằng **rule/metric minh bạch, có thể kiểm chứng** (layout
similarity, contrast WCAG) làm nền, AI chỉ hỗ trợ giải thích lỗi theo bằng
chứng cụ thể — đối lập với cách tiếp cận "AI chấm hộp đen" phổ biến. Có thể
nhắc tới nhánh nghiên cứu SLM on-device từ `paper_tu` như một hướng mở rộng
(chấm/phản hồi riêng tư, không gửi ảnh bài làm lên cloud) nếu nhóm có thời
gian làm demo.

### 2. Mức độ hoàn thiện (10đ)

Theo `docs/01_chuan_bi_du_lieu_bai_bao_mo_hinh.md` mục 6, mục tiêu tối thiểu
là: web demo có đăng nhập/tạo bài/nộp bài/chấm bài, 3 assignment mẫu, 30
submission/ảnh test. Việc cần làm trước hạn nộp:
- Tạo 3 bài tập UI Android mẫu thật (không chỉ placeholder trong JSONL).
- Thu thập ≥30 bài nộp/ảnh có giáo viên chấm độc lập (ground truth chấm
  trước khi xem điểm tự động, theo đúng quy tắc ở `docs/03_SO_TAY_DU_LIEU.md`).
- Chạy lại `src/uigrade_baseline.py` trên dữ liệu thật này, thay cho 8 dòng
  synthetic hiện tại, và cập nhật `reports/MAU_BAO_CAO_KET_QUA.md`.

### 3. Mức độ thân thiện (10đ)

Việc cần làm: dành 1 đợt polish UI cho các trang `my_results`,
`grading_detail`, `submit_assignment` (đã có sẵn khung); kiểm tra responsive
trên màn nhỏ và độ tương phản màu theo đúng WCAG mà chính sản phẩm dùng để
chấm sinh viên — dùng luôn tiêu chí của mình để tự kiểm tra là điểm cộng khi
thuyết trình.

### 4. Khả năng tích hợp AI (10đ)

Đây là mục có rủi ro kỹ thuật rõ nhất (xem mục 3.2 của
`docs/04_KET_QUA_CAP_NHAT_TU_DU_AN_NEN.md`). Việc cần làm:
- Sửa `services/grading.service.ts`: tiêu chí `gradingSource: "ai"` không
  được set thẳng `awardedPoints` vào điểm cuối; luôn bắt buộc
  `status = "needs_teacher_review"` cho các tiêu chí do AI đề xuất, giáo viên
  phải bấm duyệt/sửa trước khi điểm được tính là chính thức. Điều này đưa
  hành vi thực tế của code khớp lại với câu cam kết đã ghi trong chính README
  của đề tài.
- Viết tài liệu kỹ thuật riêng (nộp kèm hồ sơ) mô tả: kiến trúc chấm lai
  runner + AI, schema JSON ràng buộc cho phản hồi AI
  (`services/rubric-parser.service.ts`, `lib/grading-contract.ts`), và trích
  thẳng số liệu benchmark SLM thật (27-33% accuracy, xem mục 2 của
  `docs/04_...`) để chứng minh nhóm hiểu giới hạn của AI thay vì chỉ quảng
  cáo "có AI".

### 5. Phong cách trình diễn (10đ)

Việc cần làm:
- Cập nhật `docs/slide.html` đã có sẵn thành slide trình bày tại chung kết.
- Chuẩn bị kịch bản demo trực tiếp: tạo lớp → giao bài → sinh viên nộp → hệ
  thống chấm tự động (runner + AI) → giáo viên duyệt/sửa điểm → sinh viên xem
  phản hồi. Diễn tập trước để vừa khung giờ hackathon.
- Chuẩn bị trả lời câu hỏi về giới hạn đã biết (độ chính xác AI thấp ở model
  nhỏ, dữ liệu synthetic vs. thật) — trả lời trung thực bằng số liệu đã có
  thường thuyết phục hơn né tránh câu hỏi.

## Mốc thời gian đề xuất (8 tuần, 05/08 → 30/09/2026)

| Tuần | Khoảng ngày | Việc chính |
|---|---|---|
| 1 | 05–11/08 | Xác nhận đã đăng ký dự thi; sửa lỗi AI tự quyết điểm; thêm LICENSE/NOTICE |
| 2 | 12–18/08 | Viết README build-from-source thật + `.env.example`; test clone sạch |
| 3–4 | 19/08–01/09 | Làm 3 bài tập mẫu thật; ảnh baseline/submission thật |
| 5 | 02–08/09 | Thu ≥30 bài giáo viên chấm độc lập; chạy lại baseline trên dữ liệu thật |
| 6 | 09–15/09 | Polish UI/UX + accessibility; viết tài liệu kỹ thuật AI |
| 7 | 16–22/09 | Tag `v0.1.0` + GitHub Release; điền `reports/MAU_BAO_CAO_KET_QUA.md`; CHANGELOG |
| 8 | 23–29/09 | Dự phòng sửa lỗi; nộp phiếu đăng ký + kho mã nguồn trước 30/09 |
| — | 01–08/10 | Ban tổ chức chấm kho mã nguồn — không đổi phạm vi, chỉ sửa lỗi nghiêm trọng |
| — | 10/10 | Chung kết: demo trực tiếp + hỏi đáp |
