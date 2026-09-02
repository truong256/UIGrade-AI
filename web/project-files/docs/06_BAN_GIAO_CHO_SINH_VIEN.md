# Gói bàn giao cho nhóm DT06 — UIGrade AI

Kiểm tra ngày 2026-08-05. Tài liệu này liệt kê đúng những gì thầy/cô cần chuẩn
bị/quyết định trước khi giao dự án cho nhóm sinh viên, dựa trên kiểm tra thực
tế thư mục làm việc và repo đã push.

## 1. Kho mã nguồn — cần cấp quyền truy cập

- Repo đã tồn tại và **public**: `github.com/dnphuongictu/SV06` (kiểm tra qua
  GitHub: xem được không cần đăng nhập, 0 collaborator, 0 release).
- Sinh viên **chưa có quyền push** vào repo này. Cần chọn một trong hai cách,
  rồi thực hiện thủ công trên GitHub (không tự động hoá được từ đây vì cần
  đăng nhập tài khoản `dnphuongictu`):
  1. Vào Settings → Collaborators của repo, thêm GitHub username của 3 em
     làm collaborator (Write access).
  2. Hoặc chuyển quyền sở hữu (Transfer ownership) repo cho một em làm trưởng
     nhóm (Nguyễn Duy Trường), rồi em đó tự thêm 2 bạn còn lại.
- **Việc cần thầy/cô làm ngay**: xin GitHub username của cả 3 em
  (Nguyễn Duy Trường, Nguyễn Quốc Thanh, Phạm Văn Dương) — hiện chưa có trong
  hồ sơ đăng ký.

## 2. Model GGUF — KHÔNG nằm trong git, cần tải riêng

`models/from_mobile_agent_paper/qwen2.5-0.5b-instruct-q4_k_m.gguf` nặng
**469 MB**, vượt giới hạn 100MB/file cứng của GitHub. `.gitignore` của repo đã
loại `*.gguf`/`*.safetensors`/`*.tflite`/`*.onnx`/`*.pt`/`*.pth` một cách chủ
động — đây là quyết định đúng (repo nhẹ, không vi phạm giới hạn GitHub), nhưng
nghĩa là **khi sinh viên `git clone` repo, sẽ không có sẵn file model này**.

Hai cách xử lý, chọn một và ghi rõ trong hướng dẫn giao việc:
- Cách 1 (khuyến nghị): để sinh viên tự tải theo link đã có sẵn trong
  `models/README.md` (Hugging Face, `unsloth/gemma-3-270m-it-GGUF`,
  `Qwen/Qwen2.5-0.5B-Instruct-GGUF`) — đúng tinh thần "không đóng gói tài sản
  bên thứ ba" mà thể lệ khuyến khích.
- Cách 2: nếu mạng của sinh viên yếu, thầy/cô copy trực tiếp file `.gguf` qua
  USB/Drive/Zalo nội bộ — không đẩy qua git.

## 3. File cần loại bỏ trước khi bàn giao (riêng tư, không liên quan) — ĐÃ XỬ LÝ

`source_code/from_github_android_ui_grader_AI/H01.DTC225180215.BUI_VAN_MANH.KTPMK21B.docx`
(16 MB) là tài liệu báo cáo cá nhân của một sinh viên khác (tên + mã số sinh
viên thật, không thuộc nhóm DT06) — có vẻ là báo cáo NCKH gốc của tác giả repo
`manh2404`. **Đã xoá khỏi thư mục làm việc `06_UIGrade_AI` (2026-08-05)** và
thêm vào `.gitignore` gốc để không bị thêm lại nếu đồng bộ lại từ upstream.

## 4. Biến môi trường cần quyết định trước khi giao

`source_code/from_github_android_ui_grader_AI/.env.example` đã liệt kê đủ
tên biến. Thầy/cô cần quyết định cấp sẵn hay để nhóm tự tạo:

| Biến | Cách lấy | Khuyến nghị |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas free tier (tự đăng ký) hoặc cài local | Để nhóm tự tạo — mỗi nhóm dùng cluster riêng, tránh chung dữ liệu với nhóm khác |
| `JWT_SECRET` | Chuỗi ngẫu nhiên bất kỳ | Để nhóm tự sinh, không cần thầy/cô cấp |
| `GEMINI_API_KEY` | Google AI Studio free tier | Để nhóm tự đăng ký bằng email cá nhân — tránh chia sẻ chung 1 key giữa nhiều nhóm (dễ vượt hạn mức, khó truy vết khi có sự cố) |

Không có key/secret thật nào bị lộ trong thư mục hiện tại (đã rà theo mẫu
API key, connection string có mật khẩu — không thấy).

## 4b. Đã build thử thành công — lưu ý nếu nhóm cũng dùng máy có OneDrive

`npm install` + `npm run build` đã chạy thành công (39 route, Next.js
16.2.7/Turbopack). Nếu máy của em nào cũng đồng bộ OneDrive và thư mục dự án
nằm trong đường dẫn có dấu `&`/khoảng trắng, build có thể báo lỗi kiểu
"'...' is not recognized..." hoặc Turbopack báo "outside of root directory".
Cách né: copy thư mục dự án ra một đường dẫn thường (không qua OneDrive)
trước khi `npm install`/`npm run build` — chi tiết trong `README.md`. Không
gặp vấn đề này khi chỉ đọc/sửa code, chỉ khi build/chạy.

## 5. Dung lượng bàn giao

Tổng thư mục `06_UIGrade_AI` hiện ~499 MB, trong đó model GGUF chiếm 469 MB.
Nếu loại model (sinh viên tự tải theo mục 2) và file docx cá nhân (mục 3),
phần còn lại chỉ ~13 MB — phù hợp để copy qua email/Drive/USB nếu cần bàn
giao ngoài git.

## 6. Thứ tự tài liệu nên đọc khi nhận bàn giao

1. `README.md` — chạy thử baseline + build ứng dụng Next.js.
2. `docs/00_HUONG_DAN_GIANG_VIEN_VA_SINH_VIEN.md` — lộ trình 8 tuần.
3. `docs/01_chuan_bi_du_lieu_bai_bao_mo_hinh.md` — dữ liệu/bài báo/model.
4. `docs/04_KET_QUA_CAP_NHAT_TU_DU_AN_NEN.md` — kết quả thật đã có sẵn.
5. `docs/05_KE_HOACH_DU_THI_PMMN_2026.md` — việc cần làm theo thang điểm.
6. `NOTICE.md` — đặc biệt mục giấy phép repo Next.js tham khảo, nhóm phải xử
   lý trước khi nộp bài (xin phép tác giả hoặc viết lại phần lõi).

## 7. Liên hệ Ban tổ chức (theo thông báo thể lệ)

- Thầy Nguyễn Thanh Hải — 0968550888 — nthai@ictu.edu.vn
- Thầy Vũ Đức Quang — 0352340851 — vdquang@ictu.edu.vn
- Thầy Nguyễn Thế Vịnh (Trưởng Bộ môn) — 0944550550 — vinhnt@ictu.edu.vn

## 8. Checklist trước khi bấm "giao việc"

- [ ] Đã xác nhận nhóm DT06 đăng ký dự thi thành công (xem cảnh báo ở
      `docs/05_KE_HOACH_DU_THI_PMMN_2026.md` — hạn đăng ký thể lệ ghi
      30/06/2026, bản dự thảo nội bộ còn ghi "chưa gửi Google Form").
- [ ] Đã có GitHub username của cả 3 em, đã thêm collaborator hoặc chuyển
      quyền sở hữu repo `SV06`.
- [x] Đã xoá `H01.DTC225180215.BUI_VAN_MANH.KTPMK21B.docx` khỏi bản giao
      (2026-08-05).
- [ ] Đã quyết định cách nhóm lấy model GGUF (tự tải hay copy tay).
- [ ] Đã thống nhất với nhóm việc mỗi em tự tạo `MONGODB_URI`/`GEMINI_API_KEY`
      riêng, không dùng chung khoá của thầy/cô.
