// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
    resolve(process.cwd(), "supabase/migrations/20260909000001_mvp_security_lockdown.sql"),
    "utf8"
);

describe("Sprint A security migration", () => {
    it("is additive and does not destroy application data", () => {
        expect(migration).not.toMatch(/DROP\s+TABLE/i);
        expect(migration).not.toMatch(/DELETE\s+FROM/i);
        expect(migration).not.toMatch(/TRUNCATE/i);
    });

    it("enables RLS for all protected core tables", () => {
        for (const table of [
            "classes",
            "class_members",
            "assignments",
            "submissions",
            "grades",
        ]) {
            expect(migration).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`);
        }
        expect(migration).toContain("cm.status = 'active'");
        expect(migration).toContain("public.is_active_user()");
    });

    it("removes direct member insertion and exposes only the transactional join RPC", () => {
        expect(migration).toContain(
            'DROP POLICY IF EXISTS "Students can join class for themselves" ON public.class_members'
        );
        expect(migration).not.toMatch(/CREATE POLICY[\s\S]{0,100}ON public\.class_members FOR INSERT/i);
        expect(migration).toContain("CREATE OR REPLACE FUNCTION public.join_class_by_code");
        expect(migration).toContain("p.role = 'student'");
        expect(migration).toContain("p.status = 'active'");
        expect(migration).toContain("FOR UPDATE");
        expect(migration).toContain("'membershipStatus', 'pending'");
        expect(migration).toContain("membership.status = 'active'");
        expect(migration).toContain("membership.status IN ('pending', 'invited')");
    });

    it("relies on the existing unique membership constraint for concurrent joins", () => {
        const initial = readFileSync(
            resolve(process.cwd(), "supabase/migrations/20260828000001_initial_schema.sql"),
            "utf8"
        );
        expect(initial).toContain("CONSTRAINT unique_class_student UNIQUE (class_id, student_id)");
        expect(migration).toMatch(/FROM public\.classes c[\s\S]{0,180}FOR UPDATE/i);
    });

    it("keeps admin mutations out of assignment and grading write policies", () => {
        const assignmentWrites = migration.split(
            'CREATE POLICY "Owning lecturers can insert assignments"'
        )[1]?.split("-- Submission reads/writes")[0] || "";
        const gradeWrites = migration.split(
            'CREATE POLICY "Owning lecturers can insert grades"'
        )[1]?.split("-- Rubric access")[0] || "";
        expect(assignmentWrites).not.toContain("public.is_admin()");
        expect(gradeWrites).not.toContain("public.is_admin()");
    });

    it("adds safe positive/range constraints after normalizing legacy values", () => {
        expect(migration).toContain("SET weight = 1 WHERE weight IS NOT NULL AND weight <= 0");
        expect(migration).toContain("CHECK (weight IS NULL OR weight > 0)");
        expect(migration).toContain(
            "CHECK (late_penalty_percent IS NULL OR late_penalty_percent BETWEEN 0 AND 100)"
        );
        expect(migration).toContain("CHECK (max_score > 0)");
    });
});
