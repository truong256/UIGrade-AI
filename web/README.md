# UIGrade AI — Web & Nghiên cứu

Thư mục `web/` chứa toàn bộ thành phần liên quan đến nền tảng Web và tài liệu/dữ liệu nghiên cứu của dự án **UIGrade AI**.

---

## 📂 Phân vùng thư mục

### 1. `web/site/` (Ứng dụng Web chính thức)
- **Mục đích**: Website chính thức cung cấp giao diện người dùng cho Giảng viên, Sinh viên và Quản trị viên; tích hợp hệ thống chấm bài tự động, so khớp cây giao diện (Layout Inspector), phân tích thị giác (Visual Testing), tích hợp Gemini AI và quản lý dữ liệu qua Supabase.
- **Công nghệ**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Supabase (PostgreSQL, RLS, Storage), Vitest.
- **Cách cài đặt & khởi chạy**:
  ```bash
  cd web/site
  copy .env.example .env.local    # Cấu hình biến môi trường cục bộ
  npm ci                         # Cài đặt chính xác các dependency
  npm run dev                    # Chạy dev server tại http://localhost:3000
  npm run build                  # Đóng gói bản production
  npm test                       # Chạy unit & integration tests
  npm run lint                   # Kiểm tra quy chuẩn mã nguồn ESLint
  ```

---

### 2. `web/project-files/` (Tài liệu, Dữ liệu & Nghiên cứu hỗ trợ)
- **Mục đích**: Lưu trữ các tài liệu nghiên cứu đề tài, kế hoạch thi đấu, hướng dẫn giảng viên & sinh viên, dữ liệu thực nghiệm (dataset), báo cáo đánh giá sai số (MAE/bias), mã nguồn baseline Python (`uigrade_baseline.py`) và mã nguồn tham khảo từ bài báo (`source_code/from_paper_tu/`).
- **Lưu ý quan trọng**: Thư mục này **không phải là source code website chạy thật**. Các tài nguyên trong thư mục này được sử dụng cho công tác nghiên cứu, đào tạo mô hình, kiểm chứng thuật toán và tài liệu học thuật.
- **Cấu trúc**:
  - `data/`: Dữ liệu bài tập mẫu, điểm số thực nghiệm (`student_practice_grades.jsonl`).
  - `docs/`: Hướng dẫn chi tiết, chuẩn bị dữ liệu mô hình, kết quả dự án nền, kế hoạch dự thi.
  - `models/`: Hướng dẫn tải và tích hợp mô hình AI/GGUF phục vụ nghiên cứu.
  - `reports/`: Báo cáo phân tích độ lệch và tính toán định lượng.
  - `source_code/from_paper_tu/`: Mã nguồn tham khảo từ bài báo khoa học.
  - `src/`: Script baseline Python phục vụ đánh giá thuật toán.
  - `tests/`: Bộ test Python cho baseline grading.
  - `CHANGELOG.md`, `LICENSE`, `NOTICE.md`, `README.md`: Lịch sử cập nhật và giấy phép pháp lý của bộ tài liệu nghiên cứu.

---

## 🛡️ Bảo mật và Quản lý Secret

- Toàn bộ secret thực tế (`.env.local`, API keys, Database credentials) **tuyệt đối không được commit** vào Git.
- Tệp mẫu `web/site/.env.example` chỉ chứa tên biến và placeholder an toàn để người phát triển dễ dàng thiết lập môi trường mới.
- Vùng lưu trữ runtime `web/site/public/uploads/` được cấu hình `.gitignore` để ngăn chặn các tệp bài nộp `.java`, `.zip` của người dùng bị đưa lên kho lưu trữ mã nguồn.
