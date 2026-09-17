# Thông Cáo Cấu Phần Bên Thứ Ba (Third-Party Notices & Attributions)

> **Tài liệu minh bạch hóa các thư viện, framework, dịch vụ đám mây và tài nguyên bên thứ ba sử dụng trong UIGrade AI**
>
> *Tham gia Cuộc thi "Phát triển phần mềm mã nguồn mở tích hợp AI 2026"*

---

## 1. Tuyên Bố Bản Quyền & Phạm Vi Áp Dụng

Mã nguồn nguyên bản do nhóm phát triển UIGrade AI sáng tạo được phát hành theo giấy phép **MIT License** (được lưu tại [../LICENSE](../LICENSE)). Giấy phép này **không áp dụng** cho các thành phần, thư viện, dịch vụ và tài nguyên bên thứ ba được liệt kê dưới đây.

Toàn bộ các cấu phần bên thứ ba đều được lựa chọn với các giấy phép nguồn mở tương thích hoàn toàn với MIT (chủ yếu là MIT, Apache-2.0, ISC, BSD-3-Clause, và SIL OFL 1.1).

---

## 2. Danh Mục Phân Loại Thành Phần Bên Thứ Ba

### 2.1. Framework (Khung Ứng Dụng)

| Tên thành phần | Phiên bản thực tế | Giấy phép | Nguồn gốc / Kho lưu trữ | Mục đích sử dụng |
|---|---|---|---|---|
| **Next.js** | `16.2.2` | MIT | [vercel/next.js](https://github.com/vercel/next.js) | Full-stack React framework (App Router, Server Components, API Routes) |
| **React** | `19.2.3` | MIT | [facebook/react](https://github.com/facebook/react) | Thư viện xây dựng giao diện người dùng tương tác |
| **Android Jetpack Compose** | BOM `2024.12.01` | Apache-2.0 | [developer.android.com/jetpack/compose](https://developer.android.com/jetpack/compose) | Khung giao diện khai báo (Declarative UI) cho Android Companion App |

---

### 2.2. Library (Thư Viện Mã Nguồn Trực Tiếp)

#### Phía Web Application (`web/site`)

| Thư viện | Phiên bản | Giấy phép | Nguồn gốc | Mục đích sử dụng |
|---|---|---|---|---|
| **Tailwind CSS** | `^4.2.1` | MIT | [tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss) | Framework định kiểu giao diện theo tiện ích |
| **Zod** | `^3.24.2` / `^4.x` | MIT | [colinhacks/zod](https://github.com/colinhacks/zod) | Kiểm thực lược đồ dữ liệu API và đầu ra của LLM |
| **TanStack React Query** | `^5.90.21` | MIT | [TanStack/query](https://github.com/TanStack/query) | Quản lý trạng thái bất đồng bộ và bộ nhớ đệm dữ liệu |
| **TanStack React Table** | `^8.21.3` | MIT | [TanStack/table](https://github.com/TanStack/table) | Bảng dữ liệu hiển thị danh sách bài nộp và sinh viên |
| **React Hook Form** | `^7.71.2` | MIT | [react-hook-form](https://github.com/react-hook-form/react-hook-form) | Quản lý biểu mẫu nhập liệu và xử lý validation |
| **Sharp** | `^0.34.5` | Apache-2.0 | [lovell/sharp](https://github.com/lovell/sharp) | Xử lý ảnh hiệu năng cao, chuẩn hóa kích thước ảnh chụp |
| **Pixelmatch** | `^7.2.0` | ISC | [mapbox/pixelmatch](https://github.com/mapbox/pixelmatch) | So sánh sai khác từng pixel giữa ảnh bài làm và ảnh mẫu |
| **PNGjs** | `^7.0.0` | MIT | [pngjs/pngjs](https://github.com/pngjs/pngjs) | Đọc và ghi tệp ảnh PNG phục vụ so khớp giao diện |
| **Adm-zip** | `^0.5.16` | MIT | [cthackers/adm-zip](https://github.com/cthackers/adm-zip) | Giải nén an toàn tệp bài nộp `.zip` của sinh viên |
| **Recharts** | `^3.8.0` | MIT | [recharts/recharts](https://github.com/recharts/recharts) | Biểu đồ trực quan hóa dữ liệu phổ điểm và thống kê |
| **React Markdown** | `^10.1.0` | MIT | [remarkjs/react-markdown](https://github.com/remarkjs/react-markdown) | Hiển thị nhận xét và phản hồi của AI theo định dạng Markdown |
| **Nodemailer** | `^8.0.4` | MIT | [nodemailer/nodemailer](https://github.com/nodemailer/nodemailer) | Gửi email thông báo bài tập và cập nhật điểm số |
| **Axios** | `^1.13.6` | MIT | [axios/axios](https://github.com/axios/axios) | HTTP client gọi API máy chủ và dịch vụ ngoài |
| **DayJS** | `^1.11.20` | MIT | [iamkun/dayjs](https://github.com/iamkun/dayjs) | Định dạng và tính toán thời gian, hạn nộp bài |

#### Phía Android Companion App (`app/`)

| Thư viện | Phiên bản | Giấy phép | Nguồn gốc | Mục đích sử dụng |
|---|---|---|---|---|
| **Kotlin Standard Library** | `2.0.21` | Apache-2.0 | [JetBrains/kotlin](https://github.com/JetBrains/kotlin) | Ngôn ngữ phát triển ứng dụng di động chính |
| **Hilt (Dagger)** | `2.53.1` | Apache-2.0 | [google/dagger](https://github.com/google/dagger) | Tiêm phụ thuộc (Dependency Injection) |
| **Navigation Compose** | `2.8.5` | Apache-2.0 | AndroidX | Điều hướng giữa các màn hình ứng dụng |
| **Kotlinx Coroutines** | `1.9.0` | Apache-2.0 | JetBrains | Lập trình bất đồng bộ |
| **Kotlinx Serialization** | `1.7.3` | Apache-2.0 | JetBrains | Chuyển đổi dữ liệu JSON |
| **Coil Compose** | `2.7.0` | Apache-2.0 | [coil-kt/coil](https://github.com/coil-kt/coil) | Tải và hiển thị ảnh giao diện trên Android |

---

### 2.3. AI Service (Dịch Vụ Trí Tuệ Nhân Tạo)

| Dịch vụ / SDK | Nhà cung cấp | Giấy phép SDK | Mục đích sử dụng |
|---|---|---|---|
| **Google Gemini API** (`@google/genai`, `@google/generative-ai`) | Google | Apache-2.0 | Mô hình `gemini-2.5-flash` và `gemini-2.5-pro` phân tích ngữ nghĩa giao diện, gợi ý điểm theo Rubric, và phản biện Grader-Critic |
| **OpenAI Node SDK** (`openai`) | OpenAI | Apache-2.0 | Tùy chọn dự phòng mô hình AI thay thế (Optional provider) |

---

### 2.4. Cloud Infrastructure & Hosting (Hạ Tầng Đám Mây)

| Thành phần hạ tầng | Nhà cung cấp | Mục đích sử dụng |
|---|---|---|
| **Vercel Platform** | Vercel Inc. | Lưu trữ và phục vụ ứng dụng Web Next.js 16 qua Serverless Functions và Edge Network toàn cầu |
| **Supabase Cloud** | Supabase Inc. | Quản lý cơ sở dữ liệu PostgreSQL, dịch vụ Auth, và lưu trữ đối tượng Storage |

---

### 2.5. Authentication Service (Dịch Vụ Xác Thực Danh Tính)

| Thành phần | Nhà cung cấp | Giao thức | Mục đích sử dụng |
|---|---|---|---|
| **Supabase Auth** | Supabase | JWT / OAuth 2.0 PKCE | Quản lý danh tính người dùng, cấp phát token an toàn |
| **Google Identity Services** | Google | OAuth 2.0 | Đăng nhập an toàn một chạm cho sinh viên và giảng viên |

---

### 2.6. Database (Cơ Sở Dữ Liệu)

| Hệ thống | Nhà cung cấp | Giấy phép | Mục đích sử dụng |
|---|---|---|---|
| **PostgreSQL 15+** | PostgreSQL Global Development Group / Supabase | PostgreSQL License (OSI-approved) | Cơ sở dữ liệu quan hệ lưu trữ người dùng, lớp học, bài tập, rubric, bài nộp, và bảng điểm với RLS |

---

### 2.7. Storage (Lưu Trữ Đối Tượng)

| Dịch vụ | Giao thức | Mục đích sử dụng |
|---|---|---|
| **Supabase Object Storage** | S3-compatible API | Lưu trữ an toàn các tệp mã nguồn nén `.zip` của sinh viên, ảnh chụp UI baseline mẫu, và ảnh so sánh diff |

---

### 2.8. Icons, Assets & Fonts (Phông Chữ & Biểu Tượng)

| Tài nguyên | Tác giả / Nguồn | Giấy phép | Mục đích sử dụng |
|---|---|---|---|
| **Inter Font Family** | Rasmus Andersson | SIL Open Font License 1.1 (OFL-1.1) | Phông chữ chính của giao diện Web (giấy phép tại `licenses/OFL-Inter.txt`) |
| **Lucide Icons** (`lucide-react`) | Lucide Contributors | ISC | Bộ biểu tượng giao diện người dùng |
| **Material Symbols** | Google | Apache-2.0 | Biểu tượng icon bổ trợ cho giao diện |

---

## 3. Xác Minh Tính Tương Thích Giấy Phép (License Compatibility)

Toàn bộ các giấy phép thành phần bên thứ ba nêu trên (MIT, Apache-2.0, ISC, BSD-3-Clause, PostgreSQL License, SIL OFL 1.1) đều là các giấy phép bản quyền tự do (Permissive Licenses) được **Tổ chức Sáng kiến Mã nguồn Mở (OSI)** phê duyệt, hoàn toàn tương thích với giấy phép **MIT License** của kho dự án UIGrade AI.
