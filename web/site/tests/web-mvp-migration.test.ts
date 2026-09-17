// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260909000002_complete_web_mvp.sql"), "utf8");

describe("Web MVP Supabase migration", () => {
    it("preserves tables and application rows", () => {
        expect(migration).not.toMatch(/DROP\s+TABLE/i);
        expect(migration).not.toMatch(/DELETE\s+FROM/i);
        expect(migration).not.toMatch(/TRUNCATE/i);
    });

    it("uses only canonical production roles", () => {
        expect(migration).toContain("UPDATE public.profiles SET role = 'lecturer' WHERE role = 'teacher'");
        expect(migration).toContain("CHECK (role IN ('student', 'lecturer', 'admin', 'pending'))");
        expect(migration).toContain("role IN ('student', 'lecturer', 'pending')");
    });

    it("prevents concurrent duplicate current submissions", () => {
        expect(migration).toContain("submissions_one_current_per_student_assignment");
        expect(migration).toContain("WHERE is_current");
        expect(migration).toContain("FOR UPDATE OF a");
        expect(migration).toContain("auth.uid()");
        expect(migration).not.toMatch(/input_student_id/i);
    });

    it("keeps draft submissions private from lecturers and grades private until publish", () => {
        expect(migration).toContain("submissions.status <> 'draft'");
        expect(migration).toContain("NEW.status := CASE WHEN NEW.status = 'draft'");
        expect(migration).toContain("A published grade locks this submission");
    });

    it("keeps submission storage private and relationship-scoped", () => {
        expect(migration).toContain("UPDATE storage.buckets SET public = FALSE WHERE id = 'submissions'");
        expect(migration).toContain("(storage.foldername(name))[1] = auth.uid()::TEXT");
        expect(migration).toContain("a.lecturer_id = auth.uid()");
        expect(migration).toContain("cm.status = 'active'");
    });
});
