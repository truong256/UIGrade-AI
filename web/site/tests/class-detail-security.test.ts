import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const serviceSource = readFileSync(
    resolve(process.cwd(), "services/supabase/web-mvp.supabase.ts"),
    "utf8"
);
const rlsSource = readFileSync(
    resolve(process.cwd(), "supabase/migrations/20260909000001_mvp_security_lockdown.sql"),
    "utf8"
);

describe("Supabase class detail security boundary", () => {
    it("loads class details through the Supabase class service", () => {
        expect(serviceSource).toContain("export const SupabaseWebClassService");
        expect(serviceSource).toContain('db.from("classes").select(CLASS_SELECT)');
    });

    it("does not include profile email or student code in the class row projection", () => {
        const classSelect = serviceSource.match(/const CLASS_SELECT = ([^;]+);/)?.[1] || "";
        expect(classSelect).not.toContain("email");
        expect(classSelect).not.toContain("student_code");
    });

    it("requires an active related user at the database policy boundary", () => {
        expect(rlsSource).toContain('CREATE POLICY "Authorized users can view related classes"');
        expect(rlsSource).toContain("public.is_active_user()");
        expect(rlsSource).toContain("public.is_active_class_member(id)");
    });
});
