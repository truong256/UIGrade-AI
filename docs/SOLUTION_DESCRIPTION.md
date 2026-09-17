# Mô Tả Giải Pháp UIGrade AI (Solution Description)

> **Tài liệu đặc tả giải pháp công nghệ tham gia Cuộc thi "Phát triển phần mềm mã nguồn mở tích hợp AI 2026"**
>
> *Dự án: UIGrade AI — Nền tảng Đánh giá Giao diện Người dùng và Chấm bài Lập trình Android Tích hợp Trí tuệ Nhân tạo Đa phương thức*

---

## 1. UIGrade AI là gì?

**UIGrade AI** là nền tảng công nghệ giáo dục mã nguồn mở (EdTech) phục vụ giảng dạy, thực hành và đánh giá tự động các bài tập lập trình giao diện di động (Android UI). Hệ thống kết hợp giữa công cụ đo đạc tất định (Deterministic Runner) và mô hình trí tuệ nhân tạo đa phương thức (Multimodal AI) theo quy trình hai giai đoạn Chấm - Phản biện (Grader-Critic), với nguyên tắc cốt lõi là bảo đảm quyền kiểm soát của giảng viên (Human-in-the-Loop).

---

## 2. Vấn đề Thực tế trong Đào tạo Lập trình Giao diện

Trong đào tạo kỹ thuật phần mềm và phát triển ứng dụng di động, giao diện người dùng (UI/UX) đóng vai trò quyết định đến chất lượng ứng dụng. Tuy nhiên, quy trình đánh giá bài tập giao diện hiện nay gặp phải những rào cản lớn:

1. **Giao bài và Cấu hình Tiêu chí Thiếu Chuẩn hóa:**
   - Giảng viên thường đưa ra mô tả bài tập bằng lời hoặc file văn bản rời rạc. Việc thiếu bộ tiêu chí (Rubric) có cấu trúc máy có thể đọc khiến sinh viên khó nắm bắt đúng yêu cầu kỹ thuật và thẩm mỹ.
2. **Quản lý Bài nộp Phức tạp và Rủi ro An ninh:**
   - Dự án Android có cấu trúc thư mục sâu, nhiều tệp nhị phân (`.apk`, `build/`, `gradle/`). Việc tiếp nhận tệp nén `.zip` tiềm ẩn nguy cơ bảo mật hệ thống (Zip Slip, Path Traversal) và khó khăn trong việc trích xuất tự động đúng mã nguồn cốt lõi (`AndroidManifest.xml`, layout XML, Kotlin code).
3. **Chấm bài Thủ công Tốn Kém Thời gian và Dễ Thiên lệch:**
   - Với các lớp học từ 50 đến hơn 100 sinh viên, giảng viên phải mở từng dự án trong Android Studio, build, chạy trên máy ảo/thiết bị thật để chụp màn hình và so sánh bằng mắt. Quy trình này tiêu tốn 15–25 phút cho mỗi bài nộp, dẫn đến mệt mỏi và thiếu sự nhất quán giữa bài chấm đầu và bài chấm cuối.
4. **Phản hồi Sinh viên Chậm trễ và Thiếu Bằng chứng Kỹ thuật:**
   - Do khối lượng chấm thủ công lớn, sinh viên thường chỉ nhận được điểm số tổng quát kèm vài dòng nhận xét chung chung sau 1–2 tuần nộp bài. Sinh viên không biết chính xác thuộc tính layout nào bị sai, độ tương phản màu sắc lệch chuẩn WCAG ở đâu, hay thành phần UI nào sai khác so với thiết kế mẫu.
5. **Rủi ro Ảo giác của Mô hình AI "Hộp Đen" (Black-box AI Hallucination):**
   - Nếu áp dụng trực tiếp LLM theo cách thông thường (đưa toàn bộ mã nguồn vào prompt và yêu cầu chấm điểm), mô hình dễ sinh ra "ảo giác": chấm điểm không căn cứ, tự bịa ra lỗi mà bài nộp không có, hoặc bỏ sót lỗi cấu trúc nghiêm trọng. Điểm số từ AI hộp đen không thể dùng làm điểm đánh giá học phần chính thức vì không có tính giải trình.

---

## 3. Giải pháp UIGrade AI

UIGrade AI giải quyết triệt để các vấn đề trên bằng triết lý kiến trúc ba trụ cột:

```text
Deterministic First  ──►  Multimodal AI Second  ──►  Human-in-the-Loop Always
  (Đo đạc tất định)         (Trí tuệ nhân tạo)         (Giảng viên phê duyệt)
```

1. **Tách biệt Yếu tố Kỹ thuật và Ngữ nghĩa:**
   - Các yếu tố có thể kiểm tra toán học và kỹ thuật (tệp bắt buộc, biên dịch mã, kiểm thử đơn vị, sai lệch pixel SSIM, độ tương phản WCAG) được giao cho **Deterministic Runner** xử lý độc lập và khách quan.
   - Các khía cạnh ngữ nghĩa (tính thẩm mỹ, mức độ hoàn thiện giao diện, tổ chức mã nguồn, trải nghiệm người dùng) được giao cho **Multimodal AI** phân tích.
2. **Neo bằng chứng Đa phương thức (Evidence Grounding):**
   - Mọi phân tích của AI đều phải gắn chặt với định danh bằng chứng cụ thể (`evidenceIds` trỏ đến tệp XML, dòng log runner, hoặc vùng ảnh diff). AI không được phép đưa ra nhận xét mà không có bằng chứng đối chiếu.
3. **Mô hình Grader-Critic Hai Giai đoạn Chống Thiên lệch:**
   - Giai đoạn 1: AI Grader đề xuất điểm và phân tích thế mạnh, điểm yếu theo từng tiêu chí Rubric.
   - Giai đoạn 2: AI Critic độc lập rà soát, phát hiện nguy cơ ảo giác hoặc bất thường về điểm số, đưa ra phán quyết (`ACCEPT`, `ADJUST`, hoặc `NEEDS_HUMAN_REVIEW`).
4. **Giảng viên Quyết định và Công bố (Human-in-the-Loop Gate):**
   - Điểm số và nhận xét từ AI chỉ lưu ở trạng thái khuyến nghị (`needs_teacher_review`). Sinh viên không thể thấy điểm cho đến khi giảng viên rà soát bằng chứng, điều chỉnh nếu cần, và nhấn **Publish**.

---

## 4. Các Nhóm Người Dùng (Target Personas)

Hệ thống phân định rõ quyền hạn và trải nghiệm cho ba nhóm người dùng:

| Nhóm người dùng | Trách nhiệm & Quyền hạn chính | Giao diện tương tác |
|---|---|---|
| **Sinh viên (Student)** | - Tham gia lớp học thông qua mã mời (Invite Code).<br>- Xem danh sách bài tập, hạn nộp, và tiêu chí Rubric chuẩn hóa.<br>- Nộp bài nháp (Draft) hoặc bài chính thức (Final) dưới dạng tệp nén `.zip`.<br>- Xem lịch sử nộp bài, trạng thái xử lý của hệ thống.<br>- Xem bảng điểm chính thức, phân tích chi tiết từng tiêu chí, ảnh đối chiếu và hướng dẫn cải thiện sau khi giảng viên đã phát hành. | Web Portal (Student View) + Android Companion App |
| **Giảng viên (Lecturer)** | - Tạo và quản lý lớp học, phê duyệt hoặc xóa sinh viên.<br>- Tạo bài tập, cấu hình Rubric (nhập văn bản tự nhiên để AI tự phân tích cấu trúc tiêu chí).<br>- Tải lên ảnh giao diện chuẩn (UI Baseline) và cấu hình Runner kiểm thử.<br>- Theo dõi danh sách bài nộp, lọc theo trạng thái chấm.<br>- Không gian làm việc chấm bài (Grading Workspace): xem đồng thời ảnh chụp sinh viên, ảnh chuẩn, ảnh diff, log runner và đề xuất từ AI.<br>- Điều chỉnh/ghi đè điểm số từng tiêu chí và xuất bản (Publish) kết quả.<br>- Xem thống kê phổ điểm và báo cáo học tập của lớp. | Web Portal (Lecturer Workspace) |
| **Quản trị viên (Admin)** | - Quản lý danh sách người dùng toàn hệ thống, tìm kiếm và phân trang.<br>- Phân vai trò người dùng (Student / Lecturer / Admin).<br>- Khóa hoặc kích hoạt lại tài khoản.<br>- Cấu hình thông số hệ thống, kết nối SMTP gửi thông báo.<br>- Bảo vệ tính toàn vẹn hệ thống: chính sách không cho phép Admin tự khóa chính mình hoặc xóa tài khoản Admin cuối cùng. | Web Portal (Admin Dashboard) |

---

## 5. Điểm Mới và Nổi Bật của Giải Pháp

Các điểm mới sau đây được hiện thực hóa trực tiếp trong mã nguồn của kho dự án (không phải ý tưởng lý thuyết):

1. **Phân tích và Chuẩn hóa Rubric Tự động (`rubric-parser.service.ts`):**
   - Cho phép giảng viên dán đề bài hoặc bảng tiêu chí tự nhiên, hệ thống tự động trích xuất thành mảng `RubricCriterion[]`, phân bổ điểm chính xác tới tổng điểm mong muốn, và tự động gán nguồn chấm (`runner`, `ai`, `hybrid`, `manual`).
2. **Bộ Đo đạc Giao diện Nghiêm ngặt (`visual-comparison.service.ts`):**
   - Sử dụng thuật toán kết hợp giữa chuẩn hóa kích thước pixel qua Sharp, trừ nhiễu nền trắng, phát hiện vùng khác biệt qua Pixelmatch, và tính điểm tương đồng UI có trọng số phạt chênh lệch khối nội dung.
3. **Cơ chế Neo Bằng chứng (`grading-evidence.service.ts`):**
   - Đóng gói toàn bộ mã nguồn, cấu trúc layout XML, số liệu đo đạc ảnh và log thực thi thành `GradingEvidenceBundle` với các `evidenceIds` chuẩn hóa (ví dụ: `code:activity_main.xml`, `metric:ssim_score`, `runner:manifest_check`).
4. **Quy trình AI Grader-Critic Hai Giai đoạn (`ai-grading-v2.service.ts`):**
   - Ép buộc mô hình xuất dữ liệu qua Zod Schema và JSON Schema chuẩn của Gemini. Mô hình Critic hoạt động như một vòng kiểm toán độc lập phát hiện và hạ điểm nếu Grader đưa ra kết luận thiếu căn cứ.
5. **Cổng Kiểm soát Con người Toàn diện (Human-in-the-Loop):**
   - Kết quả chấm máy được cách ly hoàn toàn với sinh viên thông qua cờ `is_published = false` ở cấp cơ sở dữ liệu (Supabase RLS). Giảng viên có quyền sửa điểm từng tiêu chí hoặc ghi đè toàn bộ điểm bài thi trước khi công bố.
6. **Bảo mật Đa tầng Cấp Cơ sở Dữ liệu:**
   - 18 tệp migration SQL thiết lập RLS chặt chẽ, triggers bảo vệ Last-Admin (`trg_protect_last_admin` với PostgreSQL advisory transaction locks), hàm lưu bài nộp `SECURITY DEFINER` ngăn ngừa gian lận attempt count.

---

## 6. Luồng Hoạt Động Chi Tiết (End-to-End Workflow)

```text
Giảng viên
   │
   ├─► 1. Tạo Lớp học ──► Nhận mã mời (Invite Code)
   │
   ├─► 2. Tạo Bài tập ──► Nhập mô tả, cấu hình Rubric, tải ảnh UI chuẩn (Baseline)
   │
   ▼
Sinh viên
   │
   ├─► 3. Tham gia Lớp ──► Nhập mã mời, chờ duyệt nếu lớp yêu cầu
   │
   ├─► 4. Nộp Bài ──► Tải lên file .zip chứa dự án Android
   │
   ▼
Hệ thống Backend (Tự động)
   │
   ├─► 5. Safe Extraction & Quét Tĩnh ──► Chống Zip Slip, kiểm tra AndroidManifest, Layouts
   │
   ├─► 6. Đo đạc Tất định ──► Tính toán độ tương đồng ảnh (Pixel diff, SSIM, WCAG)
   │
   ├─► 7. Đóng gói Bằng chứng ──► Tạo GradingEvidenceBundle với các Evidence IDs
   │
   ├─► 8. AI Grader Pipeline ──► Gemini 2.5 phân tích ngữ nghĩa, đề xuất điểm thành phần
   │
   ├─► 9. AI Critic Pipeline ──► Gemini 2.5 rà soát, phản biện, phát hiện hallucination
   │
   ├─► 10. Lưu kết quả tạm thời ──► Trạng thái needs_teacher_review (Sinh viên chưa thấy điểm)
   │
   ▼
Giảng viên (Human-in-the-Loop)
   │
   ├─► 11. Mở Grading Workspace ──► So sánh ảnh bài làm, ảnh mẫu, ảnh diff, xem đề xuất AI
   │
   ├─► 12. Điều chỉnh & Duyệt ──► Sửa điểm tiêu chí nếu cần, thêm nhận xét sư phạm
   │
   ├─► 13. Xuất bản (Publish) ──► Chuyển trạng thái sang published
   │
   ▼
Sinh viên
   │
   └─► 14. Nhận Kết quả ──► Xem bảng điểm chính thức, nhận xét chi tiết và cách khắc phục lỗi
```

---

## 7. Khả Năng Ứng Dụng Thực Tế

UIGrade AI được thiết kế hướng thẳng đến môi trường đào tạo thực tế tại các trường đại học, cao đẳng và trung tâm đào tạo công nghệ thông tin:

1. **Thực hành Môn học Lập trình Di động (Mobile Development):**
   - Hỗ trợ các học phần như Lập trình Android căn bản, Lập trình Android nâng cao, Thiết kế giao diện di động.
2. **Kiểm tra và Đánh giá Nhanh (In-class Lab & Quizzes):**
   - Sinh viên nộp bài thực hành ngay tại lớp và nhận kết quả phân tích tất định sơ bộ trong vòng vài phút, giúp giảng viên nắm bắt nhanh mức độ hiểu bài của cả lớp.
3. **Đánh giá Đồ án Giao diện (UI/UX Capstone Projects):**
   - Đo đạc định lượng mức độ tuân thủ thiết kế Figma/mẫu chuẩn thông qua chỉ số tương đồng trực quan và độ tương phản màu chuẩn tiếp cận WCAG.
4. **Học tập Tự định hướng (Formative Self-Assessment):**
   - Cho phép sinh viên nộp bài nháp (Draft Submission) để kiểm tra các lỗi cấu trúc tệp và đo đạc giao diện trước khi nộp bản chính thức.

---

## 8. Hạn Chế Hiện Tại và Kế Hoạch Phát Triển

Nhóm phát triển UIGrade AI tôn trọng tính trung thực khoa học và công khai các giới hạn kỹ thuật hiện tại:

1. **Phụ thuộc vào Dịch vụ AI Đám mây:**
   - Phân hệ AI hiện tại sử dụng API đám mây của Google Gemini. Trong trường hợp mất kết nối mạng hoặc cạn kiệt hạn mức (Quota), hệ thống phải kích hoạt cơ chế Fallback (chỉ lưu kết quả tất định của Runner và chuyển trạng thái chờ giảng viên chấm thủ công hoàn toàn).
2. **Giới hạn Mô hình Ngôn ngữ Nhỏ (SLM):**
   - Thử nghiệm độc lập của nhóm với các mô hình SLM nhỏ (dưới 3B tham số chạy cục bộ) cho thấy tỉ lệ hiểu sai cấu trúc UI phức tạp còn cao (độ chính xác chỉ ~30%). Nhóm chưa tích hợp chạy AI hoàn toàn offline trên thiết bị cho đến khi các mô hình SLM đạt năng lực suy luận thị giác tốt hơn.
3. **Giới hạn Dung lượng Tệp Nộp:**
   - Nhằm tối ưu chi phí lưu trữ Supabase Storage và bảo đảm an toàn máy chủ, hệ thống giới hạn kích thước tệp nén bài nộp ở mức 50MB (yêu cầu sinh viên loại bỏ thư mục `build/` và `.gradle/` trước khi nén).
4. **AI Đóng vai trò Trợ lý, Không Thay thế Con người:**
   - Hệ thống không hướng tới việc thay thế hoàn toàn vai trò của người thầy. Mọi quyết định phát hành điểm số chính thức bắt buộc phải có sự kiểm duyệt của giảng viên.
