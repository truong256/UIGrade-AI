# Changelog

All notable changes to UIGrade AI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [1.0.4] - 2026-09-17

### Fixed
- **Persisted class join requests**: Preserved the membership lookup result inside `join_class_by_code(TEXT)` so a first-time student join inserts a real `class_members` row with `status = 'pending'` instead of returning a false-positive success after a zero-row update.
- **Join response validation**: The API and student dialog now report success only when the RPC response explicitly confirms `membershipStatus = 'pending'`; malformed or contradictory 2xx responses remain visible as errors.
- **Regression coverage**: Added tests for the PL/pgSQL `FOUND` overwrite regression and for false-positive join responses in the API and UI.
- **AI rubric score parsing**: Numbers inside criterion descriptions are no longer interpreted as scores; only explicit score expressions and validated structured `points` fields are accepted.
- **Rubric total metadata**: `Total`, `Total points`, `Tổng`, and `Tổng điểm` lines are excluded from criteria.
- **Strict AI rubric validation**: Structured AI criteria now require positive, finite `points` values.
- **Explicit score precedence**: Scores written explicitly in the original rubric take precedence over misleading numbers in AI-generated descriptions.
- **Conditional normalization**: Rubrics whose criteria already sum to the assignment maximum retain their original points.
- **Fallback provenance**: AI failures now report `source: "fallback"` and mark fallback criteria with `gradingSource: "manual"`.

---

## [1.0.3] - 2026-09-17

### Added
- **Lecturer Approval Workflow for Class Joining**:
  - Refactored student class joining mechanism from immediate activation to a multi-stage approval workflow.
  - Students entering a valid join code receive `status = 'pending'` membership.
  - Lecturers view pending student requests in the class's "Yêu cầu chờ duyệt" (Waiting List) with student details (name, email, student code).
  - Lecturers can approve (`status = 'active'`) or reject (`status = 'dropped'`) student requests.
- **Supabase Migration (`20260917000002_lecturer_approval_join_workflow.sql`)**:
  - Updated `public.join_class_by_code(TEXT)` RPC to set `status = 'pending'` and enforce 50-student capacity limit.
  - Updated RLS on `class_members` to allow students to read their own membership status.
  - Updated RLS on `classes` to allow students with pending status to view basic class metadata.
  - Maintained strict RLS on `assignments` and `submissions` so pending students are blocked at database level.
- **Comprehensive Test Suite**:
  - Added `tests/lecturer-approval-workflow.test.ts` covering all 9 required verification scenarios including valid join $\rightarrow$ pending, lecturer approval/rejection, RLS assignment lockout, non-owning lecturer 403, duplicate join protection, and capacity 50 limits.

### Fixed
- **Duplicate Join Prevention**: Provided clear, distinct Vietnamese feedback for already active (`Bạn đã tham gia lớp học này.`) and pending (`Yêu cầu tham gia lớp đang chờ giảng viên duyệt.`) memberships.
- **Capacity Limits**: Hardened 50 active students limit during both join request submission and lecturer approval action.
- **Access Control & Anti-Tamper**: Enforced ownership check ensuring only the class teacher can approve/reject, and students cannot self-upgrade from pending to active.
- **Student UI Presentation**: Added amber "Đang chờ giảng viên phê duyệt" badge on class cards and informative dialog notice for pending classes.

---

## [1.0.2] - 2026-09-17

### Fixed
- **Username Registration Validation**: Enforced Unicode letter requirement (\p{L}), rejection of numeric-only or whitespace-only inputs, and 2-100 character bounds across client and server auth endpoints.
- **Search Bar Domain Scoping**: Removed navigation, sidebar, and routing elements from global search, returning only domain entities (Classrooms, Assignments, and Enrolled Students).
- **Class Creation & Refresh**: Resolved semester filter misalignment where "Tất cả" mapped to empty string instead of "all", added optimistic UI insertion and query reset upon creation.
- **Academic Year & Date Validation**: Standardized academic year format (YYYY-YYYY), strictly enforced endYear = startYear + 1 with dynamic sliding current-year limits and startDate < dueDate checks.
- **Assignment Creation Error Presentation**: Replaced top-only error banners with prominent Error Summary cards directly inside the "Tóm tắt" submit section alongside clear inline field error messages.
- **Gemini Request Resilience**: Added configurable timeouts with AbortController, structured Vietnamese classification for rate limits (429), auth failures (401/403), network timeouts, and graceful fallbacks.
- **AI JSON Robust Parsing**: Implemented markdown code fence stripping, conversational preamble trimming, balanced bracket extraction, and strict Zod schema validation without unsafe type assertions.
- **Request & Query Performance**: Removed sequential N+1 query waterfall in submissionDtos by leveraging Supabase foreign key join (classes:class_id(id,name,class_code)), significantly decreasing page load times.
- **Student Class Join Workflow**: Upgraded join_class_by_code database RPC to immediately grant active membership (fixing RLS lockout), enforce strict 50-student capacity limit, and return exact user-friendly Vietnamese messages.
- **Admin User Visibility & Latency**: Replaced full-table auth.admin.listUsers({ perPage: 1000 }) with per-page parallel lookup in attachLastSignIn, and added a manual "Làm mới" action button on the Admin dashboard.

### Improved
- Standardized API error response envelopes across all modified routes ({ success: false, error: { code, message } }).
- Protected against double submit and duplicate operations across critical forms.
- Maintained strict RLS enforcement with zero service-role leaks to client boundaries.

---

## [1.0.1] - 2026-09-17

### Highlights

Competition Readiness Update for "Phát triển phần mềm mã nguồn mở tích hợp AI 2026".
Achieved 100% SPDX license header coverage across all 461 original source files, enabled and configured
GitHub Discussions and repository discovery metadata, added formal competition compliance documentation,
and verified full green status on Web CI and Android CI test suites.

### Added
- Complete SPDX-License-Identifier coverage across all original source files (461 total owned files across Android and Web)
- Competition compliance scorecard documentation (`docs/COMPETITION_COMPLIANCE.md`) detailing PoF 50/50 criteria
- Repository metadata configuration with domain discovery topics and project summary
- Enabled GitHub Discussions for community engagement
- Live demo access guide and verification in `README.md`

### Fixed
- Fixed assignment deadline in Android mock data to remain active during competition evaluation
- Resolved broken discussions link in `.github/ISSUE_TEMPLATE/config.yml` by enabling Discussions on repository
- Verified clean passage of all 64 Android unit tests, Android lint, and Compose UI test compilation

---

## [1.0.0] - 2026-09-17

### Highlights

First production-ready competition release for "Phát triển phần mềm mã nguồn mở tích hợp AI 2026".
Web platform is fully operational with Supabase backend, Google OAuth 2.0, three-role workflow
(Student / Lecturer / Admin), Multimodal AI Grader-Critic grading feedback (Gemini 2.5), deterministic
Runner engine, comprehensive architectural documentation, and automated test suite.

### Added

#### Documentation & Community Standards
- System architecture overview (`docs/ARCHITECTURE.md`)
- Multimodal AI integration architecture (`docs/AI_ARCHITECTURE.md`)
- Root OSI-approved MIT License (`LICENSE`)
- Third-party component notices and licenses (`NOTICE.md`)
- Community contribution guidelines (`CONTRIBUTING.md`)
- Contributor Covenant Code of Conduct (`CODE_OF_CONDUCT.md`)
- Security policy and vulnerability disclosure process (`SECURITY.md`)
- GitHub issue templates for bug reports and feature requests
- SPDX-License-Identifier headers on 52 primary TypeScript source files

#### Web Platform — Authentication & Authorization
- Supabase-backed authentication with email/password and Google OAuth 2.0
- `.edu.vn` email restriction — only verified educational accounts may register
- Role-based access control: Student, Lecturer, Admin
- Role selection onboarding after first login
- Row-Level Security (RLS) enforced at database level
- JWT session management via Supabase SSR cookies
- `VisitBoundary` middleware for route protection

#### Web Platform — Student Workflow
- Student dashboard with class overview and assignment list
- Class join workflow (invite code / search)
- Assignment submission: file upload (APK/ZIP), GitHub URL, draft/submit modes
- Submission attempt limits and resubmission history
- Grading results viewer with criterion breakdown
- Personal account management and profile settings

#### Web Platform — Lecturer Workflow
- Lecturer dashboard with class statistics
- Class creation and student management (invite, approve, remove)
- Assignment creation with Rubric editor and deadline management
- Submission review panel with grading detail view
- AI-suggested scoring and manual score override
- Grade publishing with student notification

#### Web Platform — Admin Workflow
- Admin dashboard with user management
- Role assignment and user account status control
- Server configuration panel (SMTP, AI settings)
- System-wide assignment and submission overview

#### Web Platform — AI Grading Integration
- Gemini AI integration for rubric parsing from uploaded PDF/text
- AI-assisted grading feedback (text only — summaries, strengths, problems, recommendations)
- AI-suggested scores presented to lecturer for review (not auto-applied)
- UI screenshot baseline upload and pixelmatch comparison engine
- Fallback handling when AI service is unavailable

#### Web Platform — Infrastructure
- Next.js 16 App Router with full TypeScript
- Supabase PostgreSQL with RLS, Migrations, Storage
- Vitest test suite: 444 tests covering auth, RBAC, security, workflows
- GitHub Actions CI: lint, typecheck, test, production build
- Vercel deployment integration
- Responsive design with Tailwind CSS v4

#### Android Application (Companion)
- Jetpack Compose UI with Material 3
- Three-role navigation: Student, Lecturer, Admin
- Deterministic grading engine (MockData)
- AI feedback display (text-only, score not set by AI)
- Hilt dependency injection, Navigation Compose
- CI: unit tests, lint, compose test compilation, debug APK build

### Changed

#### Web
- Migrated from MongoDB + custom JWT to Supabase (PostgreSQL + Auth)
- Removed legacy JWT auth and MongoDB dependencies
- Standardized Google OAuth callback to canonical origin
- Auth UI redesigned: removed decorative icon dependency on Google Fonts CDN
  (icons replaced with inline SVG; eliminates layout flicker on local dev)
- Added `@config` directive for Tailwind v4 custom token loading

### Fixed

- Google OAuth redirect loop on Vercel production (canonical origin resolution)
- Auth callback session not attached to response
- Material Symbols font latency causing layout break in local dev
- Supabase RLS policies for submission security hardening
- Submission attempt rotation and history preservation

### Security

- Supabase Row-Level Security enforced on all user-facing tables
- `save_student_submission` RPC as single write boundary (bypasses direct INSERT)
- Submission grading columns protected from direct student modification
- Profile PII scoped: students cannot read classmates' email/profile data
- Storage policies: students may only access their own submission files
- Service role key never exposed to client; all admin operations via server-side API routes

---

## [0.1.0] - 2026-08-01

### Added

- Initial Android MVP with mock data and deterministic grading engine
- Three-role navigation: Student, Lecturer, Admin
- Mock authentication (demo accounts)
- Rubric system with weighted criteria
- AI feedback interface (mock — text only)
- Web baseline research materials and Python grading scripts
- Initial GitHub Actions CI for Android

---

[Unreleased]: https://github.com/truong256/UIGrade-AI/compare/v1.0.2...HEAD
[1.0.2]: https://github.com/truong256/UIGrade-AI/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/truong256/UIGrade-AI/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/truong256/UIGrade-AI/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/truong256/UIGrade-AI/releases/tag/v0.1.0
