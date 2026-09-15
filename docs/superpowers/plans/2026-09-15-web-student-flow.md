# Web Student Flow Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện và kiểm thử toàn bộ luồng sinh viên Web từ dashboard/lớp học đến nộp bài và xem kết quả.

**Architecture:** Giữ nguyên Next.js App Router và Supabase services. Sửa tại biên UI/API DTO, dùng query parameter để duy trì ngữ cảnh bài tập, dùng ref làm khóa mutation tức thời và đặt validation client cạnh hook nộp bài; RLS/API tiếp tục là biên bảo mật cuối cùng.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase SSR, Vitest, Testing Library, ESLint.

**Spec:** `docs/superpowers/specs/2026-09-15-web-student-flow-design.md`

## Global Constraints

- Chỉ sửa `web/site` và tài liệu trong `docs/superpowers`; không sửa Android.
- Không thêm service-role key, secret hoặc dữ liệu mock vào production UI.
- Role UI sinh viên duy nhất là `student`; không khôi phục alias `User`.
- Mỗi thay đổi hành vi phải có test thất bại đúng nguyên nhân trước khi sửa production code.
- Không để nút tương tác không có phản hồi; chống gửi lặp cho mọi mutation được sửa.

---

### Task 1: Student role and assignment navigation

**Files:**
- Create: `web/site/tests/student-role-and-navigation.test.tsx`
- Modify: `web/site/services/supabase/web-mvp.supabase.ts`
- Modify: `web/site/components/assignment_list/AssignmentDetailDialog.tsx`
- Modify: `web/site/app/ui/my_results/hook/use_my_results.ts`
- Modify: `web/site/app/ui/my_results/type/my_results.type.ts`

**Interfaces:**
- Consumes: `AssignmentItem.latestSubmission`, canonical `AuthUser.role`.
- Produces: `submissionId: string` on `ResultItem`; student CTA URLs carrying `assignmentId` or `submissionId`.

- [ ] **Step 1: Write failing navigation and role tests**

```tsx
expect(screen.getByRole("link", { name: "Đi tới nộp bài" }))
  .toHaveAttribute("href", "/ui/submit_assignment?assignmentId=assignment-1");
expect(screen.queryByRole("link", { name: "Xem kết quả chấm" })).not.toBeInTheDocument();
expect(source).not.toContain('["student", "User"]');
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --run tests/student-role-and-navigation.test.tsx`

Expected: FAIL because CTA URLs lose assignment context and legacy `User` is accepted.

- [ ] **Step 3: Implement minimal canonical navigation**

Use `URLSearchParams`-compatible links:

```tsx
href={`/ui/submit_assignment?assignmentId=${encodeURIComponent(item._id)}`}
href={`/ui/my_results?submissionId=${encodeURIComponent(item.latestSubmission._id)}`}
```

Extend the student assignment relation with the visible grade status/score, normalize a published grade as `gradeStatus: "published"`, and only render the result CTA for that value. Restrict `useMyResults` to `currentUser.role === "student"`.

- [ ] **Step 4: Run focused test and verify GREEN**

Run: `npm test -- --run tests/student-role-and-navigation.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add web/site/tests/student-role-and-navigation.test.tsx web/site/services/supabase/web-mvp.supabase.ts web/site/components/assignment_list/AssignmentDetailDialog.tsx web/site/app/ui/my_results
git commit -m "fix(web): correct student assignment navigation"
```

### Task 2: Student dashboard progress and class joining

**Files:**
- Create: `web/site/tests/student-dashboard-and-class.test.tsx`
- Modify: `web/site/app/api/dashboard/overview/route.ts`
- Modify: `web/site/app/ui/my_classes/page.tsx`
- Modify: `web/site/components/my_classes/JoinClassDialog.tsx`
- Modify: `web/site/components/my_classes/ClassesHeader.tsx`

**Interfaces:**
- Consumes: `latestSubmission.status`, `AuthUser.role`, `/api/classes/join`.
- Produces: progress derived by `isCompletedSubmission(status)` and one in-flight join request.

- [ ] **Step 1: Write failing dashboard and join tests**

```ts
expect(response.data.stats.completionRate.current).toBe(50);
expect(response.data.stats.needsAttention.current).toBe(1);
```

```tsx
fireEvent.submit(form);
fireEvent.submit(form);
expect(fetchMock).toHaveBeenCalledTimes(1);
```

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test -- --run tests/student-dashboard-and-class.test.tsx`

Expected: FAIL because draft is counted as completed and join can run twice.

- [ ] **Step 3: Implement progress semantics and join lock**

```ts
const isCompletedSubmission = (item: AssignmentDto) =>
  item.latestSubmission?.status === "submitted" || item.latestSubmission?.status === "late";
```

Use a `useRef(false)` lock in `JoinClassDialog`, validate trimmed code length at 64, disable close/cancel while loading, and expose the join button only when `role === "student"`.

- [ ] **Step 4: Run focused test and verify GREEN**

Run: `npm test -- --run tests/student-dashboard-and-class.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add web/site/tests/student-dashboard-and-class.test.tsx web/site/app/api/dashboard/overview/route.ts web/site/app/ui/my_classes/page.tsx web/site/components/my_classes/JoinClassDialog.tsx web/site/components/my_classes/ClassesHeader.tsx
git commit -m "fix(web): harden student dashboard and class joining"
```

### Task 3: Submission deep-link and client validation

**Files:**
- Create: `web/site/tests/student-submission-flow.test.tsx`
- Modify: `web/site/app/ui/submit_assignment/hook/use_submit_assignment.ts`
- Modify: `web/site/app/ui/submit_assignment/type/submit_assignment.utils.ts`
- Modify: `web/site/app/ui/submit_assignment/type/submit_assignment.type.ts`
- Modify: `web/site/components/submit_assignment/SubmissionForm.tsx`
- Modify: `web/site/components/submit_assignment/FileUploadBox.tsx`
- Modify: `web/site/components/submit_assignment/AssignmentSubmitPanel.tsx`

**Interfaces:**
- Consumes: URL `assignmentId`, selected assignment policy, selected file, repository input.
- Produces: `validateSubmissionInput(...) => string | null`; `blockedReason: string` for disabled submission state.

- [ ] **Step 1: Write failing validation/deep-link tests**

```ts
expect(validateSubmissionInput({ action: "submit", files: [], repositoryUrl: "" }))
  .toBe("Vui lòng tải tệp hoặc cung cấp repository trước khi nộp chính thức");
expect(validateSubmissionFile(new File(["x"], "notes.txt"))).toMatch(/APK hoặc ZIP/);
```

Render the hook page at `?assignmentId=assignment-2` and assert the second assignment is selected after loading.

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test -- --run tests/student-submission-flow.test.tsx`

Expected: FAIL because the validator and deep-link selection do not exist.

- [ ] **Step 3: Implement minimal validation and deep-link selection**

```ts
export const MAX_STUDENT_SUBMISSION_BYTES = 100 * 1024 * 1024;
export function validateRepositoryUrl(value: string): boolean {
  const url = new URL(value);
  return url.protocol === "https:" && ["github.com", "gitlab.com"].includes(url.hostname);
}
```

Catch `URL` parsing errors, reject non-APK/ZIP files, preserve form values on error and choose the requested assignment only when present in the authorized API response.

- [ ] **Step 4: Run focused test and verify GREEN**

Run: `npm test -- --run tests/student-submission-flow.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add web/site/tests/student-submission-flow.test.tsx web/site/app/ui/submit_assignment web/site/components/submit_assignment
git commit -m "fix(web): validate and target student submissions"
```

### Task 4: Submission mutation state and response safety

**Files:**
- Modify: `web/site/tests/student-submission-flow.test.tsx`
- Modify: `web/site/app/ui/submit_assignment/hook/use_submit_assignment.ts`
- Modify: `web/site/app/ui/submit_assignment/type/submit_assignment.api.ts`
- Modify: `web/site/components/submit_assignment/AlertMessages.tsx`

**Interfaces:**
- Consumes: `saveSubmission(input)` and refreshed assignment list.
- Produces: one active mutation (`draft` or `submit`), persistent success text and safe JSON error parsing.

- [ ] **Step 1: Add failing double-submit and non-JSON response tests**

```tsx
fireEvent.click(submitButton);
fireEvent.click(submitButton);
expect(saveSubmissionMock).toHaveBeenCalledTimes(1);
```

Assert a 502 text/empty response becomes the Vietnamese fallback instead of a JSON parse error.

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test -- --run tests/student-submission-flow.test.tsx`

- [ ] **Step 3: Add ref mutation lock and safe response parser**

Set the ref before any `await`, return immediately on a second mutation, clear it in `finally`, and parse response bodies with `.json().catch(() => ({}))`. Do not clear `success` inside the refresh invoked after a successful submit.

- [ ] **Step 4: Run focused test and verify GREEN**

Run: `npm test -- --run tests/student-submission-flow.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add web/site/tests/student-submission-flow.test.tsx web/site/app/ui/submit_assignment web/site/components/submit_assignment/AlertMessages.tsx
git commit -m "fix(web): serialize student submission mutations"
```

### Task 5: Published result fidelity and deep-link selection

**Files:**
- Create: `web/site/tests/student-results-flow.test.tsx`
- Modify: `web/site/services/supabase/grading.supabase.ts`
- Modify: `web/site/app/ui/my_results/type/my_results.type.ts`
- Modify: `web/site/app/ui/my_results/type/my_results.utils.ts`
- Modify: `web/site/app/ui/my_results/hook/use_my_results.ts`
- Modify: `web/site/components/my_results/ResultsFilters.tsx`
- Modify: `web/site/components/my_results/SubmissionInfoCard.tsx`

**Interfaces:**
- Consumes: Supabase `grades.ai_feedback`, URL `submissionId`.
- Produces: `ResultItem.submissionId`, published AI summary/strengths/next steps and selected deep-linked result.

- [ ] **Step 1: Write failing DTO and selection tests**

```ts
expect(normalizeResult(raw).submissionId).toBe("submission-2");
expect(normalizeResult(raw).aiSummary).toBe("Bố cục đúng yêu cầu");
```

Render at `?submissionId=submission-2` and assert the corresponding result card/detail is active.

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test -- --run tests/student-results-flow.test.tsx`

- [ ] **Step 3: Preserve published feedback and select deep-link**

Return `aiFeedback: grade.ai_feedback` and `submissionId` from the service DTO; map them in `normalizeResult`. Read the URL only on the client and fall back to the newest item if the ID is absent or unauthorized.

- [ ] **Step 4: Run focused test and verify GREEN**

Run: `npm test -- --run tests/student-results-flow.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add web/site/tests/student-results-flow.test.tsx web/site/services/supabase/grading.supabase.ts web/site/app/ui/my_results web/site/components/my_results
git commit -m "fix(web): preserve published student results"
```

### Task 6: Interaction accessibility and complete verification

**Files:**
- Create: `web/site/tests/student-interaction-regression.test.tsx`
- Modify: `web/site/components/submit_assignment/AlertMessages.tsx`
- Modify: `web/site/components/submit_assignment/AssignmentSelector.tsx`
- Modify: `web/site/components/submit_assignment/SubmissionForm.tsx`
- Modify: `web/site/components/submit_assignment/FileUploadBox.tsx`
- Modify: `web/site/components/my_classes/JoinClassDialog.tsx`
- Modify: `web/site/components/my_results/ResultsFilters.tsx`

**Interfaces:**
- Consumes: existing form props and mutation state.
- Produces: named controls, live regions and visible disabled reasons.

- [ ] **Step 1: Write failing accessibility tests**

Use `getByLabelText` for assignment, upload, repository, note, join code, result search/class/status filters; assert errors use `role="alert"`, success uses `role="status"`, and remove-file button has the file name in its accessible label.

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test -- --run tests/student-interaction-regression.test.tsx`

- [ ] **Step 3: Add IDs, labels, live regions and disabled explanation**

Use stable IDs such as `student-assignment`, `student-repository`, `student-note`, `student-file`, `student-join-code`, `student-result-search`, `student-result-class`, and `student-result-status`.

- [ ] **Step 4: Run all student tests**

Run: `npm test -- --run tests/student-*.test.tsx`

- [ ] **Step 5: Run complete verification**

```bash
npm test -- --run --reporter=dot
npm run lint
npm run type-check
npm run build
git diff --check
```

- [ ] **Step 6: Audit scope and secrets**

```bash
git diff --name-only main...HEAD
git diff main...HEAD -- web/site | rg 'SUPABASE_SERVICE_ROLE_KEY|service_role|sk-[A-Za-z0-9_-]{20,}'
```

Expected: only Web/spec/plan files; secret scan has no matches.

- [ ] **Step 7: Commit**

```bash
git add web/site/tests/student-interaction-regression.test.tsx web/site/components/submit_assignment web/site/components/my_classes/JoinClassDialog.tsx web/site/components/my_results/ResultsFilters.tsx
git commit -m "fix(web): improve student interaction feedback"
```
