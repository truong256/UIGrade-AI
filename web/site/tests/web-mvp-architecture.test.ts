import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
    return readFileSync(resolve(process.cwd(), path), "utf8");
}

const coreRoutes = [
    "app/api/classes/route.ts",
    "app/api/classes/[id]/route.ts",
    "app/api/assignments/route.ts",
    "app/api/assignments/[id]/route.ts",
    "app/api/assignments/available/route.ts",
    "app/api/submissions/route.ts",
    "app/api/submissions/[id]/route.ts",
    "app/api/dashboard/overview/route.ts",
    "app/api/account/profile/route.ts",
];

describe("Web MVP architecture boundary", () => {
    it.each(coreRoutes)("keeps %s out of Mongo/ObjectId", (path) => {
        const route = source(path);
        expect(route).not.toMatch(/mongodb|mongoose|connectDB|models\//i);
    });

    it("uses the secure join RPC instead of direct membership insertion", () => {
        const route = source("app/api/classes/join/route.ts");
        const service = source("services/supabase/classroom.supabase.ts");
        expect(route).toMatch(/\.rpc<[\s\S]*?>\("join_class_by_code"/);
        expect(service).toContain('rpc("join_class_by_code"');
        expect(service).not.toMatch(/from\("class_members"\)[\s\S]{0,200}\.insert\(/);
    });

    it("does not require or expose a service-role environment variable", () => {
        const envExample = source(".env.example");
        expect(envExample).toContain("NEXT_PUBLIC_SUPABASE_URL=");
        expect(envExample).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY=");
        expect(envExample).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
        expect(envExample).not.toMatch(/NEXT_PUBLIC_.*SERVICE_ROLE/i);
    });

    it("keeps Google redirect origin-relative", () => {
        const oauth = source("components/auth/SocialLoginButtons.tsx");
        expect(oauth).toContain('`${window.location.origin}/auth/callback`');
        expect(oauth).not.toMatch(/localhost.*auth\/callback|vercel\.app.*auth\/callback/i);
    });
});
