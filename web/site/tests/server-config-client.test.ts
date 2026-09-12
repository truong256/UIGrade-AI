import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("admin server configuration client", () => {
    it("uses the PATCH method exposed by the server route", () => {
        const source = readFileSync(
            resolve(process.cwd(), "components/settings/ServerConfigClient.tsx"),
            "utf8"
        );
        expect(source).toMatch(/fetch\("\/api\/server-config",\s*\{\s*method: "PATCH"/);
        expect(source).not.toMatch(/fetch\("\/api\/server-config",\s*\{\s*method: "PUT"/);
    });
});
