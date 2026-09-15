import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
    resolve(process.cwd(), "supabase/migrations/20260915062702_preserve_student_draft_assets.sql"),
    "utf8"
);

describe("student draft asset preservation migration", () => {
    it("reuses only the authenticated student's current draft assets", () => {
        expect(migration).toContain("s.student_id = auth.uid()");
        expect(migration).toContain("current_submission.status = 'draft'");
        expect(migration).toContain("stored_files := COALESCE(current_submission.files");
        expect(migration).toContain("source_zip_path := current_submission.source_zip_url");
    });

    it("keeps the privileged function locked down", () => {
        expect(migration).toContain("SECURITY DEFINER");
        expect(migration).toContain("SET search_path = ''");
        expect(migration).toContain("REVOKE ALL ON FUNCTION public.save_student_submission");
        expect(migration).toContain("FROM PUBLIC, anon");
        expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.save_student_submission");
        expect(migration).toContain("TO authenticated");
    });
});
