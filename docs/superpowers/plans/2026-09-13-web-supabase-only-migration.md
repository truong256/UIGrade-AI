# UIGrade AI Web Supabase-Only Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Supabase Auth/PostgreSQL/RLS/RPC/Storage the only Web backend and remove all MongoDB runtime/source/dependencies/env/fallbacks without touching Android.

**Architecture:** Keep existing Next.js Web routes and Supabase service layer, align the live Supabase schema with repository migrations first, then migrate every active Mongo-backed service to Supabase. Atomic admin/submission/grading invariants move to PostgreSQL constraints/triggers/RPCs rather than application-side Mongo locks. Only after replacements pass tests do we delete Mongo models, repositories, connection helpers, mocks, config, docs, and direct dependencies.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Supabase Auth/PostgreSQL/RLS/RPC/Storage, GitHub Actions.

**Spec:** User-provided 2026-09-12 Supabase-only / MongoDB removal specification in the active conversation.

## Global Constraints

- Scope is only `web/**`, Web Supabase migrations, and Web tests/docs/config; never modify Android source or Android workflow files.
- Never use `git reset --hard`, `git add .`, `git add -A`, force-push, or disable RLS/tests to make checks pass.
- `.edu.vn` applies to new registration only; existing valid Admin accounts must remain able to authenticate.
- Supabase is the only production source of truth. No Mongo fallback, DB provider switch, or dual database path may remain.
- Security-definer functions must have explicit `search_path`, internal authorization checks where applicable, and minimum `EXECUTE` grants.
- New public tables/functions used through Supabase Data API require explicit grants as well as RLS/policies.
- A Mongo implementation is deleted only after its Supabase replacement has been verified.

---

### Task 1: Baseline, inventory, and migration ordering

**Files:**
- Read: `web/site/package.json`
- Read: `web/site/package-lock.json`
- Read: `web/site/supabase/migrations/*.sql`
- Read: `.github/workflows/web-ci.yml`
- Create/update later: `web/site/tests/supabase-only-architecture.test.ts`

**Interfaces:**
- Consumes: GitHub `main` at `22dabe0091aff7ca187b500909e7cbb9873aec46`.
- Produces: classified list of ACTIVE/PARTIALLY_MIGRATED/DEAD/TEST/SCRIPT/CONFIG/DOCUMENTATION/DEPENDENCY Mongo occurrences and a dependency-safe migration order.

- [ ] **Step 1: Inventory legacy database/auth references**

Search the Web tree for at least:

```text
mongodb mongoose MongoClient ObjectId MONGODB_URI MONGO_URI connectDB GridFS
jsonwebtoken JWT_SECRET bcrypt repository datasource adapter persistence legacy fallback
```

Classify each occurrence before changing it.

- [ ] **Step 2: Map callers before deletion**

For each ACTIVE/PARTIALLY_MIGRATED occurrence, identify route/service callers and the Supabase replacement. Do not delete a provider until no caller remains.

- [ ] **Step 3: Verify migration dependency order**

Use this repository order unless file inspection shows a stricter dependency:

```text
20260908000001_complete_grading_workflow.sql
20260909000001_mvp_security_lockdown.sql
20260909000002_complete_web_mvp.sql
20260910000001_harden_grading_boundaries.sql
20260910000002_isolate_ai_grading_suggestions.sql
20260911000001_harden_submission_and_profile_privacy.sql
20260912000001_enforce_education_email_signup.sql
```

- [ ] **Step 4: Add an architecture test that fails while active Mongo remains**

Create a test that scans production Web source/config and rejects active imports/usages such as:

```ts
expect(source).not.toMatch(/from ["']mongoose["']|from ["']mongodb["']|connectDB\(|MONGODB_URI|MongoClient|Types\.ObjectId|new ObjectId/i)
```

Exclude historical Git metadata and the plan itself; final cleanup should make tracked Web code/docs/tests/config pass without special Mongo allowlists.

---

### Task 2: Align production Supabase schema/security with the repository

**Files:**
- Verify/apply from: `web/site/supabase/migrations/20260908000001_complete_grading_workflow.sql`
- Verify/apply from: `web/site/supabase/migrations/20260909000001_mvp_security_lockdown.sql`
- Verify/apply from: `web/site/supabase/migrations/20260909000002_complete_web_mvp.sql`
- Verify/apply from: `web/site/supabase/migrations/20260910000001_harden_grading_boundaries.sql`
- Verify/apply from: `web/site/supabase/migrations/20260910000002_isolate_ai_grading_suggestions.sql`
- Verify/apply from: `web/site/supabase/migrations/20260911000001_harden_submission_and_profile_privacy.sql`
- Verify/apply from: `web/site/supabase/migrations/20260912000001_enforce_education_email_signup.sql`

**Interfaces:**
- Consumes: existing live tables `profiles/classes/class_members/assignments/submissions/grades/rubrics/notifications/system_configs` plus storage buckets already created.
- Produces: schema fields/RPCs/policies required by current Supabase service code and registration policy.

- [ ] **Step 1: Inspect each SQL file completely before executing it**

Confirm referenced columns/tables/functions exist or are created earlier in the ordered chain.

- [ ] **Step 2: Apply each migration atomically to production**

After each migration, query `information_schema`, `pg_proc`, `pg_policies`, and `storage.buckets` to verify the intended objects.

- [ ] **Step 3: Verify grading/submission objects**

Required examples include:

```text
grades.status, grades.max_score, grades.published_at
rubrics.owner_id
submissions.repository_url, submissions.files, submissions.attempt_no, submissions.is_current
ai_grading_suggestions
save_student_submission(...)
```

- [ ] **Step 4: Harden function exposure**

For helper/trigger-only functions, revoke unwanted `PUBLIC`/`anon` execute. For functions intentionally called by signed-in clients, grant only `authenticated` and ensure internal ownership/role checks exist.

- [ ] **Step 5: Run security and performance advisors**

No unresolved RLS-disabled/no-policy issue or publicly callable privileged helper may remain.

---

### Task 3: Migrate Admin user management and current-user checks to Supabase Auth + profiles

**Files:**
- Modify: `web/site/services/user-management.service.ts`
- Modify: `web/site/lib/current-user.ts`
- Modify if still needed: `web/site/lib/authorization.ts`
- Modify related routes under: `web/site/app/api/admin/**`, `web/site/app/api/users/**`
- Delete after replacement passes: `web/site/lib/distributed-lock.ts`
- Delete after replacement passes: `web/site/models/User.model.ts`
- Delete after replacement passes: `web/site/models/SecurityLock.model.ts`
- Test: existing admin/security tests plus new Supabase-only tests.

**Interfaces:**
- Consumes: Supabase Auth user id = `profiles.id`; canonical roles `student|lecturer|admin|pending`.
- Produces: Admin CRUD that uses Supabase Admin API/server-side Supabase operations for auth identities and PostgreSQL profile operations, with last-admin protection enforced in PostgreSQL.

- [ ] **Step 1: Write failing Admin tests**

Cover UUID ids, list/filter/pagination, create/update/delete, role/status changes, last-active-admin protection, and no Mongo/Mongoose/ObjectId imports.

- [ ] **Step 2: Replace Mongo reads/writes**

Use Supabase profile queries for profile state and server-only Auth Admin operations for creating/updating/deleting auth users. Never store or compare password hashes in `profiles`.

- [ ] **Step 3: Replace the Mongo distributed lock**

Use the existing PostgreSQL last-admin trigger/constraint/RPC boundary. Do not recreate a process mutex as the source of correctness.

- [ ] **Step 4: Remove legacy auth path**

`current-user.ts` must validate Supabase session/user and authoritative `profiles.status/role`; delete custom Mongo user lookup and Mongo-only JWT/session fallback after caller tracing.

- [ ] **Step 5: Verify Admin login routing**

```text
Supabase Auth -> session -> profile -> canonical role -> middleware/guard -> /admin
```

The `.edu.vn` rule must not retroactively reject a pre-existing valid Admin profile.

---

### Task 4: Migrate remaining active Mongo services/routes

**Files:**
- Modify: `web/site/services/system-config.service.ts`
- Modify: `web/site/app/api/server-config/route.ts`
- Modify: `web/site/services/learning-report.service.ts`
- Modify: `web/site/app/api/reports/learning/route.ts`
- Modify: `web/site/app/api/reports/learning/ai-summary/route.ts`
- Modify: `web/site/services/assignment-notification.service.ts`
- Modify: `web/site/app/api/notifications/assignment-reminders/route.ts`
- Delete after replacement passes: `web/site/models/SystemConfig.model.ts`
- Delete after replacement passes: `web/site/models/EmailNotificationLog.model.ts`

**Interfaces:**
- Consumes: `system_configs`, `profiles`, `classes`, `class_members`, `assignments`, `submissions`, `grades`, `notifications`.
- Produces: the same Web/API response contracts without any Mongo connection.

- [ ] **Step 1: System config**

Rewrite config get/update as a Supabase upsert/select against singleton `system_configs`. Preserve secret masking behavior in public responses.

- [ ] **Step 2: Learning reports**

Rebuild report aggregations from Supabase assignments/submissions/grades/class membership with role-scoped queries. Do not fallback on empty results.

- [ ] **Step 3: Assignment reminders**

Build eligible-recipient queries from Supabase class membership/assignments and write notification/log state in PostgreSQL. Ensure retries are idempotent using a database unique key/constraint rather than a Mongo log document.

- [ ] **Step 4: Route cleanup**

Delete every `connectDB()` call; Supabase failure returns an appropriate error and never invokes Mongo.

---

### Task 5: Remove obsolete Mongo repositories/models/scripts/types and local persistence paths

**Files:**
- Delete after caller scan: `web/site/lib/mongodb.ts`
- Delete Mongo models under `web/site/models/*.model.ts` that have no non-Mongo purpose.
- Delete/rewrite Mongo repositories such as `web/site/repositories/classroom-member.repository.ts` when superseded by existing Supabase services.
- Rewrite/delete: `web/site/scripts/seed.js`
- Remove Mongo-only local upload/GridFS handlers/directories if present.
- Modify barrel exports/imports as needed.

**Interfaces:**
- Consumes: completed Supabase services from Tasks 2-4.
- Produces: zero production Mongo modules and zero runtime ObjectId conversion.

- [ ] **Step 1: Search each legacy model/repository name and prove zero active caller**

- [ ] **Step 2: Delete obsolete modules rather than archive/comment them**

- [ ] **Step 3: Rewrite seed/test fixtures with UUID/Postgres row shapes or delete them if obsolete**

- [ ] **Step 4: Clean imports/exports and compile errors without reinstalling Mongo packages**

---

### Task 6: Remove legacy dependencies, env, CI, and documentation

**Files:**
- Modify: `web/site/package.json`
- Modify: `web/site/package-lock.json`
- Modify: `web/site/vitest.config.mjs`
- Modify tracked env examples/validators under `web/site/**`
- Modify: `README.md`
- Modify: `web/site/DEPLOYMENT.md`
- Modify/remove obsolete Mongo guidance under `web/project-files/**`
- Modify `.github/workflows/web-ci.yml` only if it still provisions Mongo or Mongo env; never touch Android workflow.

**Interfaces:**
- Produces: no direct `mongodb`, `mongoose`, `mongodb-memory-server`, `MONGODB_URI`, `MONGO_URI`, or Mongo startup/seed requirement in tracked Web files.

- [ ] **Step 1: Remove direct Mongo packages only after source scan is clean**

Use the repository's existing npm lockfile/package manager; do not change package manager.

- [ ] **Step 2: Remove Mongo/JWT test env that exists only for the legacy Mongo auth path**

Keep JWT libraries only if caller tracing proves a non-Mongo purpose remains.

- [ ] **Step 3: Update documentation to Supabase-only architecture**

Document Auth=Supabase Auth, DB=Supabase PostgreSQL, authorization=RLS/RPC, files=Supabase Storage.

---

### Task 7: Regression, security, and zero-Mongo verification

**Files:**
- Test: `web/site/tests/**`
- Workflow: `.github/workflows/web-ci.yml`

**Interfaces:**
- Produces: evidence for the final report and merge gate.

- [ ] **Step 1: Static final scan**

Search tracked Web source/config/tests/docs for:

```text
mongodb mongoose MongoClient ObjectId MONGODB_URI MONGO_URI GridFS connectDB
```

Target: zero active occurrences and, per this task, remove obsolete docs/tests/scripts so the practical repository result is zero legacy Mongo implementation.

- [ ] **Step 2: Run actual package scripts**

```bash
cd web/site
npm ci
npm test
npm run lint
npx tsc --noEmit
npm run build
```

Run integration/security/E2E/Playwright commands too if the repository defines them.

- [ ] **Step 3: Verify live Supabase**

Check Auth/profile role boundary, table grants, RLS, RPCs, storage policies, advisors, and required schema objects.

- [ ] **Step 4: Verify workflows**

At minimum validate:

```text
Admin login -> dashboard -> users/rubrics/rules/metrics/logs
Student login -> join class -> assignment -> submit/resubmit -> result
Lecturer login -> class -> assignment -> submissions -> grade -> publish
Lecturer create -> Student join -> submit -> Lecturer grade/publish -> Student result
```

No step may make a Mongo-backed API call.

---

### Task 8: Finish branch and merge only after gates pass

**Files:**
- No Android files.

**Interfaces:**
- Consumes: all verified changes from Tasks 1-7.
- Produces: clean commit history and `main` containing only verified Web/Supabase changes.

- [ ] **Step 1: Review diff and changed paths**

Ensure every path is Web/Supabase/docs/Web CI and no Android path is present.

- [ ] **Step 2: Commit logical units**

Preferred messages:

```text
refactor(web): migrate remaining mongodb flows to supabase
refactor(web): remove legacy mongodb runtime
test(web): enforce supabase-only regression coverage
```

- [ ] **Step 3: Use CI evidence as merge gate**

Do not merge/push the completed result to `main` if tests/typecheck/lint/build or critical security verification is failing.

- [ ] **Step 4: Final report**

Report before/after Mongo inventory, migrated flows, deleted files/routes/models/repos/tests/config, removed dependencies/env, final scan counts, Supabase security status, workflow verification, quality gates, commits, and merge/push status.
