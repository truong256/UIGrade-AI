// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(
    process.cwd(),
    "supabase/migrations/20260910000002_isolate_ai_grading_suggestions.sql"
), "utf8");
const gradingService = readFileSync(resolve(
    process.cwd(),
    "services/supabase/grading.supabase.ts"
), "utf8");

describe("AI grading isolation migration", () => {
    it("does not drop tables or delete/truncate application rows", () => {
        expect(migration).not.toMatch(/DROP\s+TABLE/i);
        expect(migration).not.toMatch(/DELETE\s+FROM/i);
        expect(migration).not.toMatch(/TRUNCATE/i);
    });

    it("copies legacy AI feedback before clearing the student-readable column", () => {
        const backfill = migration.indexOf("INSERT INTO public.ai_grading_suggestions");
        const clearLegacy = migration.indexOf("UPDATE public.grades SET ai_feedback = NULL");
        expect(backfill).toBeGreaterThan(-1);
        expect(clearLegacy).toBeGreaterThan(backfill);
        expect(migration).toContain("ON CONFLICT (submission_id) DO UPDATE");
    });

    it("enables RLS without granting students access", () => {
        expect(migration).toContain("ALTER TABLE public.ai_grading_suggestions ENABLE ROW LEVEL SECURITY");
        expect(migration).toContain("AI suggestions visible to owner lecturer and admin");
        expect(migration).toContain("Owning lecturers insert AI suggestions");
        expect(migration).toContain("Owning lecturers update AI suggestions");
        expect(migration).not.toMatch(/CREATE POLICY\s+"[^"]*[Ss]tudent[^"]*"\s+ON public\.ai_grading_suggestions/);
    });

    it("locks ownership and prevents mutation after official publication", () => {
        expect(migration).toContain("AI suggestion actor must be the authenticated lecturer");
        expect(migration).toContain("Lecturer does not own this submission");
        expect(migration).toContain("g.status = 'published'");
        expect(migration).toContain("AI suggestion is immutable after grade publication");
    });

    it("rejects future writes to the legacy grade AI column", () => {
        expect(migration).toContain("Store AI output in ai_grading_suggestions, not grades");
        expect(migration).toContain("trg_reject_legacy_grade_ai_feedback");
        expect(gradingService).toContain('from("ai_grading_suggestions").upsert');
        expect(gradingService).not.toContain('from("grades").update({ ai_feedback');
    });
});
