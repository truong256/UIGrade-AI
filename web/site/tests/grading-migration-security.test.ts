import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(
    process.cwd(),
    "supabase/migrations/20260908000001_complete_grading_workflow.sql"
), "utf8");

describe("grading migration security contract", () => {
    it("does not drop grading tables or application rows", () => {
        expect(migration).not.toMatch(/DROP\s+TABLE/i);
        expect(migration).not.toMatch(/DELETE\s+FROM\s+public\.(grades|submissions|assignments)/i);
    });

    it("copies legacy published and draft grading data before clearing old columns", () => {
        const copyPosition = migration.indexOf("INSERT INTO public.grades");
        const clearPosition = migration.indexOf("UPDATE public.submissions\nSET score = NULL");
        expect(copyPosition).toBeGreaterThan(-1);
        expect(clearPosition).toBeGreaterThan(copyPosition);
        expect(migration).toContain("THEN 'published' ELSE 'draft' END");
        expect(migration).toContain("NULLIF(BTRIM(COALESCE(s.teacher_feedback, '')), '') IS NOT NULL");
        expect(migration).toContain("rubric_breakdown = CASE");
    });

    it("enables RLS and limits student grade reads to own published results", () => {
        expect(migration).toContain("ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY");
        expect(migration).toMatch(
            /s\.student_id\s*=\s*auth\.uid\(\)[\s\S]{0,120}public\.is_active_student\(\)[\s\S]{0,120}grades\.status\s*=\s*'published'/i
        );
        expect(migration).not.toMatch(/ON public\.grades[\s\S]{0,100}USING\s*\(true\)/i);
    });

    it("requires active profiles in grading, rubric, and storage policies", () => {
        expect(migration).toContain("CREATE OR REPLACE FUNCTION public.is_active_user()");
        expect(migration).toMatch(
            /CREATE OR REPLACE FUNCTION public\.is_lecturer\(\)[\s\S]{0,500}status = 'active'/i
        );
        expect(migration).toContain("public.is_active_student() AND (storage.foldername(name))[1]");
    });

    it("limits writes to the owning active lecturer and excludes admin mutation", () => {
        expect(migration).toContain("assignment_row.lecturer_id IS DISTINCT FROM auth.uid()");
        expect(migration).toContain("Only an active lecturer can grade submissions");
        const insertPolicy = migration.split('CREATE POLICY "Assignment lecturers can insert grades"')[1]
            ?.split('CREATE POLICY "Assignment lecturers can update grades"')[0] || "";
        const updatePolicy = migration.split('CREATE POLICY "Assignment lecturers can update grades"')[1]
            ?.split('DROP POLICY IF EXISTS "Grade history visible')[0] || "";
        expect(insertPolicy).not.toContain("public.is_admin()");
        expect(updatePolicy).not.toContain("public.is_admin()");
    });

    it("enforces a unique current result and score constraints", () => {
        expect(migration).toContain("grades_one_result_per_submission");
        expect(migration).toContain("score >= 0 AND max_score > 0 AND score <= max_score");
        expect(migration).toContain("Every rubric criterion requires a score before publishing");
    });

    it("protects draft fields even through the legacy submissions table", () => {
        expect(migration).toContain("protect_submission_grading_columns");
        expect(migration).toContain("NEW.ai_feedback := NULL");
        expect(migration).toContain("NEW.teacher_feedback := NULL");
        expect(migration).toContain("Submission grading fields are server-managed");
    });

    it("records audit and sends a notification only for publish changes", () => {
        expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.grading_history");
        expect(migration).toContain("GRADE_DRAFT_SAVED");
        expect(migration).toContain("GRADE_REPUBLISHED");
        expect(migration).toContain("INSERT INTO public.notifications");
        expect(migration).toContain("NEW.status = 'published'");
    });

    it("prevents reverting a published grade to draft", () => {
        expect(migration).toContain("A published grade cannot be changed back to draft");
    });
});
