# Web Lecturer Flow Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete and verify the UIGrade AI Web lecturer journey from sign-in through owned-class management, assignment lifecycle, submission review, grading, and result publication.

**Architecture:** Keep Next.js pages focused on presentation and request state, with authoritative identity and role resolution in protected API routes. Supabase service methods scope every read and mutation through lecturer ownership, while RLS/RPC and private Storage provide defense in depth. Canonical UI and write paths use `lecturer`; legacy `teacher` is normalized only when historical profile data enters the application.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase Auth/PostgreSQL/RLS/Storage, Vitest, Testing Library, ESLint, npm.

**Spec:** `docs/superpowers/specs/2026-09-14-web-lecturer-flow-design.md`

## Global Constraints

- Scope is Web lecturer behavior, shared Web components required by that behavior, Web tests, and evidence-backed Supabase migrations only.
- Do not modify Android source, Gradle, Compose, resources, tests, or Android workflows.
- Canonical roles remain exactly `admin`, `lecturer`, `student`, and onboarding-only `pending`; no new write may produce `teacher`.
- UI role checks are never an authorization boundary. API, service, and Supabase ownership checks remain authoritative.
- AI output remains advisory and cannot publish or overwrite a lecturer-confirmed grade by itself.
- Never print, commit, or expose service-role keys, OAuth secrets, database passwords, or provider API keys.
- Every production behavior change follows RED, GREEN, REFACTOR.
- Live Supabase changes require an exact reviewed migration, regression tests, and post-apply verification.
- No force-push, history rewrite, or broad staging command is allowed.

---

### Task 1: Canonical Lecturer Role and Route Surface

**Files:**
- Modify: `web/site/lib/navigation.ts`
- Modify: `web/site/lib/auth-routing.ts`
- Modify: `web/site/components/shared/AppHeader.tsx`
- Modify: `web/site/components/shared/AppSidebar.tsx`
- Modify: `web/site/components/my_classes/ClassesHeader.tsx`
- Modify: `web/site/components/assignment_list/AssignmentListHeader.tsx`
- Test: `web/site/tests/auth-routing.test.ts`
- Test: `web/site/tests/layout-regression.test.ts`
- Create: `web/site/tests/lecturer-role-ui.test.tsx`

**Interfaces:**
- Consumes: `authenticatedProfileRole(role: unknown): AuthenticatedRole | null` as the only legacy profile normalization boundary.
- Produces: `getNavItemsForRole(role: AuthenticatedRole | null | undefined): NavItem[]` and one canonical lecturer route set.

- [ ] **Step 1: Write failing role-boundary tests**

Add assertions that `teacher` is accepted by `authenticatedProfileRole()` but does not receive lecturer navigation unless it has first been normalized. Render shared navigation/header behavior with the canonical role and assert the user-visible lecturer result:

```ts
it("keeps the teacher alias at the profile boundary only", () => {
  expect(authenticatedProfileRole("teacher")).toBe("lecturer");
  expect(isAuthenticatedRole("teacher")).toBe(false);
  expect(getNavItemsForRole("teacher" as never)).toEqual(studentNavItems);
});

it("uses the canonical lecturer create and grading routes", () => {
  const hrefs = lecturerNavItems.map((item) => item.href);
  expect(hrefs).toContain("/ui/assignment_list");
  expect(hrefs).toContain("/ui/grading_detail");
  expect(hrefs).not.toContain("/ui/server_config");
});
```

The UI test renders the real shared header/sidebar with a canonical lecturer profile and verifies the visible `Giảng viên` label, lecturer links, and absence of Admin/Student-only links. TypeScript checking protects the narrowed component role props.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
cd web/site
npm test -- --run tests/auth-routing.test.ts tests/layout-regression.test.ts tests/lecturer-role-ui.test.tsx
```

Expected: failure because navigation and shared component role unions still accept `teacher`.

- [ ] **Step 3: Restrict UI roles to canonical values**

Change shared role unions to `AuthenticatedRole` or `"admin" | "lecturer" | "student"`, remove direct `role === "teacher"` UI branches, and keep safe-default student navigation for null/unknown input. Do not remove `authenticatedProfileRole("teacher")` compatibility.

- [ ] **Step 4: Verify GREEN and commit**

Run the focused tests, then:

```bash
git add web/site/lib/navigation.ts web/site/lib/auth-routing.ts web/site/components/shared/AppHeader.tsx web/site/components/shared/AppSidebar.tsx web/site/components/my_classes/ClassesHeader.tsx web/site/components/assignment_list/AssignmentListHeader.tsx web/site/tests/auth-routing.test.ts web/site/tests/layout-regression.test.ts web/site/tests/lecturer-role-ui.test.tsx
git commit -m "refactor(web): canonicalize lecturer UI role"
```

---

### Task 2: Lecturer Dashboard Ownership and Request State

**Files:**
- Modify: `web/site/app/api/dashboard/overview/route.ts`
- Modify: `web/site/services/supabase/dashboard.supabase.ts`
- Modify: `web/site/app/ui/dashboard/page.tsx`
- Modify: `web/site/app/ui/dashboard/type/dashboard.type.ts`
- Create: `web/site/tests/lecturer-dashboard.test.tsx`

**Interfaces:**
- Consumes: authenticated `CurrentUserPayload` and lecturer-owned class ids.
- Produces: `GET /api/dashboard/overview?range=<days>` with lecturer-scoped counts, chart data, activities, and an explicit retryable client state.

- [ ] **Step 1: Write failing dashboard ownership tests**

Test the service/query contract with one owned class and one foreign class, then assert the returned counts contain only owned data. Add a client test in jsdom that resolves an older range request after a newer one and expects the newer response to stay visible:

```ts
// @vitest-environment jsdom
it("does not let a stale range response replace the latest dashboard", async () => {
  render(<DashboardPage />);
  await userEvent.click(screen.getByRole("button", { name: /30 ngày/i }));
  resolveLatest({ totalAssignments: 3 });
  resolveOlder({ totalAssignments: 99 });
  expect(await screen.findByText("3")).toBeTruthy();
  expect(screen.queryByText("99")).toBeNull();
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
cd web/site
npm test -- --run tests/lecturer-dashboard.test.tsx
```

Expected: the stale request test or foreign-data exclusion test fails against the current implementation.

- [ ] **Step 3: Implement ownership-scoped aggregation and stale-request protection**

Resolve the actor once in the API route. For lecturers, derive class and assignment scope from `lecturer_id = actor.userId` before counting submissions or students. In the page, use `AbortController` or a monotonically increasing request id and ignore results that are not from the latest request. Preserve explicit loading, empty, error, and retry rendering.

- [ ] **Step 4: Verify GREEN and commit**

Run the new test plus `tests/rbac.test.ts`, then commit only the listed files:

```bash
git commit -m "fix(web): scope lecturer dashboard data"
```

---

### Task 3: Owned-Class and Membership Workflow

**Files:**
- Modify: `web/site/app/ui/my_classes/page.tsx`
- Modify: `web/site/components/my_classes/AddClassCard.tsx`
- Modify: `web/site/components/my_classes/EditClassDialog.tsx`
- Modify: `web/site/components/my_classes/ClassDetailDialog.tsx`
- Modify: `web/site/components/my_classes/AddStudentDialog.tsx`
- Modify: `web/site/app/api/classes/route.ts`
- Modify: `web/site/app/api/classes/[id]/route.ts`
- Modify: `web/site/app/api/classes/[id]/students/route.ts`
- Modify: `web/site/app/api/classes/[id]/students/[studentId]/route.ts`
- Modify: `web/site/services/supabase/web-mvp.supabase.ts`
- Test: `web/site/tests/class-detail-route.test.ts`
- Test: `web/site/tests/class-detail-security.test.ts`
- Create: `web/site/tests/lecturer-class-flow.test.tsx`

**Interfaces:**
- Consumes: active lecturer actor; class id and student id UUIDs; existing `classService` methods.
- Produces: mutation state keyed by action/target, ownership-safe class DTOs, and visible success/error feedback.

- [ ] **Step 1: Write failing interaction tests**

Cover create, update, delete-confirmation cancellation, repeated-click prevention, and membership refresh. The delete test must prove only one request is emitted while pending:

```ts
it("sends one class deletion while the action is pending", async () => {
  render(<MyClassesPage />);
  await userEvent.click(await screen.findByRole("button", { name: /xóa lớp/i }));
  await userEvent.click(screen.getByRole("button", { name: /xác nhận xóa/i }));
  await userEvent.click(screen.getByRole("button", { name: /xác nhận xóa/i }));
  expect(deleteRequests()).toHaveLength(1);
});
```

Add service tests proving a lecturer cannot read or mutate a foreign class and cannot add/remove membership through a class they do not own.

- [ ] **Step 2: Verify RED**

Run:

```bash
cd web/site
npm test -- --run tests/class-detail-route.test.ts tests/class-detail-security.test.ts tests/lecturer-class-flow.test.tsx
```

Expected: missing keyed mutation state/feedback or a missing ownership assertion causes failure.

- [ ] **Step 3: Implement the minimal class-flow corrections**

Use a single `mutation: { kind: "create" | "update" | "delete" | "member"; targetId?: string } | null` state. Disable only the active action, preserve form values after errors, show a consistent success notice, and refetch the affected class after membership changes. Ensure service queries constrain `classes.lecturer_id` before related membership operations.

- [ ] **Step 4: Verify GREEN and commit**

Run the focused tests and commit:

```bash
git commit -m "fix(web): complete lecturer class workflow"
```

---

### Task 4: Canonical Assignment Lifecycle

**Files:**
- Modify: `web/site/app/ui/create_assignment/page.tsx`
- Modify: `web/site/app/ui/server_config/create_assignment/page.tsx`
- Create: `web/site/components/assignments/AssignmentFormPage.tsx`
- Modify: `web/site/app/ui/assignment_list/page.tsx`
- Modify: `web/site/components/assignment_list/AssignmentEditDialog.tsx`
- Modify: `web/site/components/assignment_list/AssignmentTable.tsx`
- Modify: `web/site/app/api/assignments/route.ts`
- Modify: `web/site/app/api/assignments/[id]/route.ts`
- Modify: `web/site/app/api/assignments/[id]/runner-config/route.ts`
- Modify: `web/site/app/api/assignments/[id]/ui-baselines/route.ts`
- Modify: `web/site/services/supabase/web-mvp.supabase.ts`
- Test: `web/site/tests/assignment-route-security.test.ts`
- Test: `web/site/tests/assignment-runner-route.test.ts`
- Create: `web/site/tests/lecturer-assignment-flow.test.tsx`

**Interfaces:**
- Consumes: lecturer-owned class choices and validated `FormData` assignment input.
- Produces: one canonical create page, lifecycle-safe create/update/delete APIs, and stable list refresh behavior.

- [ ] **Step 1: Write failing canonical-route and lifecycle tests**

The architecture test must prove `/ui/create_assignment` contains the real lecturer-facing composition or imports a role-neutral form module, while the legacy server-config URL redirects to the canonical route. Interaction tests cover retained form state after 4xx, invalid date order, rubric total validation, draft creation, publish creation, edit, delete, and double-click prevention.

```ts
it("rejects an assignment whose due date is not after its start", async () => {
  const response = await POST(assignmentRequest({
    startAt: "2026-09-20T10:00:00.000Z",
    dueAt: "2026-09-20T09:00:00.000Z",
  }));
  expect(response.status).toBe(400);
  expect((await response.json()).message).toMatch(/hạn nộp/i);
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
cd web/site
npm test -- --run tests/assignment-route-security.test.ts tests/assignment-runner-route.test.ts tests/lecturer-assignment-flow.test.tsx
```

Expected: the legacy route/canonical form assertion or one lifecycle validation fails.

- [ ] **Step 3: Extract a role-neutral assignment form and enforce lifecycle validation**

Move the reusable client implementation to `components/assignments/AssignmentFormPage.tsx`. Render it from `/ui/create_assignment`; make `/ui/server_config/create_assignment` redirect to `/ui/create_assignment`. Validate owned class, dates, score, rubric, files, runner configuration, and status at the API/service boundary. Use one pending state per mutation and preserve values on failure.

- [ ] **Step 4: Verify GREEN and commit**

Run focused assignment tests plus `tests/grading-boundaries-migration.test.ts`, then commit:

```bash
git commit -m "fix(web): complete lecturer assignment lifecycle"
```

---

### Task 5: Submission Review and Grading State Machine

**Files:**
- Modify: `web/site/app/ui/grading_detail/hook/use_Grading_detail.ts`
- Modify: `web/site/app/ui/grading_detail/type/grading_detail.api.ts`
- Modify: `web/site/app/ui/grading_detail/type/grading_detail.unit.ts`
- Modify: `web/site/components/grading_detail/GradingHeader.tsx`
- Modify: `web/site/components/grading_detail/GradingSidebar.tsx`
- Modify: `web/site/components/grading_detail/StudentDetailPanel.tsx`
- Modify: `web/site/components/grading_detail/ScoreEditorCard.tsx`
- Modify: `web/site/services/supabase/grading.supabase.ts`
- Test: `web/site/tests/grading-service-security.test.ts`
- Test: `web/site/tests/grading.test.ts`
- Test: `web/site/tests/ai-grading-v2.test.ts`
- Create: `web/site/tests/lecturer-grading-flow.test.tsx`

**Interfaces:**
- Consumes: lecturer-owned assignment/submission data and `normalizeAssignmentRubric()`.
- Produces: deterministic grading selection state, validated `gradePayload()`, and mutually exclusive AI/save/publish mutations.

- [ ] **Step 1: Write failing grading interaction tests**

Cover no-assignment, no-submission, stale selection, invalid criterion score, total over max, AI suggestion application, draft save, publish confirmation, post-publish lock, and repeat-click prevention:

```ts
it("never publishes twice while the first publish is pending", async () => {
  render(<GradingDetailPage />);
  await selectSubmittedStudent();
  await userEvent.click(screen.getByRole("button", { name: /công bố điểm/i }));
  await userEvent.click(screen.getByRole("button", { name: /xác nhận công bố/i }));
  await userEvent.click(screen.getByRole("button", { name: /xác nhận công bố/i }));
  expect(publishRequests()).toHaveLength(1);
});
```

Service tests assert foreign-lecturer denial for list/detail/file/history/AI/draft/publish and assert a published grade cannot be written through the draft path.

- [ ] **Step 2: Verify RED**

Run:

```bash
cd web/site
npm test -- --run tests/grading-service-security.test.ts tests/grading.test.ts tests/ai-grading-v2.test.ts tests/lecturer-grading-flow.test.tsx
```

Expected: at least one client state-machine or validation assertion fails before production changes.

- [ ] **Step 3: Implement the minimal grading state machine**

Represent mutations as `"ai" | "save" | "publish" | null`, cancel or ignore stale assignment/detail requests, validate every criterion against its maximum and final total against assignment maximum before calling the API, and require explicit publish confirmation. Keep AI suggestions in a separate field until the lecturer applies a criterion. Lock draft and AI actions after publication.

- [ ] **Step 4: Verify GREEN and commit**

Run the focused grading suite and commit:

```bash
git commit -m "fix(web): harden lecturer grading workflow"
```

---

### Task 6: Lecturer UI Feedback and Accessibility Audit

**Files:**
- Modify only affected lecturer components under `web/site/components/dashboard/**`, `web/site/components/my_classes/**`, `web/site/components/assignment_list/**`, and `web/site/components/grading_detail/**`
- Modify only affected lecturer pages under `web/site/app/ui/**`
- Create: `web/site/tests/lecturer-interaction-regression.test.tsx`

**Interfaces:**
- Consumes: final page/component surface from Tasks 1–5.
- Produces: no dead interactive controls, consistent accessible labels, and visible loading/empty/error/success states.

- [ ] **Step 1: Write failing rendered interaction regression tests**

Render the affected real lecturer components and exercise retry, close, delete, save-draft, and publish controls. Assert each action changes visible state, calls its real callback once, or exposes an accessible disabled reason. Do not assert source text or mocked markup. Use a one-time `rg` audit to locate placeholder links, empty handlers, and raw `alert()` usage before choosing the failing behavior cases:

```bash
rg -n 'href=["'"']#["'"']|javascript:void|onClick=\{\(\) => \{\s*\}\}|window\.alert\s*\(' web/site/app/ui web/site/components
```

- [ ] **Step 2: Verify RED**

Run:

```bash
cd web/site
npm test -- --run tests/lecturer-interaction-regression.test.tsx tests/lecturer-class-flow.test.tsx tests/lecturer-assignment-flow.test.tsx tests/lecturer-grading-flow.test.tsx
```

Expected: the test identifies concrete lecturer controls lacking the required interaction contract.

- [ ] **Step 3: Correct only evidence-backed interaction defects**

Add accessible names, `type="button"` where needed, pending labels, disabled reasons, consistent inline notice/error components, and explicit empty-state calls to action. Do not redesign unrelated Student or Admin screens.

- [ ] **Step 4: Verify GREEN and commit**

Run the interaction tests and commit:

```bash
git commit -m "fix(web): improve lecturer interaction feedback"
```

---

### Task 7: Full Verification, Live Boundary Audit, and Delivery

**Files:**
- Modify: `web/site/DEPLOYMENT.md` only if lecturer-specific deployment configuration is discovered.
- Create migration under `web/site/supabase/migrations/` only if live-schema evidence proves it necessary.

**Interfaces:**
- Consumes: all completed lecturer tasks.
- Produces: verified branch with reproducible evidence and no Android changes.

- [ ] **Step 1: Run the focused lecturer suite**

Run:

```bash
cd web/site
npm test -- --run tests/auth-routing.test.ts tests/layout-regression.test.ts tests/lecturer-role-ui.test.tsx tests/lecturer-dashboard.test.tsx tests/class-detail-route.test.ts tests/class-detail-security.test.ts tests/lecturer-class-flow.test.tsx tests/assignment-route-security.test.ts tests/assignment-runner-route.test.ts tests/lecturer-assignment-flow.test.tsx tests/grading-service-security.test.ts tests/grading.test.ts tests/ai-grading-v2.test.ts tests/lecturer-grading-flow.test.tsx tests/lecturer-interaction-regression.test.tsx
```

Expected: all focused files pass with zero failed tests.

- [ ] **Step 2: Run every Web quality gate**

Run:

```bash
cd web/site
npm test -- --run --reporter=dot
npm run lint
npm run type-check
npm run build
```

Expected: tests, TypeScript, and build pass; lint has zero errors.

- [ ] **Step 3: Run repository safety checks**

Run:

```bash
git diff --check
git status --short
git diff --name-only origin/main...HEAD
git ls-files | rg '(^|/)\.env($|\.)|private.*key|service.*role'
rg -n "SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^[:space:]$<{]" . --glob '!node_modules' --glob '!.git' --glob '!*.md'
```

Expected: no secret value, no Android path, and only intended Web/docs/Supabase files.

- [ ] **Step 4: Verify the lecturer journey in a browser**

Use the existing lecturer test account through the secure browser authentication mechanism. Verify:

```text
sign in -> dashboard -> create/edit class -> inspect members -> create draft assignment
-> publish assignment -> open submissions -> inspect file -> request AI suggestion
-> edit score -> save draft -> publish -> view history
```

Record each unavailable external dependency as blocked rather than fabricating a pass.

- [ ] **Step 5: Audit live Supabase only if a failing flow points to the database**

Inspect table columns, RLS policies, function ACLs, and Storage policies involved in that failure. If a migration is necessary, add a regression test, prepare exact additive SQL, obtain the required live-change authorization, apply it, and run post-apply queries.

- [ ] **Step 6: Review commits and hand off integration**

Fetch `origin/main`, merge normally if it moved, rerun affected gates, and report branch name, commits, test counts, live verification, deployment status, and remaining external configuration. Never force-push.
