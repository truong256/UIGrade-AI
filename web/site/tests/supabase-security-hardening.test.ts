import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
    resolve(
        process.cwd(),
        "supabase/migrations/20260914145110_harden_rpc_exposure.sql"
    ),
    "utf8"
);
const rlsOptimization = readFileSync(
    resolve(
        process.cwd(),
        "supabase/migrations/20260914150110_optimize_rls_initplan.sql"
    ),
    "utf8"
);

const internalHelpers = [
    "is_active_user()",
    "is_active_student()",
    "is_active_class_member(UUID)",
    "owns_class(UUID)",
    "can_read_class_members(UUID)",
    "is_admin()",
    "is_lecturer()",
    "is_lecturer_or_admin()",
];

describe("Supabase RPC exposure hardening", () => {
    it("is additive and preserves application data", () => {
        expect(migration).not.toMatch(/DROP\s+TABLE|TRUNCATE|DELETE\s+FROM/i);
        expect(migration).toContain("CREATE SCHEMA IF NOT EXISTS private");
    });

    it("moves policy-only helpers out of the exposed public schema", () => {
        for (const signature of internalHelpers) {
            expect(migration).toContain(
                `ALTER FUNCTION public.${signature} SET SCHEMA private`
            );
            expect(migration).toContain(
                `REVOKE ALL ON FUNCTION private.${signature} FROM PUBLIC, anon`
            );
            expect(migration).toContain(
                `GRANT EXECUTE ON FUNCTION private.${signature} TO authenticated`
            );
        }

        expect(migration).toContain("REVOKE ALL ON SCHEMA private FROM PUBLIC, anon");
        expect(migration).toContain("GRANT USAGE ON SCHEMA private TO authenticated");
        expect(migration).not.toMatch(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+public\.is_/i);
    });

    it("uses an empty search path and schema-qualified dependencies", () => {
        expect(migration.match(/SET search_path = ''/g)?.length).toBeGreaterThanOrEqual(10);
        expect(migration).toContain("private.is_active_student()");
        expect(migration).toContain("private.is_active_user()");
        expect(migration).toContain("private.is_admin()");
        expect(migration).toContain("private.is_lecturer()");
        expect(migration).not.toMatch(/role\s+IN\s*\([^)]*'teacher'/i);
    });

    it("keeps only the two intentional business RPCs exposed to signed-in users", () => {
        for (const signature of [
            "join_class_by_code(TEXT)",
            "save_student_submission(UUID, TEXT, TEXT, JSONB, TEXT, TEXT)",
        ]) {
            expect(migration).toContain(
                `REVOKE ALL ON FUNCTION public.${signature} FROM PUBLIC, anon`
            );
            expect(migration).toContain(
                `GRANT EXECUTE ON FUNCTION public.${signature} TO authenticated`
            );
        }
    });
});

describe("Supabase RLS policy optimization", () => {
    it("rewrites direct auth.uid calls as one init plan per statement", () => {
        expect(rlsOptimization).toContain("ALTER POLICY");
        expect(rlsOptimization).toContain("(select auth.uid())");
        expect(rlsOptimization).toContain("auth.uid()'");
        expect(rlsOptimization).toContain("'(select auth.uid())'");
        expect(rlsOptimization).not.toMatch(
            /USING\s*\(\s*true\s*\)|WITH\s+CHECK\s*\(\s*true\s*\)/i
        );
    });

    it("consolidates profile policies without widening role choices", () => {
        for (const policy of [
            "Admins can insert profiles",
            "Admins can select any profile",
            "Admins can update profiles",
        ]) {
            expect(rlsOptimization).toContain(`DROP POLICY IF EXISTS "${policy}"`);
        }
        expect(rlsOptimization).toContain(
            'ALTER POLICY "Users can insert own onboarding profile"'
        );
        expect(rlsOptimization).toContain(
            'ALTER POLICY "Users can update own profile or complete onboarding"'
        );
        expect(rlsOptimization).toContain("private.is_admin()");
        expect(rlsOptimization).not.toContain("'teacher'");
    });
});
