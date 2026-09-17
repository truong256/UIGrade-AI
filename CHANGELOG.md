# Changelog

All notable changes to UIGrade AI will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- SPDX license headers on primary source files

---

## [1.0.0] - 2026-09-17

### Highlights

First production-ready competition release. Web platform is fully operational
with Supabase backend, Google OAuth, three-role workflow (Student / Lecturer /
Admin), AI-assisted grading feedback, and automated test suite.

### Added

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

[Unreleased]: https://github.com/truong256/UIGrade-AI/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/truong256/UIGrade-AI/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/truong256/UIGrade-AI/releases/tag/v0.1.0
