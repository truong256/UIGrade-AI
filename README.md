# UIGrade AI

**Nền tảng chấm điểm bài tập giao diện Android thông minh**

---

## Tổng quan sản phẩm

UIGrade AI là nền tảng giáo dục hỗ trợ chấm điểm bài tập giao diện Android bằng **các chỉ số và quy tắc xác định**, kết hợp với phản hồi bằng văn bản do AI tạo ra.

### Nguyên tắc cốt lõi

> **AI không quyết định điểm số.**
>
> Điểm số được tính bằng các chỉ số và quy tắc xác định. AI chỉ viết phản hồi, giải thích vấn đề và đề xuất cách cải thiện dựa trên kết quả chấm đã được tính toán.

Quy trình chấm điểm:

```text
Bài nộp giao diện
     ↓
Trích xuất chỉ số       (Python Baseline / Mock Engine)
     ↓
Đánh giá quy tắc        (ngưỡng xác định)
     ↓
Tính điểm               (trọng số × đạt/không đạt)
     ↓
Kết quả chấm            (tổng điểm, điểm tiêu chí, chỉ số, quy tắc)
     ↓
Phản hồi AI             (chỉ gồm văn bản: tổng kết, ưu điểm, vấn đề, đề xuất)
```

---

## Kiến trúc

```text
Ứng dụng Android (Kotlin + Jetpack Compose)
     ↓
Tầng Domain (use case, repository interface)
     ↓
Tầng Data (mock repository / API repository)
     ↓
REST API phía máy chủ
     ↓
Python Baseline Grading Engine
     ↓
Dịch vụ phản hồi AI (chỉ sinh văn bản)
```

Cấu trúc package:

```text
app/src/main/java/com/uigrade/ai/
├── data/
│   ├── mock/          MockData.kt + MockDataStore.kt (trạng thái in-memory dùng chung)
│   └── repository/    Các bản cài đặt mock của domain interface
│
├── domain/
│   ├── model/         Các data class Kotlin thuần
│   ├── repository/    Interface (AuthRepository, GradingRepository, v.v.)
│   └── usecase/       Các use case đơn nhiệm
│
├── presentation/
│   ├── navigation/    NavGraph.kt, Screen.kt
│   ├── auth/          LoginScreen, SplashScreen, LoginViewModel
│   ├── student/       Dashboard, bài tập, nộp bài, kết quả chấm
│   ├── lecturer/      Dashboard, bài tập, rubric, bài nộp, thống kê
│   └── admin/         Dashboard, người dùng, quy tắc, chỉ số, rubric, nhật ký
│
├── ui/
│   ├── components/    MetricCard, RuleCard, AIFeedbackCard, StatusBadge, v.v.
│   └── theme/         Color, Type, Shape, Theme (Material 3)
│
├── di/                AppModule.kt (Hilt bindings)
├── MainActivity.kt
└── UIGradeApplication.kt
```

---

## Yêu cầu môi trường Android

### Yêu cầu

- Android Studio Ladybug trở lên
- JDK 17
- Android SDK 35

### Thư viện chính

- Kotlin 2.0.21
- AGP 8.7.3
- Compose BOM 2024.12.01
- Material 3
- Hilt 2.53.1
- Navigation Compose 2.8.5

---

## Cài đặt và chạy dự án

```bash
# Sao chép dự án
git clone https://github.com/truong256/UIGrade-AI.git
cd UIGrade-AI

# Mở dự án bằng Android Studio và đồng bộ Gradle
# Chạy trên máy ảo hoặc thiết bị Android (API 26+)
```

Hoặc sử dụng dòng lệnh:

```bash
./gradlew assembleDebug
./gradlew installDebug
```

---

## Tài khoản demo

| Email | Mật khẩu | Vai trò |
|---|---|---|
| `student@uigrade.ai` | `password123` | Sinh viên |
| `lecturer@uigrade.ai` | `password123` | Giảng viên |
| `admin@uigrade.ai` | `password123` | Quản trị viên |

Các tài khoản sinh viên bổ sung: `binh.tran@uigrade.ai`, `cuong.le@uigrade.ai`, `dung.pham@uigrade.ai`, `em.hoang@uigrade.ai`.

---

## Hợp đồng API

Ứng dụng Android được thiết kế để làm việc với Python Baseline backend. Dữ liệu JSON tuân theo cấu trúc sau:

```json
{
  "assignmentId": "UI-001",
  "totalScore": 82,
  "maxScore": 100,
  "engineVersion": "1.0.0",
  "criteria": [
    {
      "id": "typography",
      "name": "Typography",
      "score": 16,
      "maxScore": 20,
      "metrics": [
        {
          "id": "font_size_body",
          "name": "Body Text Size",
          "actual": "14sp",
          "expected": ">=16sp",
          "unit": "sp",
          "status": "FAIL"
        }
      ],
      "rules": [
        {
          "id": "RULE_FONT_BODY_001",
          "description": "Body text size must be at least 16sp",
          "threshold": ">=16sp",
          "result": "FAIL",
          "earnedScore": 6,
          "maxScore": 10,
          "penalty": 4
        }
      ]
    }
  ]
}
```

Trong phiên bản MVP, `MockData.kt` cung cấp toàn bộ dữ liệu theo cấu trúc này.

---

## Bộ máy chấm điểm

Bộ máy chấm mock trong `MockData.kt` mô phỏng đầy đủ quy trình:

1. **Chỉ số (Metrics)** — giá trị đo được từ giao diện đã nộp, ví dụ `font_size_body = 14sp`.
2. **Quy tắc (Rules)** — ngưỡng đánh giá xác định, ví dụ `body text >= 16sp`.
3. **Điểm số (Score)** — được tính từ quy tắc: `earnedScore = maxScore - penalty` nếu không đạt.
4. **Tổng điểm (Total)** — tổng điểm của tất cả tiêu chí.

Ví dụ:

```text
Chỉ số:  body_text_size = 14sp
Quy tắc: >= 16sp → FAIL
Điểm:    10 (tối đa) - 4 (điểm trừ) = 6
```

Điểm số không bao giờ do AI thiết lập.

---

## Rubric chấm điểm

Mỗi rubric chứa các tiêu chí có trọng số:

| Tiêu chí | Trọng số | Điểm tối đa |
|---|---:|---:|
| Bố cục | 25% | 25 |
| Kiểu chữ | 20% | 20 |
| Màu sắc | 20% | 20 |
| Khoảng cách | 20% | 20 |
| Khả năng tiếp cận | 15% | 15 |

Mỗi tiêu chí gồm các quy tắc với:

- `ruleId` — mã định danh duy nhất.
- `description` — mô tả dễ hiểu.
- `metricId` — chỉ số được đánh giá.
- `threshold` — điều kiện để đạt.
- `weight`, `maxScore`, `penalty` — trọng số, điểm tối đa và điểm trừ.
- `scoreFormula` — công thức tính điểm minh bạch.

---

## Phản hồi AI

Interface `FeedbackRepository` nhận một `GradingResult` đã hoàn thành và trả về đối tượng `Feedback`:

```kotlin
interface FeedbackRepository {
    suspend fun generateFeedback(gradingResult: GradingResult): Feedback
}

data class Feedback(
    val id: String,
    val gradingResultId: String,
    val summary: String,                  // Chỉ chứa văn bản
    val strengths: List<String>,          // Chỉ chứa văn bản
    val problems: List<FeedbackProblem>,  // Chỉ chứa văn bản
    val recommendations: List<String>,    // Chỉ chứa văn bản
    val generatedAt: String,
    val modelVersion: String
    // Không có trường điểm, trọng số, ngưỡng hoặc kết quả chỉ số
)
```

Giao diện luôn hiển thị thông báo: *“Phản hồi do AI tạo · Điểm số được tính bằng các quy tắc xác định.”*

---

## Kiểm thử

```bash
# Chạy unit test
./gradlew test

# Biên dịch APK kiểm thử Compose (không cần máy ảo)
./gradlew assembleDebugAndroidTest

# Chạy instrumentation test (cần máy ảo hoặc thiết bị)
./gradlew connectedAndroidTest
```

`GradingEngineTest.kt` kiểm tra:

- Tổng điểm bằng tổng điểm các tiêu chí và không do AI thiết lập.
- Chỉ số không đạt làm giảm điểm đúng theo mức phạt.
- Chỉ số đạt nhận đầy đủ điểm của quy tắc.
- Đối tượng phản hồi không chứa trường có thể thay đổi điểm.
- Tính toàn vẹn của bộ dữ liệu mock.

`MockRepositoryTest.kt` kiểm tra đăng nhập, trạng thái bài nộp dùng chung, quá trình tạo kết quả xác định, thao tác với rubric/người dùng và số liệu dashboard.

`CriticalFlowsTest.kt` gồm bảy bài kiểm thử tích hợp Compose cho các luồng Sinh viên, Giảng viên và Quản trị viên. Các bài kiểm thử này được biên dịch trong CI; việc chạy trực tiếp vẫn cần máy ảo hoặc thiết bị Android.

---

## Giới hạn hiện tại

- Toàn bộ dữ liệu được lưu trong bộ nhớ và sẽ đặt lại khi tiến trình ứng dụng khởi động lại.
- Xác thực sử dụng các tài khoản demo; chưa kết nối Firebase hoặc JWT backend.
- Phân tích bài nộp và phản hồi AI hiện là mô phỏng xác định phục vụ luồng demo.
- Compose UI tests cần máy ảo hoặc thiết bị để chạy trực tiếp.

---

## Kế hoạch phát triển

- [ ] Kết nối Python Baseline grading engine qua REST API.
- [ ] Thay `MockAuthRepository` bằng Firebase/JWT.
- [ ] Phân tích APK qua instrumentation runner.
- [ ] Xây dựng web demo Next.js dùng chung hợp đồng API.
- [ ] Thêm Room để lưu dữ liệu ngoại tuyến.
- [ ] Tích hợp phản hồi AI thực tế qua Gemini/GPT API.
- [ ] Thêm screenshot testing để phát hiện hồi quy giao diện.
- [ ] Hỗ trợ đa ngôn ngữ Việt/Anh.

---

## Giấy phép

MIT — UIGrade AI MVP
