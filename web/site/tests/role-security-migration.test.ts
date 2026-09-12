import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const roleMigration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260903000001_fix_role_security_and_pending.sql"), "utf8");
const canonicalMigration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260909000002_complete_web_mvp.sql"), "utf8");
const educationMigration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260912000001_enforce_education_email_signup.sql"), "utf8");

describe("role security migration chain", () => {
    it("does not drop tables, truncate, or delete profile data", () => {
        expect(roleMigration).not.toMatch(/DROP\s+TABLE|TRUNCATE|DELETE\s+FROM/i);
        expect(canonicalMigration).not.toMatch(/DROP\s+TABLE|TRUNCATE|DELETE\s+FROM/i);
        expect(educationMigration).not.toMatch(/DROP\s+TABLE|TRUNCATE|DELETE\s+FROM/i);
    });

    it("keeps profile ids equal to auth user ids and avoids duplicates", () => {
        expect(roleMigration).toContain("INSERT INTO public.profiles");
        expect(roleMigration).toContain("NEW.id");
        expect(roleMigration).toContain("ON CONFLICT (id) DO UPDATE");
    });

    it("supports one pending onboarding transition to student or lecturer only", () => {
        expect(roleMigration).toContain("OLD.role = 'pending'");
        expect(roleMigration).toContain("NEW.role IN ('student', 'lecturer')");
        expect(roleMigration).toContain("RAISE EXCEPTION 'Role change is not allowed for this user'");
        expect(canonicalMigration).toContain("CHECK (role IN ('student', 'lecturer', 'admin', 'pending'))");
    });

    it("enables profile RLS and blocks self-selected admin", () => {
        expect(roleMigration).toContain("ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY");
        expect(roleMigration).toContain("role IN ('student', 'lecturer', 'pending')");
        expect(roleMigration).not.toMatch(/Users can update own profile[\s\S]{0,300}role IN \([^)]*admin/i);
    });

    it("enforces .edu.vn only for new Auth users without trusting admin metadata", () => {
        expect(educationMigration).toContain("AFTER INSERT ON auth.users");
        expect(educationMigration).toContain("email_domain = 'edu.vn' OR email_domain LIKE '%.edu.vn'");
        expect(educationMigration).toContain("WHEN 'student' THEN 'student'");
        expect(educationMigration).toContain("WHEN 'lecturer' THEN 'lecturer'");
        expect(educationMigration).not.toContain("WHEN 'admin' THEN 'admin'");
        expect(educationMigration).toContain("ON CONFLICT (id) DO UPDATE");
        expect(educationMigration).toContain("ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY");
        expect(educationMigration).toContain("REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC");
    });
});
