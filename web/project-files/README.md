# UIGrade AI - bộ nền sinh viên

Nền tảng hỗ trợ chấm giao diện Android theo rubric. Metric/rule tạo điểm có thể
kiểm tra; AI chỉ viết phản hồi/đề xuất, giáo viên phải duyệt trước khi điểm
được coi là chính thức (xem `services/grading.service.ts`).

Giấy phép: MIT cho mã nguồn nhóm viết mới, xem `LICENSE`. Tài sản bên thứ ba
(repo tham khảo, model GGUF, benchmark) có tình trạng giấy phép riêng, xem
`NOTICE.md` — đặc biệt lưu ý mục repo Next.js tham khảo hiện chưa có giấy phép
gốc, cần xử lý trước khi nộp bài dự thi. Thay đổi gần đây xem `CHANGELOG.md`.

## Baseline chấm điểm (Python)

Dùng để học MAE/bias/within-1-point trước khi chấm ảnh/bài thật.

```powershell
cd 06_UIGrade_AI
python src/uigrade_baseline.py data/student_practice_grades.jsonl
python -m unittest discover -s tests -v
```

## Ứng dụng chấm bài (Next.js)

Mã nguồn tại `source_code/from_github_android_ui_grader_AI` — web app đăng
nhập, tạo lớp/bài tập, nộp bài, chấm tự động (so sánh ảnh + rubric + AI đề
xuất), giáo viên duyệt điểm.

Yêu cầu: Node.js 20+, MongoDB (local hoặc Atlas). Tùy chọn: `GEMINI_API_KEY`
để bật phản hồi AI (thiếu thì hệ thống tự dùng fallback không AI, không lỗi).

```powershell
cd source_code/from_github_android_ui_grader_AI
copy .env.example .env.local   # rồi điền MONGODB_URI, JWT_SECRET, ...
npm install
npm run build
npm run start
```

Chạy dev server (hot reload) thay vì build production: `npm run dev`.

**Đã kiểm chứng thật** (2026-08-05): `npm install` + `npm run build` chạy sạch,
sinh đủ 39 route. Hai điều cần biết:

1. `JWT_SECRET` bắt buộc phải có trong `.env.local` **kể cả khi chỉ build**
   (không riêng lúc chạy) — thiếu sẽ báo lỗi ngay ở bước "Collecting page
   data".
2. Nếu máy bạn cũng làm việc trong thư mục OneDrive có ký tự `&`/khoảng
   trắng trong đường dẫn và gặp lỗi build kiểu `'...' is not recognized as
   an internal or external command` hoặc Turbopack báo
   "Cannot depend on path ... outside of root directory": `subst` một ổ đĩa
   ảo không đủ để né lỗi này (khác với một số lỗi Gradle) — cần copy hẳn thư
   mục `source_code/from_github_android_ui_grader_AI` ra một đường dẫn không
   qua OneDrive (ví dụ `D:\...`) rồi build từ đó.

## Tài liệu

- `docs/00_HUONG_DAN_GIANG_VIEN_VA_SINH_VIEN.md`: lộ trình 8 tuần cho sinh viên.
- `docs/01_chuan_bi_du_lieu_bai_bao_mo_hinh.md`: dữ liệu/bài báo/model cần đọc.
- `docs/04_KET_QUA_CAP_NHAT_TU_DU_AN_NEN.md`: kết quả thật đã có từ các dự án nền.
- `docs/05_KE_HOACH_DU_THI_PMMN_2026.md`: kế hoạch dự thi bám theo thang điểm.
