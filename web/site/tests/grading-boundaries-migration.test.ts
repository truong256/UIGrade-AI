import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(
    process.cwd(),
    "supabase/migrations/20260910000001_harden_grading_boundaries.sql"
), "utf8");

describe("grading boundary migration", () => {
    it("does not delete tables or application rows", () => {
        expect(migration).not.toMatch(/DROP\s+TABLE/i);
        expect(migration).not.toMatch(/DELETE\s+FROM/i);
        expect(migration).not.toMatch(/TRUNCATE/i);
    });

    it("keeps published AI feedback immutable", () => {
        expect(migration).toContain("OLD.status = 'published'");
        expect(migration).toContain("NEW.ai_feedback IS DISTINCT FROM OLD.ai_feedback");
        expect(migration).toContain("AI feedback on a published grade is immutable");
    });

    it("blocks student changes after any grading record exists", () => {
        expect(migration).toContain("actor_role = 'student'");
        expect(migration).toContain("FROM public.grades g WHERE g.submission_id = OLD.id");
        expect(migration).toContain("Grading has started; this submission can no longer be changed");
        expect(migration).not.toContain("NEW.content IS DISTINCT FROM OLD.content");
    });

    it("locks rubric and maximum score after grading starts", () => {
        expect(migration).toContain("NEW.max_score IS DISTINCT FROM OLD.max_score");
        expect(migration).toContain("NEW.rubric IS DISTINCT FROM OLD.rubric");
        expect(migration).toContain("JOIN public.grades g ON g.submission_id = s.id");
    });
});
