# UIGrade AI

**Intelligent Android UI Assignment Grading Platform — Monorepo**

---

## Thành phần dự án

- **Android App**: `/` (gốc repository) — Ứng dụng Android Native viết bằng Kotlin & Jetpack Compose.
- **Web App**: `/web/site` — Nền tảng Web quản lý lớp học, nộp bài, chấm điểm và báo cáo viết bằng Next.js 16 (App Router), React 19, TypeScript và Supabase.
- **Tài liệu và dữ liệu nghiên cứu**: `/web/project-files` — Dữ liệu thực nghiệm, tài liệu đề tài, báo cáo khoa học và mã nguồn baseline Python hỗ trợ.

---

## Cấu trúc Repository (Monorepo)

```
UIGrade AI/
│
├── app/                         # Android application module (Jetpack Compose, Hilt, Clean Architecture)
├── gradle/                      # Gradle wrapper & version catalogs
├── gradlew                      # Gradle wrapper Unix script
├── gradlew.bat                  # Gradle wrapper Windows batch script
├── build.gradle.kts             # Root Gradle build script
├── settings.gradle.kts          # Gradle project settings
├── gradle.properties            # Gradle JVM & build properties
│
├── web/
│   ├── site/                    # Website Next.js chính
│   │   ├── app/                 # Next.js App Router (UI pages & API Route Handlers)
│   │   ├── components/          # React UI Components (Ocean Blue Design System)
│   │   ├── controllers/         # Web business controllers
│   │   ├── lib/                 # Core utilities, Supabase client, Auth, Constants
│   │   ├── models/              # TypeScript & Data models
│   │   ├── public/              # Static assets & public uploads placeholder
│   │   ├── repositories/        # Data access layer
│   │   ├── scripts/             # Database seed & migration helpers
│   │   ├── services/            # Core grading, Gemini AI, runner & Supabase services
│   │   ├── supabase/            # SQL Migrations, RLS policies, Storage setup & seed data
│   │   ├── tests/               # Vitest unit & integration tests
│   │   ├── types/               # TypeScript type definitions
│   │   ├── validations/         # Zod schemas for input validation
│   │   ├── package.json         # Web dependencies & scripts
│   │   ├── package-lock.json    # Exact dependency lockfile
│   │   ├── next.config.ts       # Next.js configuration
│   │   ├── tsconfig.json        # TypeScript compiler options
│   │   ├── README.md            # Tài liệu chi tiết cho Web App
│   │   └── .env.example         # Mẫu biến môi trường an toàn (không chứa secret)
│   │
│   ├── project-files/           # Tài liệu, dữ liệu và source nghiên cứu hỗ trợ
│   │   ├── data/                # Dataset chấm điểm thực nghiệm
│   │   ├── docs/                # Báo cáo, tài liệu hướng dẫn & kế hoạch
│   │   ├── models/              # Model AI & baseline references
│   │   ├── reports/             # Báo cáo đánh giá MAE/bias
│   │   ├── source_code/
│   │   │   └── from_paper_tu/   # Mã nguồn tham khảo từ bài báo khoa học
│   │   ├── src/                 # Python baseline grading script
│   │   ├── tests/               # Python baseline tests
│   │   ├── README.md            # Tài liệu bộ nền nghiên cứu
│   │   ├── CHANGELOG.md         # Lịch sử thay đổi tài liệu & baseline
│   │   ├── LICENSE              # Giấy phép MIT cho mã nguồn mới
│   │   └── NOTICE.md            # Ghi nhận bản quyền bên thứ ba
│   │
│   └── README.md                # Tài liệu tổng quan phân vùng Web
│
├── README.md                    # Tài liệu chính của Monorepo
├── LICENSE                      # MIT License
└── .gitignore                   # Monorepo Git ignore rules (Android, Next.js, Secrets)
```

---

## Yêu cầu môi trường

- **Java Development Kit (JDK)**: JDK 17 (theo cấu hình Gradle Android).
- **Android Studio**: Android Studio Ladybug hoặc mới hơn (Android SDK 35, Build Tools, Platform Tools).
- **Node.js**: Phiên bản `>= 20.0.0` (Node.js 20+ / 24+).
- **Package Manager**: `npm` (hoặc `pnpm` / `yarn`).
- **Database & Backend**: Supabase (PostgreSQL với Row Level Security, Auth, Storage) hoặc MongoDB (fallback/legacy).
- **AI Services**: Google Gemini API key (tùy chọn cho phân tích thị giác & tạo feedback).

---

## Cấu hình Biến Môi Trường (Web)

Trước khi chạy hoặc build Web, tạo tệp môi trường cục bộ:

```bash
cd web/site
copy .env.example .env.local
```

Điền các thông tin cấu hình vào `web/site/.env.local` (tệp này được `.gitignore` bảo vệ tuyệt đối, không bao giờ được commit lên Git):
- `NEXT_PUBLIC_APP_URL`: URL chạy ứng dụng (mặc định `http://localhost:3000`).
- `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Thông tin kết nối Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key cho tác vụ quản trị Supabase.
- `JWT_SECRET`: Khóa bí mật ký JWT token (tối thiểu 32 ký tự).
- `GEMINI_API_KEY`: API Key cho dịch vụ Google Gemini AI.

---

## Chạy & Build Dự Án

### 1. Android App

Thực hiện tại thư mục gốc repository (`C:\vibecoding\UIGrade AI`):

```bash
# Build Debug APK
.\gradlew.bat assembleDebug

# Cài đặt lên thiết bị / giả lập đang kết nối
.\gradlew.bat installDebug
```

### 2. Next.js Web App

Thực hiện trong thư mục `web/site`:

```bash
cd web/site

# Cài đặt chính xác các gói phụ thuộc
npm ci

# Khởi chạy máy chủ phát triển (Development Server)
npm run dev

# Đóng gói phiên bản phát hành (Production Build)
npm run build

# Khởi chạy phiên bản phát hành
npm start
```

---

## Chạy Kiểm Thử (Testing & Linting)

### 1. Web App (`web/site`)

```bash
cd web/site

# Chạy Unit & Integration Tests (Vitest)
npm test

# Chạy kiểm tra quy chuẩn mã nguồn (ESLint 9)
npm run lint

# Kiểm tra biên dịch TypeScript
npx tsc --noEmit
```

### 2. Android App (Root)

```bash
# Chạy Unit Tests
.\gradlew.bat testDebugUnitTest

# Chạy Android Lint kiểm tra chất lượng mã nguồn
.\gradlew.bat lintDebug

# Build bộ test APK cho Compose UI
.\gradlew.bat assembleDebugAndroidTest
```

---

## Product Overview


UIGrade AI is an educational platform for grading Android UI assignments using **deterministic metrics and rules**, with AI-generated textual feedback.

### Core Principle

> **AI does NOT determine scores.**
>
> Scores are calculated by deterministic metrics and rules.
> AI is only used to write feedback, explain issues, and suggest improvements
> based on the already-computed grading result.

Grading pipeline:

```
UI Submission
     ↓
Metric Extraction  (Python Baseline / Mock Engine)
     ↓
Rule Evaluation    (deterministic thresholds)
     ↓
Score Calculation  (weight × pass/fail)
     ↓
Grading Result     (totalScore, criteriaScores, metrics, rules)
     ↓
AI Feedback        (text only — summary, strengths, problems, recommendations)
```

---

## Architecture

```
Android App (Kotlin + Jetpack Compose)
     ↓
Domain Layer (use cases, repository interfaces)
     ↓
Data Layer (mock repositories / real API repositories)
     ↓
Backend REST API
     ↓
Python Baseline Grading Engine
     ↓
AI Feedback Service (text generation only)
```

Package structure:

```
app/src/main/java/com/uigrade/ai/
├── data/
│   ├── mock/          MockData.kt + MockDataStore.kt (shared in-memory state)
│   └── repository/    Mock implementations of domain interfaces
│
├── domain/
│   ├── model/         Pure Kotlin data classes
│   ├── repository/    Interfaces (AuthRepository, GradingRepository, etc.)
│   └── usecase/       Single-responsibility use cases
│
├── presentation/
│   ├── navigation/    NavGraph.kt, Screen.kt
│   ├── auth/          LoginScreen, SplashScreen, LoginViewModel
│   ├── student/       Dashboard, Assignments, Submit, GradingResult
│   ├── lecturer/      Dashboard, Assignments, Rubrics, Submissions, Statistics
│   └── admin/         Dashboard, Users, Rules, Metrics, Rubrics, Logs
│
├── ui/
│   ├── components/    MetricCard, RuleCard, AIFeedbackCard, StatusBadge, etc.
│   └── theme/         Color, Type, Shape, Theme (Material 3)
│
├── di/                AppModule.kt (Hilt bindings)
├── MainActivity.kt
└── UIGradeApplication.kt
```

---

## Android Setup

**Requirements:**
- Android Studio Ladybug or later
- JDK 17
- Android SDK 35

**Dependencies (key):**
- Kotlin 2.0.21
- AGP 8.7.3
- Compose BOM 2024.12.01
- Material 3
- Hilt 2.53.1
- Navigation Compose 2.8.5

---

## Build & Run

```bash
# Clone the project
git clone https://github.com/truong256/UIGrade-AI.git
cd UIGrade-AI

# Open in Android Studio and sync Gradle
# Run on emulator or device (API 26+)
```

Or via command line:

```bash
./gradlew assembleDebug
./gradlew installDebug
```

---

## Demo Accounts

| Email | Password | Role |
|---|---|---|
| `student@uigrade.ai` | `password123` | Student |
| `lecturer@uigrade.ai` | `password123` | Lecturer |
| `admin@uigrade.ai` | `password123` | Admin |

Additional students: `binh.tran@uigrade.ai`, `cuong.le@uigrade.ai`, `dung.pham@uigrade.ai`, `em.hoang@uigrade.ai`

---

## API Contract

The Android app is designed to work with a Python Baseline backend. The JSON contract:

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

In MVP, `MockData.kt` provides all data in this structure.

---

## Grading Engine

The mock grading engine in `MockData.kt` demonstrates the full pipeline:

1. **Metrics** — measured values from submitted UI (e.g. `font_size_body = 14sp`)
2. **Rules** — deterministic thresholds (e.g. `body text >= 16sp`)
3. **Score** — computed from rules: `earnedScore = maxScore - penalty if fail`
4. **Total** — sum of all criterion scores

**Example:**
```
Metric: body_text_size = 14sp
Rule:   >= 16sp → FAIL
Score:  10 (max) - 4 (penalty) = 6 earned
```

Score is never set by AI.

---

## Rubric

Each rubric contains weighted criteria:

| Criterion | Weight | Max Score |
|---|---|---|
| Layout | 25% | 25 |
| Typography | 20% | 20 |
| Color | 20% | 20 |
| Spacing | 20% | 20 |
| Accessibility | 15% | 15 |

Each criterion has rules with:
- `ruleId` — unique identifier
- `description` — human-readable
- `metricId` — which metric it evaluates
- `threshold` — the passing condition
- `weight`, `maxScore`, `penalty`
- `scoreFormula` — transparent calculation

---

## AI Feedback

The `FeedbackRepository` interface accepts a completed `GradingResult` and returns a `Feedback` object:

```kotlin
interface FeedbackRepository {
    suspend fun generateFeedback(gradingResult: GradingResult): Feedback
}

data class Feedback(
    val id: String,
    val gradingResultId: String,
    val summary: String,           // Text only
    val strengths: List<String>,   // Text only
    val problems: List<FeedbackProblem>, // Text only
    val recommendations: List<String>,   // Text only
    val generatedAt: String,
    val modelVersion: String
    // NO score, weight, threshold, or metric result fields
)
```

The UI always displays: *"AI generated feedback · Score was calculated by deterministic rules"*

---

## Testing

```bash
# Unit tests
./gradlew test

# Build the Compose UI-test APK (no emulator required)
./gradlew assembleDebugAndroidTest

# Execute instrumentation tests (requires emulator/device)
./gradlew connectedAndroidTest
```

Key test: `GradingEngineTest.kt` verifies:
- Total score = sum of criterion scores (not AI-set)
- Failing metrics reduce rule scores by exact penalty
- Passing metrics earn full rule score
- Feedback object has no score-modifying fields
- Data integrity of mock dataset

`MockRepositoryTest.kt` verifies authentication, shared submission state,
deterministic result creation, rubric/user mutations, and dashboard statistics.

`CriticalFlowsTest.kt` contains seven Compose integration tests covering Student,
Lecturer, and Admin navigation. These tests compile in CI; executing them still
requires an Android emulator or device.

---

## Current Limitations

- All data is stored in memory and resets when the application process restarts.
- Authentication uses the documented demo accounts; no Firebase/JWT backend is connected.
- Submission analysis and AI feedback are deterministic mock simulations for the demo flow.
- The Compose UI tests require an emulator/device for runtime execution.

---

## Future Development

- [ ] Connect Python Baseline grading engine via REST API
- [ ] Replace `MockAuthRepository` with Firebase/JWT
- [ ] Implement APK analysis via instrumentation runner
- [ ] Build Next.js web demo using same API contract
- [ ] Add room persistence for offline support
- [ ] Implement real AI feedback via Gemini/GPT API
- [ ] Screenshot testing for UI regression
- [ ] Multi-language support (Vietnamese/English)

---

## License

MIT — UIGrade AI MVP
