# NOTICE - Nguồn gốc và giấy phép tài sản bên thứ ba

Giấy phép MIT trong `LICENSE` áp dụng cho mã nguồn do nhóm UIGrade AI (DT06)
viết mới. Các tài sản dưới đây đến từ nguồn khác, giữ giấy phép/tình trạng
gốc của chúng.

## 1. `source_code/from_github_android_ui_grader_AI/`

- Nguồn: `github.com/manh2404/android-ui-grader-AI`.
- **Tình trạng giấy phép (kiểm tra 2026-08-05): repo gốc KHÔNG có file
  LICENSE và KHÔNG có release/tag nào công khai.**
- **Hành động bắt buộc trước khi nộp bài dự thi**: nhóm phải làm một trong
  hai việc sau, không được để nguyên trạng:
  1. Liên hệ tác giả (`manh2404`) xin xác nhận bằng văn bản việc cho phép sử
     dụng lại/tái cấp phép mã nguồn này dưới MIT, lưu lại xác nhận (email/tin
     nhắn) trong `docs/`, hoặc
  2. Viết lại các phần lõi (đặc biệt các API route, service, model đang dùng
     trực tiếp trong sản phẩm dự thi) bằng code của nhóm, chỉ giữ lại kiến
     trúc/ý tưởng tổ chức thư mục làm tham khảo.
  Cho đến khi một trong hai việc trên hoàn tất, **không tuyên bố** phần code
  này thuộc phạm vi giấy phép MIT của repo dự thi.
- Các thư viện npm liệt kê trong
  `source_code/from_github_android_ui_grader_AI/package.json` giữ giấy phép
  riêng của từng thư viện (đa số MIT/Apache-2.0/ISC theo chuẩn hệ sinh thái
  npm) — không cần liệt kê lại ở đây, `package.json`/`package-lock.json` đã
  là nguồn tham chiếu đủ rõ.

## 2. `models/from_mobile_agent_paper/qwen2.5-0.5b-instruct-q4_k_m.gguf`

- Nguồn: `huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF`.
- Giấy phép: Apache License 2.0 (theo model card của Qwen2.5-0.5B-Instruct).
- Không chỉnh sửa trọng số mô hình; chỉ dùng nguyên bản GGUF Q4_K_M.

## 3. `models/` — model nền/SLM tùy chọn khác (theo `models/README.md`)

- Gemma-3-270M-IT GGUF Q4_K_M (`huggingface.co/unsloth/gemma-3-270m-it-GGUF`):
  giấy phép Gemma Terms of Use (không phải giấy phép OSI-approved theo nghĩa
  chặt — có điều khoản sử dụng riêng của Google). Nếu đưa file trọng số này
  vào bản phát hành dự thi, cần ghi rõ điều khoản Gemma đi kèm, tách biệt với
  giấy phép MIT của mã nguồn nhóm viết.
- SmolLM2-360M-Instruct GGUF Q4_K_M
  (`huggingface.co/bartowski/SmolLM2-360M-Instruct-GGUF`): giấy phép
  Apache-2.0.

## 4. `source_code/from_paper_tu/icta_rewrite/`

- Tài liệu/số liệu benchmark nội bộ (`ContextPaletteSLM_ICTA_rewrite.md` và
  các hình `composite_figures/`, `cropped_figures/`) là sản phẩm nghiên cứu
  nội bộ của nhóm tác giả `paper_tu` (Doan Ngoc Phuong, Tran Ngoc Tu), dùng
  làm tài liệu tham khảo/trích dẫn số liệu, không phải mã nguồn thực thi.

## 5. Dữ liệu `data/from_paper_tu/mayao.json`, `ssa03.json`

- Log benchmark thô (200 lượt chạy/thiết bị) sinh ra từ thực nghiệm nội bộ
  `paper_tu`, đi kèm bài viết ở mục 4. Dùng làm minh chứng số liệu, không
  chứa dữ liệu cá nhân.
