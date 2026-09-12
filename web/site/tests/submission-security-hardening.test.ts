import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { extractAssignmentPayload } from "@/validations/assignment.validation";
import {
    MAX_SUBMISSION_ATTEMPTS,
    MAX_SUBMISSION_FILE_SIZE_MB,
} from "@/lib/submission-limits";

const migration = readFileSync(
    resolve(process.cwd(), "supabase/migrations/20260911000001_harden_submission_and_profile_privacy.sql"),
    "utf8"
);
const service = readFileSync(
    resolve(process.cwd(), "services/supabase/web-mvp.supabase.ts"),
    "utf8"
);
const assignmentEditor = readFileSync(
    resolve(process.cwd(), "app/ui/server_config/create_assignment/page.tsx"),
    "utf8"
);

function assignmentForm(policy: Record<string, unknown>) {
    const form = new FormData();
    form.set("title", "Bài tập an toàn");
    form.set("classroomId", "00000000-0000-4000-8000-000000000001");
    form.set("description", "Mô tả bài tập");
    form.set("rubric", JSON.stringify([{ code: "R1", title: "Đúng", maxPoints: 10 }]));
    form.set("submissionPolicy", JSON.stringify(policy));
    form.set("startAt", "2026-09-11T00:00:00.000Z");
    form.set("dueAt", "2026-09-12T00:00:00.000Z");
    form.set("maxScore", "10");
    return form;
}

describe("submission and profile hardening", () => {
    it("is non-destructive", () => {
        expect(migration).not.toMatch(/DROP\s+TABLE|TRUNCATE|DELETE\s+FROM/i);
    });

    it("removes direct student submission mutations in favor of the RPC", () => {
        expect(migration).toContain('DROP POLICY IF EXISTS "Active students can insert own submissions"');
        expect(migration).toContain('DROP POLICY IF EXISTS "Active students can update own editable submissions"');
        expect(migration).not.toMatch(/CREATE POLICY[\s\S]{0,120}public\.submissions FOR (INSERT|UPDATE)[\s\S]{0,160}is_active_student/i);
        expect(migration).toContain("CREATE OR REPLACE FUNCTION public.save_student_submission");
        expect(migration).not.toMatch(/input_student_id/i);
    });

    it("enforces attempts, keeps history, and validates storage ownership", () => {
        expect(migration).toContain("current_submission.attempt_no >= policy_max_attempts");
        expect(migration).toContain("SET is_current = FALSE");
        expect(migration).toContain("current_submission.attempt_no + 1");
        expect(migration).toContain("LEFT(COALESCE(item->>'path', ''), LENGTH(object_prefix)) <> object_prefix");
        expect(migration).toContain("input_source_zip_url !~* '\\.zip$'");
        expect(migration).toContain("FROM storage.objects stored_object");
        expect(migration).toContain("stored_object.metadata->>'size'");
        expect(migration).toContain("policy_accepted_file_types");
        expect(migration).toContain("Preserve its\n            -- original timestamp");
        expect(migration).toContain("OLD.is_current IS TRUE");
        expect(migration).toContain("NEW.is_current IS FALSE");
    });

    it("prevents students from deleting submitted or historical evidence", () => {
        const deletePolicy = migration.split(
            'CREATE POLICY "Students clean orphan or draft submission files"'
        )[1] || "";
        expect(deletePolicy).toContain("NOT EXISTS");
        expect(deletePolicy).toContain("s.is_current");
        expect(deletePolicy).toContain("s.status = 'draft'");
        expect(deletePolicy).not.toContain("s.status IN ('draft', 'pending', 'error')");
    });

    it("scopes assignment storage writes and cleans partial uploads", () => {
        expect(migration).toContain('CREATE POLICY "Lecturers upload assignment files to own folder"');
        expect(migration).toContain("(storage.foldername(name))[1] = auth.uid()::TEXT");
        expect(migration).toContain('CREATE POLICY "Assignment owners or admins delete assignment files"');
        expect(service).toContain("validateAssignmentFileGroups(fileGroups)");
        expect(service).toContain("await cleanAssignmentUploads(db, attachments)");
        expect(service).toContain("await cleanAssignmentUploads(db, newAttachments)");
        expect(service).toContain("retainedFileCount + files.length > ASSIGNMENT_FILE_LIMIT");
        expect(service).toContain("validateAssignmentFileGroups(fileGroups, retainedAttachments.length)");
        expect(service).toContain('{ ...attachment, path: item.path }');
    });

    it("does not expose classmate profile PII", () => {
        const profilePolicy = migration.split(
            'CREATE POLICY "Profiles visible only through required relationships"'
        )[1]?.split("-- Core submission writes")[0] || "";
        expect(profilePolicy).toContain("c.lecturer_id = profiles.id");
        expect(profilePolicy).not.toContain("theirs.student_id = profiles.id");
    });

    it("validates assignment policy before uploading and restores draft notes", () => {
        const saveMethod = service.split("async save(actor:")[1] || "";
        expect(saveMethod.indexOf('.from("assignments")')).toBeLessThan(saveMethod.indexOf('.storage.from("submissions").upload'));
        expect(service).toContain("validateSubmissionAssets(payload, files, record(assignment))");
        expect(service).toContain('note: String(sub.content || "")');
        expect(service).not.toContain("uploaded[0]?.path || null");
    });

    it("keeps assignment attempt and file limits aligned with storage and the RPC", () => {
        expect(assignmentEditor).toContain("maxFileSizeMb: MAX_SUBMISSION_FILE_SIZE_MB");
        expect(assignmentEditor).toContain("maxAttempts: form.allowResubmit ? MAX_SUBMISSION_ATTEMPTS : 1");
        expect(migration).toContain("LEAST(max_attempts_text::INTEGER, 100)");
        expect(migration).toContain("CONSTRAINT submissions_attempt_no_range");

        expect(() => extractAssignmentPayload(assignmentForm({
            acceptedFileTypes: ["zip"], maxFileSizeMb: 101, maxAttempts: 1,
            requireZip: true, allowGithubUrl: false, allowScreenshots: true,
        }))).toThrow();
        expect(extractAssignmentPayload(assignmentForm({
            acceptedFileTypes: ["zip"], maxFileSizeMb: MAX_SUBMISSION_FILE_SIZE_MB, maxAttempts: MAX_SUBMISSION_ATTEMPTS,
            requireZip: true, allowGithubUrl: false, allowScreenshots: true,
        })).submissionPolicy.maxAttempts).toBe(MAX_SUBMISSION_ATTEMPTS);
    });

    it("classifies malformed assignment JSON as a validation error", () => {
        const form = assignmentForm({
            acceptedFileTypes: ["zip"], maxFileSizeMb: 100, maxAttempts: 1,
            requireZip: true, allowGithubUrl: false, allowScreenshots: true,
        });
        form.set("submissionPolicy", "{not-json");
        expect(() => extractAssignmentPayload(form)).toThrowError(/không đúng định dạng JSON/);
    });
});
