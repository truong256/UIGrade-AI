# Cập nhật kết quả từ các dự án nền (kiểm tra 2026-08-05)

Tài liệu này gộp lại các con số/kết quả thật đã có sẵn trong ba tài sản nền của
UIGrade AI — baseline Python, `paper_tu`/icta_rewrite, repo `android-ui-grader-AI`
— để nhóm sinh viên không phải dò lại từng file. Không tạo số liệu mới, chỉ trích
xuất và diễn giải số đã có.

## 1. Baseline chấm điểm (Python, dữ liệu synthetic)

Từ `reports/student_baseline_summary.json` (chạy `src/uigrade_baseline.py` trên
`data/student_practice_grades.jsonl`, n=8):

| Assignment | n | MAE | mean_bias | within_1_point |
|---|---:|---:|---:|---:|
| Toàn bộ | 8 | 0.875 | +0.125 | 0.75 |
| login_screen | 3 | 0.833 | +0.5 | 0.667 |
| product_list | 3 | 1.167 | +0.167 | 0.667 |
| profile_screen | 2 | 0.5 | -0.5 | 1.0 |

Ca cần xem lại (lệch >1 điểm so với giáo viên): **G03** (login_screen, màn
412x915: giáo viên 5.0 vs auto 6.5) và **G06** (product_list, 360x800: giáo viên
4.0 vs auto 6.0). Cả hai đều là trường hợp auto_score chấm **cao hơn** giáo viên
đáng kể trên bài có layout_similarity thấp (0.66 và 0.58) — dấu hiệu cho thấy
công thức quy đổi layout_similarity → điểm rubric hiện đang "khoan dung" hơn
giáo viên khi ảnh lệch nhiều. Đây là 8 dòng dữ liệu **synthetic**, chỉ dùng để
học công cụ; không được trích dẫn như kết quả nghiên cứu thật (xem
`docs/02_DE_CUONG_NCKH_TOI_THIEU.md`).

## 2. Benchmark SLM on-device (từ `paper_tu`/icta_rewrite)

Bài viết lại `ContextPaletteSLM_ICTA_rewrite.md` đã có kết quả đo thật (N=200
lượt suy luận/thiết bị, model Gemma-3-270M-IT GGUF Q4_K_M, tác vụ chọn palette
JSON có ràng buộc ngữ pháp — cùng họ model với model GGUF đã copy sẵn trong
`models/from_mobile_agent_paper/`):

| Metric | Emulator 8GB (MayAo) | Điện thoại 3GB (SSA03, Galaxy A03) |
|---|---:|---:|
| Độ chính xác ngữ nghĩa | 27.0% (54/200) | 33.0% (66/200) |
| TTFT trung bình | 1596.98 ms | 1090.75 ms |
| Tổng thời gian suy luận | 2732.57 ms | 2173.36 ms |
| Throughput | 0.74 tok/s | 0.92 tok/s |
| RAM (RSS) trung bình | 1065.36 MB | 552.89 MB |
| Pin | không đo | ~11.25%/giờ dưới tải benchmark liên tục |

**Ý nghĩa cho UIGrade AI:**

- Độ trễ (~1-2s) và RAM (~550MB trên máy yếu) đủ chấp nhận được cho tác vụ
  "sinh 1 đoạn phản hồi ngắn theo rubric" nếu có cache/throttle, **không** đủ
  cho suy luận liên tục theo thời gian thực.
- Độ chính xác ngữ nghĩa chỉ 27-33% ở quy mô 270M tham số. Đây là bằng chứng
  trực tiếp, đo được, cho nguyên tắc đã ghi trong README của đề tài: **AI chỉ
  nên sinh phản hồi/gợi ý, không nên tự quyết định điểm số**. Nếu dùng SLM
  270M để tự chấm, tỷ lệ sai ngữ nghĩa còn cao hơn MAE hiện tại của baseline
  rule-based.
- Nên trích số 27-33% này trực tiếp vào tài liệu kỹ thuật nộp thi, ở mục "Khả
  năng tích hợp AI" — giám khảo chấm dựa trên tài liệu kỹ thuật công bố kèm
  theo, và số liệu đo thật (kể cả khi thấp) có sức thuyết phục hơn mô tả chung
  chung.

## 3. Trạng thái repo nền `manh2404/android-ui-grader-AI` (kiểm tra qua GitHub)

Bản copy tại `source_code/from_github_android_ui_grader_AI` **không phải** chỉ
là khung create-next-app rỗng như README của nó thể hiện — `package.json` và
`services/` cho thấy đây đã là một ứng dụng khá đầy đủ: đăng nhập/JWT, lớp học,
bài tập, nộp bài (zip/APK qua `adm-zip`/`unzipper`), so sánh ảnh
(`pixelmatch`+`sharp`), parser rubric (`zod`), MongoDB, và chấm tự động lai
runner+AI qua Gemini (`services/grading.service.ts`,
`services/gemini.service.ts`).

Hai điểm cần xử lý trước khi dự thi:

1. **Giấy phép**: kiểm tra trực tiếp trang GitHub của `manh2404/android-ui-grader-AI`
   ngày 2026-08-05 — repo **không có file LICENSE và không có release/tag
   nào**. Nếu nhóm sao chép nguyên code này vào sản phẩm dự thi và tự cấp
   giấy phép OSI cho toàn repo, đó là **xung đột giấy phép** (tiêu chí 2 trong
   thể lệ, trừ tới -5 cho "mã nguồn tự thân chứa sự không tương thích của các
   giấy phép"), vì code gốc chưa có giấy phép để nhóm được quyền tái cấp phép.
   Hướng xử lý: coi kiến trúc/luồng nghiệp vụ của repo này là tài liệu tham
   khảo (đúng như README nội bộ đã ghi "repo Next.js có sẵn là nền tham
   khảo"), viết lại các phần lõi bằng code của nhóm trước khi gắn LICENSE của
   nhóm, hoặc liên hệ tác giả xin xác nhận giấy phép bằng văn bản và ghi rõ
   nguồn trong `NOTICE`/`THIRD_PARTY_NOTICES.md`.
2. **AI đang tự quyết định điểm**: trong `grading.service.ts`, tiêu chí rubric
   có `gradingSource: "ai"` thì `awardedPoints` lấy thẳng từ kết quả Gemini
   (`buildBreakdown` → nhánh `criterion.gradingSource === "ai"`), không qua
   rule/metric kiểm chứng được. Điều này **mâu thuẫn trực tiếp** với câu mở
   đầu README của chính đề tài ("AI chỉ viết phản hồi, không tự quyết định
   điểm ở phiên bản đầu") và với hướng dẫn ở
   `docs/00_HUONG_DAN_GIANG_VIEN_VA_SINH_VIEN.md` ("sinh viên không được
   quảng bá AI là người chấm cuối cùng"). Cần sửa trước khi nộp bài, không chỉ
   vì điểm thi mà vì đây là mâu thuẫn logic trong chính sản phẩm — xem hành
   động cụ thể ở mục 4, tiêu chí II.4 của
   `docs/05_KE_HOACH_DU_THI_PMMN_2026.md`.

## 4. Tài sản có thể dùng lại ngay

| Tài sản | Vị trí | Có thể dùng ngay? |
|---|---|---|
| Khung Next.js (auth, lớp học, bài tập, nộp bài, dashboard) | `source_code/from_github_android_ui_grader_AI` | Có, sau khi xử lý giấy phép (mục 3.1) |
| So sánh ảnh pixel + resize | `services/visual-comparison.service.ts` | Có |
| Rubric parser (Zod) | `services/rubric-parser.service.ts` | Có |
| Model GGUF Qwen2.5-0.5B-Instruct | `models/from_mobile_agent_paper/qwen2.5-0.5b-instruct-q4_k_m.gguf` | Có, giấy phép Apache-2.0 (ghi rõ nguồn khi dùng) |
| Số liệu benchmark SLM thật | `source_code/from_paper_tu/icta_rewrite/` | Có, trích dẫn thẳng vào tài liệu kỹ thuật |
| Baseline MAE/bias Python | `src/uigrade_baseline.py` + `reports/student_baseline_summary.json` | Có, nhưng phải chạy lại trên dữ liệu thật trước khi báo cáo |
