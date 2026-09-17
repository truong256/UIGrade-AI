# Quy Trình Chấm Bài AI & Nguyên Tắc Con Người Kiểm Soát (AI Grading Pipeline)

> **Tài liệu kỹ thuật chuyên sâu về phân hệ Trí tuệ Nhân tạo Đa phương thức trong UIGrade AI**
>
> *Tham gia Cuộc thi "Phát triển phần mềm mã nguồn mở tích hợp AI 2026"*

---

## 1. Tuyên Bố Nguyên Tắc Cốt Lõi: AI Không Phải Nguồn Quyết Định Cuối Cùng

Trong môi trường giáo dục đại học, điểm số của sinh viên ảnh hưởng trực tiếp đến kết quả học tập, học bổng và bằng cấp. Do đó, UIGrade AI khẳng định một nguyên tắc bất biến xuyên suốt toàn bộ hệ thống:

> [!IMPORTANT]
> **TRÍ TUỆ NHÂN TẠO (AI) CHỈ ĐÓNG VAI TRÒ TRỢ TÁ — GIẢNG VIÊN LÀ NGƯỜI QUYẾT ĐỊNH DUY NHẤT.**
>
> - **AI KHÔNG** tự động chốt điểm chính thức vào học bạ sinh viên.
> - **AI CHỈ CÓ NHIỆM VỤ:**
>   1. Phân tích ngữ nghĩa mã nguồn và cấu trúc giao diện.
>   2. Đối chiếu bài làm với tiêu chí Rubric do giảng viên thiết lập.
>   3. Cung cấp bằng chứng kỹ thuật cụ thể (Evidence IDs).
>   4. Đưa ra **điểm đề xuất sơ bộ (Suggested Score)** và nhận xét định dạng hỗ trợ giảng viên.
> - **GIẢNG VIÊN LÀ NGƯỜI:**
>   1. Trực tiếp xem xét các bằng chứng đối chiếu trực quan (ảnh chụp sinh viên, ảnh mẫu, ảnh diff).
>   2. Rà soát khuyến nghị và nhận xét từ AI.
>   3. Điều chỉnh hoặc ghi đè (Manual Override) điểm số từng tiêu chí nếu thấy chưa thỏa đáng.
>   4. Phê duyệt và chủ động bấm **"Phát hành kết quả" (Publish Grade)** để sinh viên có thể xem.

---

## 2. Quy Trình Chấm Bài Đa Tầng Thực Tế (End-to-End Pipeline)

Quy trình xử lý một bài nộp trong mã nguồn (`web/site/services/` và `web/site/app/api/grading/`) diễn ra qua các bước tuần tự sau:

```text
       [Bài nộp của sinh viên (.zip)]
                     │
                     ▼
       ┌─────────────────────────────┐
       │   Bước 1: Pre-processing    │ ──► Kiểm tra định dạng .zip, dung lượng (<50MB),
       │   (Giải nén an toàn)        │     ngăn chặn lỗ hổng Zip Slip & Path Traversal.
       └─────────────────────────────┘
                     │
                     ▼
       ┌─────────────────────────────┐
       │ Bước 2: Deterministic Checks│ ──► Kiểm tra tệp bắt buộc (AndroidManifest.xml, layouts),
       │ (Kiểm tra kỹ thuật tất định)│     tính toán sai khác ảnh SSIM, MSE, độ tương phản WCAG.
       └─────────────────────────────┘
                     │
                     ▼
       ┌─────────────────────────────┐
       │ Bước 3: Evidence Bundle     │ ──► Đóng gói toàn bộ code, layout, log runner và ảnh đối chiếu;
       │ (Đóng gói bằng chứng)       │     gán định danh duy nhất (Evidence IDs) cho từng thành phần.
       └─────────────────────────────┘
                     │
                     ▼
       ┌─────────────────────────────┐
       │ Bước 4: AI Grader           │ ──► Gemini 2.5 Flash/Pro phân tích ngữ nghĩa, đề xuất điểm,
       │ (Mô hình chấm sơ bộ)        │     bắt buộc trích dẫn Evidence IDs cho mọi nhận định.
       └─────────────────────────────┘
                     │
                     ▼
       ┌─────────────────────────────┐
       │ Bước 5: AI Critic           │ ──► Vòng gọi mô hình thứ hai độc lập rà soát lại kết quả Grader,
       │ (Mô hình phản biện độc lập) │     phát hiện thiên vị hoặc hallucination; đưa ra phán quyết.
       └─────────────────────────────┘
                     │
                     ▼
       ┌─────────────────────────────┐
       │ Bước 6: Schema Validation   │ ──► Kiểm thực nghiêm ngặt cấu trúc đầu ra bằng Zod Schema;
       │ (Kiểm thực cấu trúc)        │     đảm bảo không vượt quá thang điểm tối đa của Rubric.
       └─────────────────────────────┘
                     │
                     ▼
       ┌─────────────────────────────┐
       │ Bước 7: AI Suggestion       │ ──► Lưu vào Database ở trạng thái needs_teacher_review
       │ (Lưu khuyến nghị tạm thời)  │     (is_published = false; Sinh viên CHƯA THỂ xem kết quả).
       └─────────────────────────────┘
                     │
                     ▼
       ┌─────────────────────────────┐
       │ Bước 8: Lecturer Review     │ ──► Giảng viên mở Grading Workspace: đối chiếu ảnh chụp,
       │ (Giảng viên thẩm định)      │     kiểm tra nhận xét AI và các Evidence IDs tương ứng.
       └─────────────────────────────┘
                     │
                     ▼
       ┌─────────────────────────────┐
       │ Bước 9: Manual Override     │ ──► Giảng viên sửa điểm hoặc bổ sung nhận xét sư phạm
       │ (Ghi đè thủ công nếu cần)   │     theo quyết định chuyên môn của mình.
       └─────────────────────────────┘
                     │
                     ▼
       ┌─────────────────────────────┐
       │ Bước 10: Publish Grade      │ ──► Giảng viên phê duyệt chính thức (is_published = true);
       │ (Xuất bản kết quả)          │     sinh viên nhận thông báo và xem được bảng điểm.
       └─────────────────────────────┘
```

---

## 3. Cơ Chế Neo Bằng Chứng (Evidence Grounding)

Một trong những hạn chế lớn nhất của việc ứng dụng LLM trong chấm bài là **ảo giác (hallucination)**: mô hình tự tưởng tượng ra sinh viên làm thiếu một nút bấm, hoặc khen ngợi một tính năng mà sinh viên không hề cài đặt.

Để triệt tiêu hiện tượng này, UIGrade AI xây dựng cơ chế **Evidence Grounding** thông qua dịch vụ `grading-evidence.service.ts`:

### 3.1. Cấu trúc Gán Mã Định danh Bằng chứng (Evidence IDs)
Mọi dữ liệu đưa vào ngữ cảnh chấm bài đều được đánh số định danh duy nhất:

| Loại bằng chứng (Evidence Type) | Cú pháp Evidence ID | Ví dụ thực tế |
|---|---|---|
| **Tệp tin mã nguồn** | `code:<tên_tệp>` | `code:activity_main.xml`, `code:MainActivity.kt` |
| **Cấu trúc Android** | `manifest:<thẻ_xml>` | `manifest:package_name`, `manifest:permissions` |
| **Chỉ số thị giác** | `metric:<tên_chỉ_số>` | `metric:ssim_score`, `metric:visual_diff_percent` |
| **Chỉ số màu sắc** | `contrast:<thành_phần>` | `contrast:text_primary_wcag`, `contrast:button_bg` |
| **Nhật ký thực thi** | `runner:<tiến_trình>` | `runner:zip_structure_check`, `runner:gradle_build` |

### 3.2. Trạng Thái Bằng Chứng (Evidence Status)
Hệ thống phân loại mức độ tin cậy của bằng chứng theo 3 trạng thái:
- `verified`: Bằng chứng đã được kiểm chứng trực tiếp từ tệp tin hoặc kết quả đo đạc chính xác của Runner.
- `insufficient`: Có dấu hiệu trong bài nộp nhưng dữ liệu chưa đủ để khẳng định hoàn toàn đạt tiêu chí.
- `missing`: Không tìm thấy tệp hoặc bằng chứng yêu cầu trong tệp nén của sinh viên.

### 3.3. Ràng buộc Prompt Chống Chém Gió
Trong System Instruction gửi tới Gemini:
```text
BẮT BUỘC: Mỗi tiêu chí đánh giá phải kèm theo danh sách evidenceIds trích dẫn chính xác
từ các ID đã được cung cấp trong GradingEvidenceBundle.
TUYỆT ĐỐI KHÔNG được tự nghĩ ra bằng chứng hoặc trừ điểm nếu không có evidenceId tương ứng.
Nếu bài nộp thiếu bằng chứng, hãy đặt evidenceStatus = 'missing' và giải thích rõ tệp bị thiếu.
```

---

## 4. Kiến Trúc Grader-Critic Hai Giai Đoạn (Two-Stage Grader-Critic)

Được hiện thực hóa trong `web/site/services/ai-grading-v2.service.ts`:

### Giai đoạn 1: Grader (Người chấm sơ bộ)
- **Nhiệm vụ:** Đọc toàn bộ `GradingEvidenceBundle` và danh sách `RubricCriterion[]`.
- **Đầu ra:** Đề xuất điểm số thành phần cho từng tiêu chí (`suggestedScore`), điểm tự tin (`confidence` từ 0.0 đến 1.0), chỉ ra thế mạnh (`strengths`), lỗi cần khắc phục (`issues`), và bước cải thiện tiếp theo (`nextSteps`).
- **Định dạng:** Ép buộc định dạng JSON Schema thông qua tham số `responseSchema` của Gemini SDK.

### Giai đoạn 2: Critic (Người phản biện độc lập)
- **Nhiệm vụ:** Rà soát lại toàn bộ bản thảo do Grader sinh ra dựa trên chính các bằng chứng gốc.
- **Tiêu chí phản biện:**
  - Grader có cho điểm quá phóng khoáng so với lỗi được liệt kê không?
  - Grader có trừ điểm quá khắt khe ở tiêu chí mà Runner đã xác nhận đạt chuẩn không?
  - Các `evidenceIds` do Grader trích dẫn có thực sự tồn tại trong bundle không?
- **Phán quyết của Critic (Verdicts):**
  1. `ACCEPT`: Bản chấm của Grader hợp lý, giữ nguyên kết quả đề xuất.
  2. `ADJUST`: Critic phát hiện điểm chưa hợp lý, tiến hành điều chỉnh điểm (`newSuggestedScore`) kèm lý do cụ thể (`reason`).
  3. `NEEDS_HUMAN_REVIEW`: Phát hiện mâu thuẫn lớn hoặc nghi ngờ ảo giác, gắn cờ cảnh báo đặc biệt để giảng viên lưu tâm khi duyệt bài.

---

## 5. Kiểm Thực Lược Đồ Dữ Liệu Chặt Chẽ (Strict Zod Validation)

Để ngăn chặn các lỗi tràn số, lỗi cấu trúc hoặc giá trị điểm không hợp lệ từ LLM, toàn bộ kết quả trả về từ cả hai giai đoạn đều phải vượt qua bộ lọc Zod:

```typescript
const graderCriterionSchema = z.object({
    criterionCode: z.string().trim().min(1),
    suggestedScore: z.number().finite(),
    confidence: z.number().finite().min(0).max(1),
    evidenceIds: z.array(z.string().trim().min(1)).max(12),
    evidenceStatus: z.enum(["verified", "insufficient", "missing"]),
    summary: z.string().trim().min(1).max(3000),
    strengths: z.array(z.string().trim().min(1).max(1000)).max(12),
    issues: z.array(z.string().trim().min(1).max(1000)).max(12),
    suggestions: z.array(z.string().trim().min(1).max(1000)).max(12),
});
```

Hệ thống tự động thực hiện hàm `clampScore(score, 0, maxPoints)` để bảo đảm AI không bao giờ đề xuất số điểm âm hoặc vượt quá điểm tối đa của tiêu chí đó trong Rubric.

---

## 6. Cơ Chế Fallback An Toàn Khi Gặp Sự Cố (Graceful Degradation)

Hệ thống được thiết kế để không bao giờ dừng hoạt động hay làm mất dữ liệu của sinh viên khi dịch vụ AI gặp trục trặc:

1. **Hết Quota / Mất kết nối mạng đến Google Gemini:**
   - Hệ thống bắt lỗi `AiGradingError` và ghi log cảnh báo.
   - Giữ nguyên toàn bộ kết quả đo đạc từ **Deterministic Runner** (kết quả quét cấu trúc tệp, chỉ số tương đồng trực quan SSIM).
   - Đánh dấu bài nộp là `needs_teacher_review` với thông báo: *"Dịch vụ AI đang bận. Điểm số kỹ thuật tất định đã được lưu đầy đủ, vui lòng hoàn tất chấm điểm thủ công."*
2. **Lỗi Parse JSON từ LLM:**
   - Kích hoạt retry tối đa 1 lần với nhiệt độ (temperature) thấp hơn. Nếu vẫn thất bại, chuyển về chế độ dự phòng an toàn.

---

## 7. Bằng Chứng Thực Nghiệm & Tính Trung Thực Khoa Học

Trong quá trình nghiên cứu và thử nghiệm (được ghi nhận trong `docs/04_KET_QUA_CAP_NHAT_TU_DU_AN_NEN.md` và `web/project-files/reports/`):

- Nhóm đã tiến hành thử nghiệm chấm bài tự động với các mô hình ngôn ngữ nhỏ (Small Language Models - SLM như Qwen2.5-0.5B) chạy cục bộ. Kết quả cho thấy độ chính xác nhận diện lỗi layout chỉ đạt từ **27.3% đến 33.1%**, do các mô hình nhỏ bị giới hạn nghiêm trọng về khả năng suy luận không gian thị giác và cấu trúc thẻ XML lồng nhau.
- Từ kết quả thực nghiệm đó, nhóm quyết định lựa chọn giải pháp:
  - Sử dụng mô hình đa phương thức tiên tiến (**Gemini 2.5**) qua API máy chủ cho khâu phân tích ngữ nghĩa.
  - Sử dụng công cụ tính toán ma trận pixel thuần túy (**Sharp, Pixelmatch, SSIM**) cho khâu đo đạc trực quan.
  - Luôn duy trì vai trò kiểm soát tối thượng của giảng viên (Human-in-the-Loop) thay vì tiếp thị sai lệch rằng hệ thống có thể chấm bài tự động 100% không cần con người.
