# Web Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconcile the diverged Web history, harden Supabase authorization, verify Auth and grading flows, remove the remaining Web MongoDB documentation, and push a verified `main` without touching Android.

**Architecture:** Work on `work/web-production-readiness-20260914`, which is isolated from local `main` and protected by `safety/pre-web-production-readiness-20260914`. Merge remote history normally, keep authentication and authorization server/database authoritative, express database hardening as a migration plus regression tests, then integrate into `main` only after fresh full verification.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase Auth/PostgreSQL/RLS/Storage, Vitest, ESLint, npm, Git, Vercel.

**Spec:** `docs/superpowers/specs/2026-09-14-web-production-readiness-design.md`

## Global Constraints

- Modify only Web, Web documentation, Web tests, CI used by Web, and Supabase migration files.
- Do not modify Android source, Gradle, Compose, resources, tests, or Android PR #7.
- Never print, commit, or request a Supabase service-role key, Google Client Secret, database password, access token, or private key.
- Never insert directly into `auth.users`; create users only through Supabase Admin Auth.
- Canonical roles are exactly `admin`, `lecturer`, and `student`.
- New accounts must use an accepted `.edu.vn` address at both UI and server/database boundaries.
- Do not rebase or force-push shared `main`.
- Every production behavior change follows RED → GREEN → REFACTOR.
- Apply live database changes only after reviewing exact SQL definitions, ACLs, dependencies, and regression tests.
- A quality gate is reported as PASS only from fresh command output.

---

### Task 1: Reconcile `origin/main` into the isolated Web branch

**Files:**
- Merge: `origin/main` into `work/web-production-readiness-20260914`
- Verify: `web/site/lib/app-url.ts`
- Verify: `web/site/lib/auth-errors.ts`
- Verify: `web/site/app/auth/callback/route.ts`
- Verify: `web/site/components/auth/LoginFormCard.tsx`
- Verify: `web/site/tests/education-email-auth.test.tsx`
- Verify: `web/site/tests/supabase-auth-routes.test.ts`

**Interfaces:**
- Consumes: local Supabase-only/Soft UI history at `6bfeb44`; remote Auth history at `55bff77`.
- Produces: one non-rewriting merge with canonical-origin Google OAuth behavior and all existing Supabase-only runtime changes.

- [ ] **Step 1: Record remote and local ancestry immediately before merge**

Run:

```bash
git fetch origin --prune
git status --short --branch
git rev-list --left-right --count origin/main...HEAD
git log --oneline --left-right origin/main...HEAD -20
```

Expected: clean worktree; branch is ahead of `origin/main` and exactly four known Auth commits behind unless remote moved again.

- [ ] **Step 2: Merge without rewriting history**

Run:

```bash
git merge --no-ff origin/main -m "merge: reconcile remote Web authentication fixes"
```

Expected: merge completes or reports concrete conflicts. For conflicts, retain Supabase-only runtime removals and Soft UI composition while integrating `resolveAppOrigin`, sanitized Auth errors, `.edu.vn` messaging, and the lecturer role icon.

- [ ] **Step 3: Inspect the resolved Auth data flow**

Run:

```bash
git diff --check ORIG_HEAD..HEAD
rg -n "resolveAppOrigin|auth/callback|oauth_failed|edu.vn|lecturer" web/site/app web/site/components/auth web/site/lib web/site/tests
```

Expected: the browser callback remains `/auth/callback`; production origin is derived from trusted configuration/headers; provider errors are not reflected verbatim.

- [ ] **Step 4: Run focused merge-regression tests**

Run:

```bash
npm test -- --run tests/google-login-button.test.tsx tests/education-email-auth.test.tsx tests/supabase-auth-routes.test.ts tests/auth-routing.test.ts tests/auth-soft-ui.test.tsx
```

Expected: all selected test files pass.

- [ ] **Step 5: Commit conflict resolutions if Git did not create the merge automatically**

Run:

```bash
git add web/site/app web/site/components/auth web/site/lib web/site/tests web/site/package.json web/site/package-lock.json
git commit -m "merge: reconcile remote Web authentication fixes"
```

Expected: a merge commit containing only the resolved Web paths.

### Task 2: Prove Auth, role, session, and education-email boundaries

**Files:**
- Modify only if a failing test proves a defect: `web/site/app/api/auth/login/route.ts`
- Modify only if a failing test proves a defect: `web/site/app/api/auth/register/route.ts`
- Modify only if a failing test proves a defect: `web/site/app/api/auth/set-role/route.ts`
- Modify only if a failing test proves a defect: `web/site/app/api/auth/logout/route.ts`
- Modify only if a failing test proves a defect: `web/site/app/auth/callback/route.ts`
- Modify only if a failing test proves a defect: `web/site/lib/current-user.ts`
- Test: `web/site/tests/supabase-auth-routes.test.ts`
- Test: `web/site/tests/auth-routing.test.ts`
- Test: `web/site/tests/education-email-auth.test.tsx`

**Interfaces:**
- Consumes: Supabase cookie session and trusted `profiles` records.
- Produces: deterministic routing for `pending`, `student`, `lecturer`, `admin`, inactive, missing-profile, expired-session, and cross-role cases.

- [ ] **Step 1: Run the complete existing Auth boundary suite**

Run:

```bash
npm test -- --run tests/auth-routing.test.ts tests/supabase-auth-routes.test.ts tests/education-email.test.ts tests/education-email-auth.test.tsx tests/visit-boundary.test.tsx tests/password-recovery.test.tsx
```

Expected: all existing Auth cases pass after the remote merge.

- [ ] **Step 2: Inventory server-side role decisions and reject client authority**

Run:

```bash
rg -n "role|userId|studentId|lecturerId|auth.getUser|getCurrentUser|requireRole|requirePermission" web/site/app/api/auth web/site/app/auth web/site/lib/current-user.ts web/site/lib/authorization.ts
```

Expected: route authorization derives identity from the Supabase session; request body role is accepted only by the constrained pending-user onboarding route.

- [ ] **Step 3: Add a regression test only for each reproduced gap**

For a reproduced cross-role or education-email gap, add a focused case using the existing `request()` and Supabase boundary mocks. The assertion must target the HTTP contract:

```ts
expect(response.status).toBe(403);
expect(await response.json()).toMatchObject({ success: false });
```

For a missing session, assert:

```ts
expect(response.status).toBe(401);
```

Run the individual test and confirm it fails because the route accepts the forbidden state, not because of mock setup.

- [ ] **Step 4: Implement the smallest server-side correction for every RED case**

Use the existing centralized guard or authenticated Supabase user. Do not add a client-trusted role branch. Return the repository's standard sanitized `401`, `403`, `409`, or `503` response.

- [ ] **Step 5: Re-run focused Auth tests and commit verified changes**

Run:

```bash
npm test -- --run tests/auth-routing.test.ts tests/supabase-auth-routes.test.ts tests/education-email.test.ts tests/education-email-auth.test.tsx tests/visit-boundary.test.tsx tests/password-recovery.test.tsx
git diff --check
```

If production or test files changed, commit only those files:

```bash
git add web/site/app/api/auth web/site/app/auth web/site/lib/current-user.ts web/site/lib/authorization.ts web/site/tests
git commit -m "fix(web-auth): enforce session and role boundaries"
```

### Task 3: Harden live Supabase functions, RLS, and policy performance

**Files:**
- Create with Supabase CLI: `web/site/supabase/migrations/*_harden_authenticated_rpc_and_rls.sql` (the CLI supplies the timestamp prefix)
- Test: `web/site/tests/supabase-security-hardening.test.ts`
- Verify: existing migration tests under `web/site/tests/*migration*.test.ts`

**Interfaces:**
- Consumes: live definitions, ACLs, policies, and indexes from project `plcrwxcwgfcqtfuidloz`.
- Produces: idempotent SQL that restricts callable functions, fixes unsafe search paths or authorization gaps, and optimizes proven RLS init-plan expressions without widening access.

- [ ] **Step 1: Read current Supabase guidance and inspect the live catalog**

Use Supabase documentation search for `SECURITY DEFINER`, function privileges, RLS helper recursion, and `(select auth.uid())`. Query `pg_proc`, `pg_namespace`, `information_schema.routine_privileges`, `pg_policies`, `pg_class`, and `pg_indexes` for the 10 warned functions and affected tables.

Expected: an evidence table for each function with definition, owner, `prosecdef`, `proconfig`, `PUBLIC`/`anon`/`authenticated` execute state, dependent policies, and direct RPC consumers.

- [ ] **Step 2: Write the migration contract test first**

Create `tests/supabase-security-hardening.test.ts` that reads the generated migration and asserts these concrete invariants:

```ts
expect(sql).toMatch(/REVOKE\s+ALL\s+ON\s+FUNCTION[\s\S]+FROM\s+PUBLIC/i);
expect(sql).toMatch(/REVOKE\s+ALL\s+ON\s+FUNCTION[\s\S]+FROM\s+anon/i);
expect(sql).toMatch(/SET\s+search_path\s*=\s*''/i);
expect(sql).not.toMatch(/GRANT\s+EXECUTE[\s\S]+TO\s+anon/i);
expect(sql).not.toMatch(/USING\s*\(\s*true\s*\)|WITH\s+CHECK\s*\(\s*true\s*\)/i);
```

Add explicit assertions for the signatures that remain authenticated RPCs: `join_class_by_code(text)` and `save_student_submission(uuid,text,text,jsonb,text,text)`.

- [ ] **Step 3: Run the new test and verify RED**

Run:

```bash
npm test -- --run tests/supabase-security-hardening.test.ts
```

Expected: FAIL because the new migration does not exist.

- [ ] **Step 4: Generate the migration file with the discovered Supabase CLI**

Run the installed CLI's help first:

```bash
supabase --help
supabase migration new harden_authenticated_rpc_and_rls
```

If no standalone CLI exists, use a pinned `npx supabase` version after checking `npx supabase --help`; do not hand-invent the migration timestamp.

- [ ] **Step 5: Implement the reviewed SQL**

The migration must:

- use explicit function signatures;
- set a fixed empty `search_path` and schema-qualify referenced objects for retained definer functions;
- revoke function execution from `PUBLIC` and `anon`;
- grant `authenticated` only for functions intentionally called by clients or policies;
- keep `join_class_by_code` and `save_student_submission` atomic with internal `auth.uid()`, active-role, membership/ownership, state, and input checks;
- change predicate helpers to invoker only when live dependency testing proves no recursive RLS;
- replace direct Auth helper expressions in affected policies with scalar subqueries when semantically equivalent;
- consolidate overlapping profile policies only after truth-table comparison;
- add an index only when a named policy predicate lacks a supporting prefix.

- [ ] **Step 6: Run local migration and authorization tests**

Run:

```bash
npm test -- --run tests/supabase-security-hardening.test.ts tests/mvp-security-migration.test.ts tests/grading-migration-security.test.ts tests/grading-boundaries-migration.test.ts tests/submission-security-hardening.test.ts tests/role-security-migration.test.ts tests/web-mvp-migration.test.ts
```

Expected: all tests pass and no earlier migration invariant regresses.

- [ ] **Step 7: Apply the exact reviewed migration to the live project**

Apply through the authenticated Supabase migration capability using project `plcrwxcwgfcqtfuidloz`. Do not include data inserts or generated user IDs.

- [ ] **Step 8: Verify live behavior and Advisors**

Query live function definitions, ACLs, policy expressions, RLS flags, and relevant indexes again. Run Security and Performance Advisors.

Expected: no new security finding; callable retained RPCs have intentional minimum grants; RLS remains enabled; performance warnings decrease without access widening. Leaked-password protection is reported as external Dashboard configuration if it cannot be changed through the available capability.

- [ ] **Step 9: Commit the migration and its tests**

Run:

```bash
git add web/site/supabase/migrations web/site/tests/supabase-security-hardening.test.ts
git commit -m "fix(supabase): harden RLS and authenticated RPC functions"
```

### Task 4: Remove remaining Web MongoDB and custom-JWT documentation

**Files:**
- Modify: `web/site/DEPLOYMENT.md`
- Test: `web/site/tests/supabase-only-architecture.test.ts`

**Interfaces:**
- Consumes: Supabase-only runtime and current environment names.
- Produces: deployment instructions that require PostgreSQL/Supabase only and an architecture test that also scans active deployment documentation.

- [ ] **Step 1: Extend the architecture test before changing documentation**

Add `DEPLOYMENT.md` to the scanned active configuration/documentation inputs. Assert that it does not require MongoDB packages, Mongo connection variables, ObjectId, or custom JWT secrets, while allowing historical plan/spec documents to describe removal.

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
npm test -- --run tests/supabase-only-architecture.test.ts
```

Expected: FAIL on the current MongoDB architecture and environment instructions in `DEPLOYMENT.md`.

- [ ] **Step 3: Rewrite the active deployment sections**

Replace the database/auth architecture with Supabase PostgreSQL, Auth, Storage, and RLS. Remove `MONGODB_URI`, custom `JWT_SECRET`, MongoDB Atlas setup, and obsolete Vercel commands. Retain `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, Gemini, notification, and SMTP variables with correct public/server-only labeling.

- [ ] **Step 4: Verify GREEN and scan all active Web paths**

Run:

```bash
npm test -- --run tests/supabase-only-architecture.test.ts tests/web-mvp-architecture.test.ts
rg -n -i "mongodb|mongoose|MongoClient|ObjectId|MONGO_URI|MONGODB_URI|GridFS|connectDB|JWT_SECRET|jsonwebtoken" web/site/app web/site/components web/site/lib web/site/services web/site/types web/site/package.json web/site/.env.example web/site/DEPLOYMENT.md
```

Expected: tests pass; direct runtime/config/documentation scan returns no match. Guard-test regex declarations are reviewed separately and are not runtime dependencies.

- [ ] **Step 5: Commit documentation cleanup**

Run:

```bash
git add web/site/DEPLOYMENT.md web/site/tests/supabase-only-architecture.test.ts
git commit -m "docs(web): remove obsolete MongoDB deployment setup"
```

### Task 5: Audit API authorization and grading end-to-end

**Files:**
- Inspect: every `web/site/app/api/**/route.ts`
- Modify only for reproduced defects: centralized helpers in `web/site/lib/authorization.ts`, `web/site/lib/current-user.ts`, or the affected route/service
- Test: existing `assignment-route-security.test.ts`, `class-detail-security.test.ts`, `grading-service-security.test.ts`, `rbac.test.ts`, and route-specific suites

**Interfaces:**
- Consumes: authenticated server identity, canonical profile role, resource ownership/membership, and RLS.
- Produces: every mutation with explicit authentication, role, ownership, validation, conflict handling, sanitized failure behavior, and database defense in depth.

- [ ] **Step 1: Create the route authorization inventory**

For every API route, record supported methods and evidence for authentication, role, ownership/membership, validation, conflict/race handling, and error sanitization. Use:

```bash
find web/site/app/api -name route.ts -print | sort
rg -n "export async function|requireRole|requirePermission|getCurrentUser|auth.getUser|safeParse|parse\(" web/site/app/api
```

Expected: every mutation route maps to an existing test or a specific missing boundary case.

- [ ] **Step 2: Run authorization and grading suites before editing**

Run:

```bash
npm test -- --run tests/assignment-route-security.test.ts tests/class-detail-security.test.ts tests/join-class-route.test.ts tests/student-search-route.test.ts tests/grading-service-security.test.ts tests/grading.test.ts tests/grading-storage.test.ts tests/rbac.test.ts
```

Expected: existing cases pass; failures are investigated to root cause before edits.

- [ ] **Step 3: Reproduce each uncovered boundary with one RED test**

Each new test must assert one observable contract: `401` for no session, `403` for wrong role or ownership, `404` for inaccessible resource, `409` for duplicate/conflict, or a successful persisted result for an authorized request. Tests must not merely assert that a mock helper was called.

- [ ] **Step 4: Implement minimal server-side fixes**

Derive user identity from the session, validate IDs and payloads with existing schemas, load the target resource before mutation, verify its relationship to the authenticated user, and let RLS enforce the same boundary. Preserve sanitized errors and atomic submission/grading behavior.

- [ ] **Step 5: Verify the grading state machine**

Run:

```bash
npm test -- --run tests/grading.test.ts tests/grading-service-security.test.ts tests/grading-storage.test.ts tests/ai-grading-v2.test.ts tests/ai-grading-migration.test.ts
```

Expected: assignment/submission association, lecturer ownership, rubric bounds, draft/publish/history, student result visibility, and AI suggestion isolation all pass.

- [ ] **Step 6: Commit each independently verified correction**

Stage only the affected route/service/helper and its RED/GREEN test. Use commit subjects scoped to the defect, such as:

```text
fix(web-api): enforce assignment ownership before mutation
fix(web-grading): reject cross-class submission grading
```

If the inventory proves no defect, create no empty audit commit.

### Task 6: Audit Web routes and interactions

**Files:**
- Inspect: `web/site/app/**/page.tsx`
- Inspect: `web/site/components/**/*.tsx`
- Test: `web/site/tests/layout-regression.test.ts`
- Test: focused component/route tests for reproduced findings

**Interfaces:**
- Consumes: App Router route tree and existing interactive components.
- Produces: no known dead-looking control, invalid local route, duplicate submission, swallowed error, or unexplained disabled state.

- [ ] **Step 1: Run static interaction searches**

Run:

```bash
rg -n "href=[\"']#[\"']|onClick=\{\(\) => \{\}\}|TO[D]O|FI[X]ME|console\.log|javascript:void|disabled=\{true\}" web/site/app web/site/components
find web/site/app -name page.tsx -o -name route.ts | sort
```

Expected: each match is classified as actionable, test-only text, intentional disabled state, or non-production documentation.

- [ ] **Step 2: Run UI interaction suites**

Run:

```bash
npm test -- --run tests/auth-soft-ui.test.tsx tests/layout-regression.test.ts tests/server-config-client.test.ts tests/visit-boundary.test.tsx tests/password-recovery.test.tsx
```

Expected: loading, error, duplicate-click, recovery, and session-visit boundaries pass.

- [ ] **Step 3: Add one RED test per reproduced interaction defect**

Use accessible role/name selectors and assert visible feedback, navigation target, disabled/busy state, or dialog dismissal. Do not assert internal component state.

- [ ] **Step 4: Implement the smallest accessible correction and verify GREEN**

Preserve keyboard interaction, focus behavior, Vietnamese feedback, and double-click protection. Re-run the individual test followed by the UI suite.

- [ ] **Step 5: Run an anonymous browser smoke test**

Start the dev server with non-secret public Supabase configuration when available. Verify `/login`, `/register`, Privacy, Contact, Help, Google button initiation, invalid callback handling, protected-route redirect, 404 behavior, and responsive rendering. Do not claim credential-backed role E2E from this smoke test.

- [ ] **Step 6: Commit verified UI fixes only when findings exist**

Stage only affected Web components/pages and their tests. If no defect is reproduced, report the audit without an empty commit.

### Task 7: Provision and test the three Supabase accounts when authority exists

**Files:**
- No tracked credential file.
- No SQL insertion into `auth.users`.

**Interfaces:**
- Consumes: server-only Supabase Admin Auth capability or configured `SUPABASE_SERVICE_ROLE_KEY` without exposing its value.
- Produces: three confirmed Auth users whose profile IDs match Auth IDs and whose roles/statuses are canonical.

- [ ] **Step 1: Check capability without printing secrets**

Report only `SUPABASE_SERVICE_ROLE_KEY=configured` or `SUPABASE_SERVICE_ROLE_KEY=missing`. Discover whether the Supabase connector exposes Auth Admin user creation.

- [ ] **Step 2: Query account existence**

Read `auth.users` joined to `public.profiles` for the three exact emails. Confirm there are no duplicates and record email confirmation, profile existence, role, and status.

- [ ] **Step 3: Provision through Admin Auth only**

For each missing email, call Admin Auth create-user with confirmed email and the provided test password. Upsert only the matching trusted profile after checking whether the Auth trigger already created it. Never log request bodies containing the password.

- [ ] **Step 4: Verify identity/profile invariants**

Confirm exactly three rows, `profiles.id = auth.users.id`, matching normalized email, roles `admin`/`lecturer`/`student`, and status `active`.

- [ ] **Step 5: Run real role E2E when credentials are provisioned**

Verify login, redirect, dashboard data, role workflows, cross-role denial, logout, browser Back protection, and direct refresh for each role. Record actual PASS/FAIL per account.

If authority remains unavailable, mark provisioning and real credential E2E `BLOCKED BY AUTH ADMIN CONFIGURATION` and continue to Task 8.

### Task 8: Full verification, safe `main` integration, push, and deployment check

**Files:**
- Verify all changed Web/spec/plan/migration/test files.
- Verify no changes under Android paths.

**Interfaces:**
- Consumes: all verified workstream commits.
- Produces: a clean, non-diverged remote `main` and evidence-backed deployment status.

- [ ] **Step 1: Run fresh full Web quality gates**

Run from `web/site`:

```bash
npm ci
npm test -- --run --reporter=dot
npm run lint
npx tsc --noEmit
npm run build
```

Expected: dependency installation succeeds; tests do not regress below 330; lint has zero errors; TypeScript and production build pass.

- [ ] **Step 2: Run repository safety scans**

Run from the repository root:

```bash
git diff --check
git status --short
git diff --name-only safety/pre-web-production-readiness-20260914...HEAD
git ls-files | rg '(^|/)\.env($|\.)|private.*key|service.*role'
rg -n "SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^[:space:]$<{]" . --glob '!node_modules' --glob '!.git' --glob '!*.md'
```

Expected: no Android path changed; no tracked environment file with secret values; no service-role value; working tree clean after intended commits.

- [ ] **Step 3: Fetch and reconcile any new remote movement**

Run:

```bash
git fetch origin --prune
git rev-list --left-right --count origin/main...HEAD
```

If the left count is nonzero, merge `origin/main` normally, run affected tests, then repeat all full gates. Never force-push.

- [ ] **Step 4: Integrate the verified branch into local `main`**

In the primary worktree, verify `main` is clean and merge:

```bash
git merge --no-ff work/web-production-readiness-20260914 -m "merge: complete Web Supabase production readiness"
```

Run `git diff --check` and verify `main` is not behind `origin/main`.

- [ ] **Step 5: Push and verify the remote SHA**

Run:

```bash
git push origin main
git fetch origin
git rev-parse HEAD
git rev-parse origin/main
git rev-list --left-right --count origin/main...main
```

Expected: push succeeds; local and remote SHA match; ahead/behind is `0 0`.

- [ ] **Step 6: Verify Vercel deployment when access exists**

Inspect the production deployment triggered by the pushed SHA, confirm required environment variable names exist in Production without reading their values, and smoke-test the canonical production URL. If Vercel access is unavailable, report `NOT VERIFIED — deployment access unavailable`.

- [ ] **Step 7: Produce the final evidence report**

Use the report sections from the spec: Repository, Supabase Auth, Authentication, Supabase, Role QA, Grading, Quality Gates, Git, Deployment, and Remaining Blockers. Distinguish automated boundary tests, anonymous smoke tests, and real credential-backed E2E.
