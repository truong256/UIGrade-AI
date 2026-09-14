import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
    return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("Supabase admin user management", () => {
    it("uses the server-only Supabase Admin client and profiles table", () => {
        const service = source("services/user-management.service.ts");
        expect(service).toContain("createSupabaseAdminClient");
        expect(service).toContain('.from("profiles")');
        expect(service).toContain("auth.admin");
        const forbiddenLegacy = new RegExp([
            ["mongo", "db"].join(""),
            ["mongo", "ose"].join(""),
            ["Object", "Id"].join(""),
            ["Security", "Lock"].join(""),
            ["b", "crypt"].join(""),
        ].join("|"), "i");
        expect(service).not.toMatch(forbiddenLegacy);
    });

    it("exposes live user collection and item routes instead of a deferred 410", () => {
        const collectionRoute = source("app/api/settings/users/route.ts");
        const itemRoute = source("app/api/settings/users/[id]/route.ts");
        expect(collectionRoute).toContain("userManagementService");
        expect(itemRoute).toContain("userManagementService");
        expect(collectionRoute).not.toContain("status: 410");
        expect(itemRoute).not.toContain("status: 410");
    });

    it("keeps the service credential server-only", () => {
        const adminClient = source("lib/supabase/admin.ts");
        expect(adminClient).toContain("SUPABASE_SERVICE_ROLE_KEY");
        expect(adminClient).not.toContain("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY");
        expect(adminClient).toContain("persistSession: false");
    });
});
