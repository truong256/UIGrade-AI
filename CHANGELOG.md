# Changelog

All notable changes to UIGrade AI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

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

[Unreleased]: https://github.com/truong256/UIGrade-AI/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/truong256/UIGrade-AI/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/truong256/UIGrade-AI/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/truong256/UIGrade-AI/releases/tag/v0.1.0
