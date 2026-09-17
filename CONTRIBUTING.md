# Contributing to UIGrade AI

Thank you for your interest in contributing to UIGrade AI!
This document outlines how to set up the project, submit changes, and work with the codebase.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Fork and Branch](#how-to-fork-and-branch)
- [Repository Structure](#repository-structure)
- [Development Setup](#development-setup)
- [Coding Conventions](#coding-conventions)
- [Running Tests](#running-tests)
- [Submitting a Pull Request](#submitting-a-pull-request)
- [Commit Convention](#commit-convention)
- [Reporting Bugs](#reporting-bugs)
- [Security Vulnerabilities](#security-vulnerabilities)

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).
By participating you agree to uphold these standards.

---

## How to Fork and Branch

```bash
# 1. Fork the repository on GitHub, then clone your fork
git clone https://github.com/<your-username>/UIGrade-AI.git
cd UIGrade-AI

# 2. Add the upstream remote
git remote add upstream https://github.com/truong256/UIGrade-AI.git

# 3. Always create a feature branch — never commit directly to main
git checkout -b feat/your-feature-name
# or
git checkout -b fix/your-bug-name
```

---

## Repository Structure

```
UIGrade-AI/
├── app/                  # Android app (Kotlin + Jetpack Compose)
├── web/
│   └── site/             # Web platform (Next.js + Supabase)
│       ├── app/          # Next.js App Router pages and API routes
│       ├── components/   # React UI components
│       ├── services/     # Grading and AI service logic
│       ├── supabase/     # SQL migrations and RLS policies
│       └── tests/        # Vitest test suite
├── docs/                 # Architecture and AI documentation
├── licenses/             # Third-party license files
├── LICENSE               # MIT License
├── NOTICE.md             # Third-party attributions
├── CHANGELOG.md          # Version history
└── .github/              # CI workflows and issue templates
```

---

## Development Setup

### Web Platform

**Requirements:** Node.js >= 20, npm

```bash
cd web/site

# Copy and fill in environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase project URL, anon key, and Gemini API key

# Install dependencies (exact versions from lockfile)
npm ci

# Start development server
npm run dev
```

The app runs at `http://localhost:3000`.

You need a Supabase project with the migrations applied from `web/site/supabase/`.

### Android App

**Requirements:** JDK 17, Android Studio Ladybug or later, Android SDK 35

```bash
# From repository root
./gradlew assembleDebug
./gradlew installDebug   # requires connected device or emulator
```

---

## Coding Conventions

### Web (TypeScript / Next.js)

- Strict TypeScript — no `any` unless absolutely necessary
- Use `zod` for all input validation
- Server-side secrets never exposed to client components
- All database writes that touch security-sensitive rows must go through
  Supabase RLS or SECURITY DEFINER RPCs — no direct table inserts from client
- Component files: PascalCase (`MyComponent.tsx`)
- Utility files: camelCase (`myUtil.ts`)
- Keep API Route Handlers thin; business logic belongs in `services/` or `controllers/`

### Android (Kotlin)

- Follow [Kotlin coding conventions](https://kotlinlang.org/docs/coding-conventions.html)
- Clean Architecture: domain layer has no Android dependencies
- Compose UI: stateless composables preferred; state hoisted to ViewModel
- No hard-coded strings in UI — use resource files

---

## Running Tests

### Web

```bash
cd web/site

npm run lint          # ESLint
npm run type-check    # TypeScript
npm test              # Vitest
npm run build         # Production build (must pass before PR)
```

All four must pass before a PR is mergeable.

### Android

```bash
# From repository root
./gradlew testDebugUnitTest        # Unit tests
./gradlew lintDebug                # Android lint
./gradlew assembleDebugAndroidTest # Compose UI test compilation
./gradlew assembleDebug            # Debug APK
```

---

## Submitting a Pull Request

1. Ensure all tests pass locally (see above).
2. Rebase on the latest `main`:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
3. Push your branch to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```
4. Open a Pull Request against `main` on the upstream repository.
5. Fill in the PR template (description, related issue, checklist).
6. Link any related issue: `Closes #42` or `Fixes #42`.
7. Wait for CI to pass and review from a maintainer.

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

<optional body>

<optional footer: Fixes #N>
```

**Types:**

| Type | When to use |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `refactor` | Code change, no feature/fix |
| `test` | Tests only |
| `chore` | Build, CI, dependency updates |
| `ci` | CI workflow changes |
| `perf` | Performance improvement |
| `style` | Formatting, no logic change |

**Scopes:** `web`, `android`, `ci`, `docs`, `auth`, `grading`, `ai`

**Examples:**

```
feat(web): add assignment resubmission limit enforcement
fix(web): resolve Google OAuth redirect on Vercel production
docs: update architecture diagram
chore(ci): add npm dependency caching
```

---

## Reporting Bugs

Please use the [Bug Report](.github/ISSUE_TEMPLATE/bug_report.yml) issue template.

Include:
- Steps to reproduce
- Expected vs. actual behavior
- Environment (OS, Node version, browser)
- Relevant logs or screenshots

---

## Security Vulnerabilities

**Do NOT open a public GitHub Issue for security vulnerabilities.**

See [SECURITY.md](SECURITY.md) for responsible disclosure instructions.

---

## Questions

Open a [GitHub Discussion](https://github.com/truong256/UIGrade-AI/discussions)
or use the [Feature Request](.github/ISSUE_TEMPLATE/feature_request.yml) template
for design questions.
