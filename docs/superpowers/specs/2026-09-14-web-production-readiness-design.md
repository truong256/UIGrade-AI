# Web Production Readiness Design

**Date:** 2026-09-14

**Repository:** `truong256/UIGrade-AI`

**Scope:** Web UIGrade AI and its Supabase production project only. Android source, Gradle configuration, resources, tests, and Android pull requests are out of scope.

## Goal

Bring the Web application to a verified Supabase-only production state: authenticated users follow the correct role flow, server and database authorization prevent cross-role access, grading persists correctly, security findings are hardened without breaking required RPC flows, the UI has no known dead interactions, all quality gates pass, and the reconciled `main` branch is pushed without rewriting remote history.

## Verified Starting State

- Local `main` starts at `6bfeb44` and is clean.
- `origin/main` is at `55bff77` after fetch.
- The histories diverge: local is 67 commits ahead and 4 commits behind.
- The four remote-only commits improve Google OAuth canonical redirects, education-email messaging, and a lecturer role icon.
- The isolated implementation branch is `work/web-production-readiness-20260914`.
- Safety branch `safety/pre-web-production-readiness-20260914` preserves `6bfeb44`.
- Web dependency installation succeeds.
- Baseline Web tests pass: 35 files and 330 tests.
- Supabase project `plcrwxcwgfcqtfuidloz` is `ACTIVE_HEALTHY`.
- None of the required demo emails currently has an Auth user or profile.
- No Auth Admin capability or `SUPABASE_SERVICE_ROLE_KEY` is available in the execution environment.
- Security Advisor reports 10 authenticated-callable `SECURITY DEFINER` functions and disabled leaked-password protection.
- Performance Advisor reports repeated Auth/RLS initialization, multiple permissive profile policies, and unused-index informational findings.
- Web runtime dependencies and source are Supabase-only, but `web/site/DEPLOYMENT.md` still documents MongoDB configuration.

## Delivery Strategy

Work proceeds in independently verifiable stages. Each behavior change begins with a failing regression test. Database changes are represented by reviewed migration SQL, applied to the live Supabase project only after the exact definitions and grants are audited, and verified with SQL plus Advisors afterward.

The implementation branch first merges `origin/main` with a normal merge commit. Rebase and force-push are prohibited. Conflicts are resolved by retaining the Supabase-only architecture and integrating the remote canonical-origin fixes. Final integration into local `main` occurs only after all gates pass; `main` is pushed only when it is no longer behind `origin/main`.

## Git Reconciliation

1. Merge `origin/main` into the isolated implementation branch.
2. Resolve conflicts at the behavior level, not by selecting an entire side.
3. Preserve the local Supabase-only migration and Soft UI authentication changes.
4. Preserve the remote canonical app-origin logic, `.edu.vn` error messaging, and tested lecturer icon correction.
5. Run focused Auth tests immediately after the merge.
6. Do not merge or close Android PR #7 or README PR #2.
7. Before final integration, fetch again and repeat divergence analysis. If remote moved, merge the new remote commits and rerun all gates.

## Authentication Architecture

The browser starts Google authentication with Supabase OAuth and an origin-relative application callback. Supabase exchanges with Google through the project callback, then the Next.js callback exchanges the PKCE code for a cookie-backed session. Email/password registration and OAuth onboarding both enforce the education-email rule server-side.

Authorization uses the authenticated Supabase user ID and the canonical `public.profiles.role`. Client-submitted role or user identifiers never establish authorization. Canonical roles are exactly `admin`, `lecturer`, and `student`; newly authenticated Google users without a completed profile remain `pending` until they choose `student` or `lecturer`. Admin cannot be self-selected.

Required edge cases:

- Missing, invalid, or expired session redirects to login without exposing provider details.
- Missing profile and recoverable profile initialization follow a deterministic path.
- Pending users reach role onboarding and cannot enter role dashboards.
- Suspended or locked profiles cannot use protected features.
- Direct URL entry and refresh use the same server-side guard as normal navigation.
- Cross-role routes are rejected or redirected to the user's own role area.
- Logout invalidates the application session, and browser Back cannot restore protected data.
- A new non-`.edu.vn` Google account is rejected after verified identity is read; Google verification alone cannot bypass the education-email rule.
- Existing explicitly provisioned administrators remain governed by their trusted profile rather than client metadata.

## Demo Account Provisioning

The target accounts are:

| Email | Canonical role | Status |
|---|---|---|
| `admin@uigrade.edu.vn` | `admin` | `active` |
| `teacher@uigrade.edu.vn` | `lecturer` | `active` |
| `student@uigrade.edu.vn` | `student` | `active` |

Each account must be created or updated through Supabase Admin Auth, never with direct SQL inserts into `auth.users`. Provisioning checks email uniqueness, confirmation state, profile identity equality, canonical role, and active status. Existing users are reused rather than duplicated. The password is never committed, printed, logged, or stored in `profiles`.

Because the current environment lacks Auth Admin authority, provisioning and real credential login remain explicitly blocked until a server-only `SUPABASE_SERVICE_ROLE_KEY` is configured outside chat or an Auth Admin connector becomes available. This blocker does not stop code, policy, migration, or non-credential QA.

## Supabase Security Design

### RLS boundaries

Every table exposed through the Data API keeps RLS enabled. Policies combine authentication with ownership or relationship predicates; `TO authenticated` alone is insufficient authorization.

- Students can read and mutate only their own profile, memberships, submissions, notifications, and permitted published results. They can read classes, assignments, rubrics, and materials only through active membership and release rules.
- Lecturers can manage only classes they own and related assignments, rubrics, memberships, submissions, grading records, and AI suggestions.
- Admin operations require the canonical active Admin profile and are not inferred from user-editable metadata.
- Student identifiers, role values, class IDs, assignment IDs, and submission IDs supplied by clients are treated as untrusted input and revalidated against the authenticated user and resource graph.

Update policies include both `USING` and `WITH CHECK` where ownership could otherwise be reassigned. Calls to Auth helpers use scalar subqueries where semantically equivalent to avoid per-row initialization. Duplicate permissive policies are consolidated only after proving equivalent access is retained.

### `SECURITY DEFINER` functions

The following live functions require individual review: `can_read_class_members`, `is_active_class_member`, `is_active_student`, `is_active_user`, `is_admin`, `is_lecturer`, `is_lecturer_or_admin`, `join_class_by_code`, `owns_class`, and `save_student_submission`.

Pure predicate helpers should become `SECURITY INVOKER` when doing so does not cause recursive RLS evaluation. Functions that must bypass RLS to provide an atomic business operation may retain `SECURITY DEFINER` only when all of these controls are present:

- fixed empty or trusted `search_path`;
- schema-qualified table and function references;
- authenticated caller identity obtained from `auth.uid()`;
- internal active-user, role, ownership, membership, and resource-state checks;
- no caller-supplied user ID used as authority;
- `EXECUTE` revoked from `PUBLIC` and `anon`;
- `EXECUTE` granted only to the minimum required role;
- stable return values that do not disclose unrelated records.

Advisor findings are not silenced merely to make the dashboard green. An authenticated-callable function may remain an acknowledged warning only if it is intentionally part of the authenticated RPC API and the above controls are verified by definition, ACL, and adversarial tests.

### Performance findings

RLS expressions use `(select auth.uid())` and equivalent scalar subqueries when safe. Policy joins are reviewed against foreign keys and frequent predicates before adding an index. Unused-index findings are informational and do not justify removing indexes required for future workloads, constraints, or RLS joins. Every index change must be tied to a concrete query or policy.

## API Authorization

All Web route handlers and server operations for users, profiles, classes, memberships, assignments, submissions, grading, rubrics, rules, metrics, AI feedback, notifications, reports, and system configuration are inventoried.

Every mutation must prove:

1. an authenticated server-side user;
2. an active canonical profile;
3. the required role;
4. ownership or relationship to the target resource;
5. validated input and canonical identifiers;
6. a database/RLS backstop;
7. deterministic handling of duplicates and concurrent submissions;
8. sanitized errors without secret or provider leakage.

The audit reuses existing centralized authorization helpers. Any route that bypasses those helpers receives a focused regression test before being changed.

## Grading Flow

The verified business flow is `Lecturer -> Assignment -> Submission -> Grade -> Save -> Student Result`.

- A submission must exist and belong to the selected assignment.
- The lecturer must own the assignment's class or be an authorized Admin.
- Rubric criteria and score bounds are validated before persistence.
- AI output is advisory input, not an authorization source.
- Manual override is explicit and auditable.
- Grade persistence and grading history remain consistent under retries.
- Students can read only their own released results and cannot modify grades.
- Lecturers cannot grade submissions in classes owned by another lecturer.
- Production paths cannot fall back to mock grading or fake API responses.

## UI and Route QA

All App Router pages, route handlers, forms, links, buttons, menus, dialogs, and visible disabled states are inventoried. Static checks identify `href="#"`, empty callbacks, placeholder handlers, `TODO`, `FIXME`, debug logging, invalid routes, and production mock paths. Each actionable finding is reproduced before a fix.

Interactive flows verify loading, empty, error, success, cancellation, duplicate-click prevention, form validation, modal dismissal, refresh, direct protected-route navigation, and logout behavior. Components that appear interactive must either perform a documented action or clearly communicate why they are unavailable.

Real end-to-end role tests are attempted only after valid Auth users exist. Until then, automated boundary tests and anonymous production smoke tests are reported separately from credential-backed E2E.

## MongoDB Removal

No Web runtime source, dependency, environment sample, CI configuration, or deployment documentation may require MongoDB, Mongoose, ObjectId, GridFS, custom JWT authentication, or a legacy database adapter. Historical migration/design documents and architecture guard tests may mention forbidden technology names only when clearly describing removal or enforcing absence. Android mock data is outside this audit and remains unchanged.

`web/site/DEPLOYMENT.md` is updated to describe Supabase Auth, PostgreSQL, Storage, current public keys, and server-only secrets. Obsolete MongoDB and custom JWT setup instructions are removed.

## External Configuration

Google OAuth and Vercel settings are verified without revealing secrets. Required externally managed fields include:

- Google OAuth Web Client authorized origins;
- Google authorized redirect URI pointing to the Supabase project callback;
- enabled Google provider with Web Client ID first;
- Supabase Site URL and exact application callback allowlist;
- Vercel `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and publishable/anon key in the appropriate environments.

Missing dashboard access is reported as `BLOCKED BY EXTERNAL CONFIGURATION`. Google Client Secret and service-role credentials are never requested in chat.

## Verification and Release Gates

Focused tests run after each workstream. Before final integration and again after any final remote reconciliation, the following must succeed from `web/site`:

- deterministic dependency installation with the committed lockfile;
- all unit and integration tests with no regression below the 330-test baseline unless removals are explicitly justified;
- authentication and authorization regression tests;
- TypeScript strict type checking;
- ESLint with zero errors;
- Next.js production build;
- Supabase SQL verification and Advisors after live schema changes;
- secret scan distinguishing variable names from actual credential values;
- MongoDB runtime/configuration scan;
- `git diff --check`;
- Android path diff check proving no Android changes are included.

Final Git procedure:

1. fetch `origin` again;
2. resolve any new remote movement with a normal merge;
3. rerun affected and full gates;
4. merge the implementation branch into local `main` without rewriting history;
5. verify local `main` is not behind `origin/main`;
6. push with `git push origin main` and no force option;
7. verify local HEAD, `origin/main`, and remote SHA are identical;
8. inspect Vercel deployment and production smoke behavior when access exists.

## Success Criteria

The Web runtime is Supabase-only; local and remote Auth changes coexist; server and RLS boundaries reject cross-role access; grading data follows ownership and score rules; Advisor findings are fixed or explicitly justified with hardened ACLs; no known dead interaction remains; all quality gates pass; Android remains untouched; the three role accounts are tested when Admin Auth authority is available; and `main` is pushed only after safe reconciliation.
