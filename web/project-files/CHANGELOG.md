# Changelog

Định dạng theo [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Verified

- `npm install` + `npm run build` chạy sạch từ mã nguồn trong
  `source_code/from_github_android_ui_grader_AI` (Next.js 16.2.7/Turbopack,
  Node v24.15.0), sinh đủ 39 route. Yêu cầu `.env.local` có `JWT_SECRET`
  ngay cả khi chỉ build. Không build được trực tiếp trong đường dẫn OneDrive
  có ký tự `&` — phải copy ra ngoài OneDrive trước, xem `README.md`.

### Fixed

- `grading.service.ts`: tiêu chí rubric có `gradingSource: "ai"`/`"hybrid"`
  giờ luôn buộc `needsTeacherReview = true` và không còn ghi thẳng điểm AI đề
  xuất vào `finalScore` trước khi giáo viên duyệt — sửa mâu thuẫn với nguyên
  tắc "AI chỉ viết phản hồi, không tự quyết định điểm" đã ghi trong README.

### Removed

- `source_code/from_github_android_ui_grader_AI/H01.DTC225180215.BUI_VAN_MANH.KTPMK21B.docx`
  — tài liệu cá nhân (tên + MSV thật) của một sinh viên khác không thuộc
  nhóm DT06, lẫn sẵn trong repo tham khảo gốc. Đã loại khỏi bản giao và
  thêm vào `.gitignore` để đề phòng lặp lại nếu đồng bộ lại từ upstream.

### Added

- `.gitignore` ở gốc repo (trước đó chưa có — working copy chưa từng được
  git init) — loại `node_modules`, `.next`, `.env*`, model binary
  (`*.gguf`/`*.onnx`/...), file build Android/Python cache.
- `LICENSE` (MIT) và `NOTICE.md` ghi rõ nguồn/tình trạng giấy phép của các
  tài sản bên thứ ba (repo Next.js tham khảo chưa có giấy phép, model GGUF,
  benchmark `paper_tu`).
- `source_code/from_github_android_ui_grader_AI/.env.example` liệt kê đủ
  biến môi trường cần thiết để build/chạy ứng dụng.
- `docs/04_KET_QUA_CAP_NHAT_TU_DU_AN_NEN.md`: tổng hợp kết quả thật từ
  baseline Python, benchmark SLM `paper_tu`, và tình trạng repo nền.
- `docs/05_KE_HOACH_DU_THI_PMMN_2026.md`: kế hoạch bám theo từng tiêu chí
  thang điểm của cuộc thi, kèm mốc thời gian 8 tuần.

## [0.1.0] - chưa phát hành

Chưa tạo release/tag. Sẽ tạo trước hạn nộp 30/09/2026 theo
`docs/05_KE_HOACH_DU_THI_PMMN_2026.md`.
