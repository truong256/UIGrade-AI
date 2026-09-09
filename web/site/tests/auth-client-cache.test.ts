import { afterEach, describe, expect, it, vi } from "vitest";
import { clearCurrentUserCache, fetchCurrentUserClient } from "@/lib/auth-client";

afterEach(() => { clearCurrentUserCache(); vi.unstubAllGlobals(); });

describe("logout cache invalidation", () => {
    it("cannot restore old user data from an in-flight request after logout", async () => {
        let respond!: (response: Response) => void;
        vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>(resolve => { respond = resolve; })));
        const pending = fetchCurrentUserClient();
        clearCurrentUserCache();
        respond(Response.json({ user: { id: "old-user" } }));
        expect(await pending).toBeNull();
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 401 })));
        expect(await fetchCurrentUserClient()).toBeNull();
    });
});
