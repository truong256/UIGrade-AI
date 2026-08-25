# UIGrade AI

**Intelligent Android UI Assignment Grading Platform**

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
│   ├── mock/          MockData.kt (demo dataset)
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
- Android Studio Hedgehog or later
- JDK 11+
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
git clone <repo-url>
cd UIGrade AI

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

# Instrumentation tests (requires emulator/device)
./gradlew connectedAndroidTest
```

Key test: `GradingEngineTest.kt` verifies:
- Total score = sum of criterion scores (not AI-set)
- Failing metrics reduce rule scores by exact penalty
- Passing metrics earn full rule score
- Feedback object has no score-modifying fields
- Data integrity of mock dataset

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
