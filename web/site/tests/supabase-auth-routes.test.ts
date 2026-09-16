import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mock = vi.hoisted(() => ({
    reads: [] as Array<{ data: unknown; error: unknown }>,
    saved: { data: null, error: null } as { data: unknown; error: unknown },
    user: { id: "auth-user-id", email: "test@school.edu.vn", user_metadata: {
        name: "Google Name", picture: "https://example.com/avatar.png",
    } },
    getUser: vi.fn(), exchange: vi.fn(), signOut: vi.fn(), signInWithPassword: vi.fn(), signUp: vi.fn(),
    insert: vi.fn(), update: vi.fn(), eq: vi.fn(),
    cookies: [] as Array<{ name: string; value: string }>,
}));

vi.mock("@/lib/supabase/server", () => ({
    createSupabaseServerClient: async () => client(),
    createSupabaseRouteClient: async () => ({
        supabase: client(),
        applyCookies: <T>(response: T) => response,
    }),
}));
vi.mock("@supabase/ssr", () => ({ createServerClient: () => client() }));
vi.mock("next/headers", () => ({ cookies: async () => ({ getAll: () => mock.cookies }) }));

function client() {
    return {
        auth: { getUser: mock.getUser, exchangeCodeForSession: mock.exchange, signOut: mock.signOut,
            signInWithPassword: mock.signInWithPassword, signUp: mock.signUp },
        from: () => {
            const query = {
                select: () => query,
                eq: (...args: unknown[]) => { mock.eq(...args); return query; },
                maybeSingle: async () => mock.reads.shift() ?? { data: null, error: null },
                single: async () => mock.saved,
                insert: (...args: unknown[]) => { mock.insert(...args); return query; },
                update: (...args: unknown[]) => { mock.update(...args); return query; },
                then: (resolve: (value: unknown) => void) => resolve(mock.saved),
            };
            return query;
        },
    };
}

import { GET as callback } from "@/app/auth/callback/route";
import { POST as setRole } from "@/app/api/auth/set-role/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { GET as me } from "@/app/api/auth/me/route";
import { POST as emailLogin } from "@/app/api/auth/login/route";
import { POST as register } from "@/app/api/auth/register/route";
import { proxy } from "@/proxy";
import { POST as endVisit } from "@/app/api/auth/end-visit/route";
import { AUTH_ENTRY_COOKIE } from "@/lib/auth-visit";

const origin = "https://app.example.com";
function profile(role: string, status = "active") {
    return { id: mock.user.id, role, status };
}
function read(data: unknown, error: unknown = null) { mock.reads.push({ data, error }); }
function request(path: string, body?: unknown) {
    return new NextRequest(`${origin}${path}`, body === undefined ? undefined : {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
}

beforeEach(() => {
    vi.clearAllMocks();
    mock.reads = [];
    mock.cookies = [];
    mock.saved = { data: profile("student"), error: null };
    mock.getUser.mockResolvedValue({ data: { user: mock.user }, error: null });
    mock.exchange.mockResolvedValue({ data: { user: mock.user }, error: null });
    mock.signOut.mockResolvedValue({ error: null });
    mock.signInWithPassword.mockResolvedValue({ data: { user: mock.user }, error: null });
    mock.signUp.mockResolvedValue({ data: { user: mock.user, session: null }, error: null });
    mock.user.email = "student@university.edu.vn";
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://plcrwxcwgfcqtfuidloz.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-public-key");
});

afterEach(() => vi.unstubAllEnvs());

describe("real callback handler with mocked Supabase boundary", () => {
    it.each(["exchange", "profile", "unexpected", "onboarding-read", "onboarding-unexpected"])(
        "does not log provider or database payloads on %s failure", async failure => {
            const privateError = Object.assign(new Error("private-backend-payload"), {
                credential: "private-credential-fixture",
            });
            const logger = vi.spyOn(console, "error").mockImplementation(() => undefined);
            try {
                if (failure === "exchange") {
                    mock.exchange.mockResolvedValueOnce({ data: { user: null }, error: privateError });
                } else if (failure === "unexpected") {
                    mock.exchange.mockRejectedValueOnce(privateError);
                } else if (failure === "onboarding-unexpected") {
                    mock.getUser.mockRejectedValueOnce(privateError);
                } else {
                    read(null, privateError);
                }
                const res = failure.startsWith("onboarding")
                    ? await setRole(request("/api/auth/set-role", { role: "student" }))
                    : await callback(request("/auth/callback?code=one-time-code"));
                expect(res.status).toBe(failure.startsWith("onboarding") ? 500 : 307);
                expect(logger).toHaveBeenCalled();
                for (const args of logger.mock.calls) {
                    expect(args).toHaveLength(1);
                    expect(typeof args[0]).toBe("string");
                    expect(args[0]).not.toContain("private-");
                }
            } finally {
                logger.mockRestore();
            }
        }
    );

    it("requires an OAuth code", async () => {
        const res = await callback(request("/auth/callback"));
        expect(res.headers.get("location")).toContain("/login?error=oauth_failed");
        expect(mock.exchange).not.toHaveBeenCalled();
    });

    it("does not reflect raw provider error descriptions", async () => {
        const res = await callback(request("/auth/callback?error=access_denied&error_description=private-details"));
        expect(res.headers.get("location")).not.toContain("private-details");
        expect(mock.exchange).not.toHaveBeenCalled();
    });

    it("reports an expired recovery link without describing it as Google login", async () => {
        const res = await callback(request("/auth/callback?type=recovery&error=access_denied"));
        expect(res.headers.get("location")).toContain("error=recovery_failed");
        expect(res.headers.get("location")).toContain(encodeURIComponent("Liên kết khôi phục không hợp lệ hoặc đã hết hạn"));
        expect(res.headers.get("location")).not.toContain("Google");
    });

    it("keeps an existing pending profile without inserting again", async () => {
        read(profile("pending"));
        expect((await callback(request("/auth/callback?code=code"))).headers.get("location"))
            .toBe(`${origin}/auth/select-role`);
        expect(mock.insert).not.toHaveBeenCalled();
    });

    it.each(["student", "lecturer", "teacher", "admin"])("keeps existing %s role without inserting", async role => {
        read(profile(role));
        const res = await callback(request("/auth/callback?code=one-time-code"));
        expect(mock.exchange).toHaveBeenCalledWith("one-time-code");
        expect(res.headers.get("location")).toBe(`${origin}/ui/dashboard`);
        expect(mock.insert).not.toHaveBeenCalled();
    });

    it("keeps the post-OAuth redirect on the host that received the callback", async () => {
        vi.stubEnv("VERCEL_ENV", "production");
        vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "site-tan-sigma-58.vercel.app");
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
        read(profile("student"));

        const callbackOrigin = "https://site-truong257.vercel.app";
        const res = await callback(new NextRequest(
            `${callbackOrigin}/auth/callback?code=one-time-code`,
            { headers: {
                "x-forwarded-proto": "https",
                "x-forwarded-host": "attacker.example",
            } }
        ));

        expect(res.headers.get("location")).toBe(`${callbackOrigin}/ui/dashboard`);
    });

    it("allows an existing non-.edu.vn Admin through Google callback", async () => {
        mock.user.email = "legacy-admin@example.com";
        read(profile("admin"));
        const res = await callback(request("/auth/callback?code=one-time-code"));
        expect(res.headers.get("location")).toBe(`${origin}/ui/dashboard`);
        expect(mock.signOut).not.toHaveBeenCalled();
        expect(mock.insert).not.toHaveBeenCalled();
    });

    it("rejects onboarding a new non-.edu.vn Google account", async () => {
        mock.user.email = "new-user@example.com";
        read(null);
        const res = await callback(request("/auth/callback?code=one-time-code"));
        expect(res.headers.get("location")).toBe(`${origin}/login?error=education_email_required`);
        expect(mock.signOut).toHaveBeenCalledWith({ scope: "local" });
        expect(mock.insert).not.toHaveBeenCalled();
    });

    it("creates a missing profile with authenticated id, metadata and pending role", async () => {
        read(null);
        const res = await callback(request("/auth/callback?code=code"));
        expect(mock.insert).toHaveBeenCalledWith({ id: mock.user.id, email: mock.user.email,
            full_name: "Google Name", avatar_url: "https://example.com/avatar.png", role: "pending", status: "active" });
        expect(res.headers.get("location")).toBe(`${origin}/auth/select-role`);
    });

    it("recovers a concurrent profile creation without overwriting its role", async () => {
        read(null); read(profile("lecturer"));
        mock.saved = { data: null, error: { code: "23505" } };
        const res = await callback(request("/auth/callback?code=code"));
        expect(res.headers.get("location")).toBe(`${origin}/ui/dashboard`);
        expect(mock.update).not.toHaveBeenCalled();
    });

    it("does not route an inactive profile to a dashboard", async () => {
        read(profile("student", "banned"));
        const res = await callback(request("/auth/callback?code=code"));
        expect(res.headers.get("location")).toBe(`${origin}/login?error=account_inactive`);
    });

    it("routes a password-recovery exchange to the password form, not a dashboard", async () => {
        read(profile("student"));
        const res = await callback(request("/auth/callback?code=recovery-code&type=recovery"));
        expect(res.headers.get("location")).toBe(`${origin}/reset-password`);
        expect(res.cookies.get(AUTH_ENTRY_COOKIE)?.httpOnly).toBe(true);
    });
});

describe("one-time role onboarding handler", () => {
    it.each(["admin", "teacher", "pending", "", null])("rejects role %s", async role => {
        expect((await setRole(request("/api/auth/set-role", { role }))).status).toBe(400);
        expect(mock.update).not.toHaveBeenCalled();
        expect(mock.insert).not.toHaveBeenCalled();
    });

    it("requires a verified Supabase user", async () => {
        mock.getUser.mockResolvedValue({ data: { user: null }, error: null });
        expect((await setRole(request("/api/auth/set-role", { role: "student" }))).status).toBe(401);
    });

    it.each(["student", "lecturer", "admin", "teacher"])("cannot change existing %s role", async role => {
        read(profile(role));
        expect((await setRole(request("/api/auth/set-role", { role: "student" }))).status).toBe(409);
        expect(mock.update).not.toHaveBeenCalled();
    });

    it("does not reactivate a banned pending user", async () => {
        read(profile("pending", "banned"));
        expect((await setRole(request("/api/auth/set-role", { role: "student" }))).status).toBe(403);
        expect(mock.update).not.toHaveBeenCalled();
    });

    it.each(["student", "lecturer"])("saves %s once and returns the persisted profile", async role => {
        read(profile("pending"));
        mock.saved = { data: profile(role), error: null };
        const res = await setRole(request("/api/auth/set-role", { role, id: "attacker-controlled-id" }));
        expect(res.status).toBe(200);
        expect((await res.json()).role).toBe(role);
        expect(mock.update).toHaveBeenCalledWith({ role });
        expect(mock.eq).toHaveBeenCalledWith("id", mock.user.id);
        expect(mock.eq).toHaveBeenCalledWith("role", "pending");
    });

    it("never returns success when no persisted row is returned", async () => {
        read(profile("pending"));
        mock.saved = { data: null, error: null };
        expect((await setRole(request("/api/auth/set-role", { role: "student" }))).status).toBe(500);
    });
});

describe("database-backed navigation guard", () => {
    it("keeps login available when the Auth server throws a network error", async () => {
        mock.getUser.mockRejectedValue(new Error("network unavailable"));
        expect((await proxy(request("/login"))).headers.get("location")).toBeNull();
    });

    it("does not grant dashboard access when verification throws", async () => {
        mock.getUser.mockRejectedValue(new Error("network unavailable"));
        expect((await proxy(request("/ui/dashboard"))).headers.get("location")).toBe(`${origin}/login`);
    });
    it("rejects a dashboard without a Supabase user even with a legacy cookie", async () => {
        mock.getUser.mockResolvedValue({ data: { user: null }, error: null });
        const req = request("/ui/dashboard");
        req.cookies.set("token", "legacy-cookie");
        expect((await proxy(req)).headers.get("location")).toBe(`${origin}/login`);
    });

    it.each(["student", "lecturer"])("blocks %s from admin routes", async role => {
        read(profile(role));
        expect((await proxy(request("/ui/server_config"))).headers.get("location"))
            .toBe(`${origin}/ui/dashboard?error=forbidden`);
    });

    it("allows an active Admin to open the direct admin route", async () => {
        read(profile("admin"));
        expect((await proxy(request("/ui/server_config"))).headers.get("location")).toBeNull();
    });

    it("sends pending profiles to onboarding", async () => {
        read(profile("pending"));
        expect((await proxy(request("/ui/dashboard"))).headers.get("location")).toBe(`${origin}/auth/select-role`);
    });

    it("does not loop inactive users away from login", async () => {
        read(profile("student", "inactive"));
        expect((await proxy(request("/login"))).headers.get("location")).toBeNull();
    });
});

describe("logout handler", () => {
    it("calls global Supabase signout", async () => {
        expect((await logout()).status).toBe(200);
        expect(mock.signOut).toHaveBeenCalledWith({ scope: "global" });
    });

    it("clears project session cookies even when remote signout fails", async () => {
        const key = "sb-plcrwxcwgfcqtfuidloz-auth-token";
        mock.cookies = [key, `${key}.0`, `${key}.1`, `${key}-code-verifier`, "unrelated-cookie"]
            .map(name => ({ name, value: "test-value" }));
        mock.signOut.mockRejectedValue(new Error("network unavailable"));
        const res = await logout();
        expect((await res.json()).remoteSignOutFailed).toBe(true);
        expect(res.cookies.get(`${key}.0`)?.value).toBe("");
        expect(res.cookies.get(`${key}.1`)?.expires).toEqual(new Date(0));
        expect(res.cookies.get("unrelated-cookie")).toBeUndefined();
    });
});

describe("fresh browser visit", () => {
    const key = "sb-plcrwxcwgfcqtfuidloz-auth-token";
    function documentRequest(path: string) {
        return new NextRequest(`${origin}${path}`, { headers: {
            "sec-fetch-dest": "document", "sec-fetch-mode": "navigate", "accept": "text/html",
            cookie: `${key}.0=old-session; ${key}.1=old-session-2; token=old-legacy; unrelated=keep`,
        } });
    }

    it.each([
        ["/ui/dashboard", "student"],
        ["/ui/dashboard", "lecturer"],
        ["/ui/server_config", "admin"],
        ["/auth/select-role", "pending"],
    ])("preserves an authenticated %s document session for %s on reload", async (path, role) => {
        read(profile(role));
        const res = await proxy(documentRequest(path));
        expect(res.headers.get("location")).toBeNull();
        expect(res.cookies.get(`${key}.0`)).toBeUndefined();
        expect(res.cookies.get(`${key}.1`)).toBeUndefined();
        expect(res.headers.get("cache-control")).toBe("no-store");
        expect(mock.getUser).toHaveBeenCalled();
    });

    it.each(["/", "/login", "/register", "/help"])(
        "keeps %s public for an anonymous document request", async path => {
            mock.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
            const req = documentRequest(path);
            const res = await proxy(req);
            expect(res.headers.get("location")).toBeNull();
            expect(req.cookies.get(`${key}.0`)?.value).toBe("old-session");
            expect(res.headers.get("cache-control")).toBe("no-store");
        }
    );

    it("also handles document requests without fetch metadata", async () => {
        mock.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
        const req = new NextRequest(`${origin}/ui/dashboard`, { headers: { accept: "text/html" } });
        expect((await proxy(req)).headers.get("location")).toBe(`${origin}/login`);
    });

    it("preserves in-app navigation after email login", async () => {
        read(profile("student"));
        const req = new NextRequest(`${origin}/ui/dashboard`, { headers: {
            rsc: "1", accept: "text/x-component", "sec-fetch-dest": "empty",
        } });
        expect((await proxy(req)).headers.get("location")).toBeNull();
        expect(mock.getUser).toHaveBeenCalled();
    });

    it.each(["student", "lecturer", "admin", "pending"])(
        "allows OAuth arrival for %s and preserves the verified session on reload", async role => {
            read(profile(role));
            const result = await callback(request("/auth/callback?code=fresh-code"));
            const handoff = result.cookies.get(AUTH_ENTRY_COOKIE)!;
            expect(handoff.httpOnly).toBe(true);
            expect(handoff.maxAge).toBe(30);
            const destination = new URL(result.headers.get("location")!).pathname;
            const req = documentRequest(destination);
            req.cookies.set(AUTH_ENTRY_COOKIE, handoff.value);
            read(profile(role));
            const arrival = await proxy(req);
            expect(arrival.headers.get("location")).toBeNull();
            expect(arrival.cookies.get(AUTH_ENTRY_COOKIE)?.maxAge).toBe(0);
            read(profile(role));
            const reload = await proxy(documentRequest(destination));
            expect(reload.headers.get("location")).toBeNull();
        }
    );

    it.each(["broken-json", JSON.stringify({ path: "/ui/dashboard", expires: 1 }),
        JSON.stringify({ path: "/ui/server_config", expires: Date.now() + 30_000 })])(
        "never treats a malformed handoff as authentication", async value => {
            const req = documentRequest("/ui/dashboard");
            req.cookies.set(AUTH_ENTRY_COOKIE, value);
            mock.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
            expect((await proxy(req)).headers.get("location")).toBe(`${origin}/login`);
        }
    );

    it("a handoff cannot authorize an unauthenticated user", async () => {
        const req = documentRequest("/ui/dashboard");
        req.cookies.set(AUTH_ENTRY_COOKIE, JSON.stringify({ path: "/ui/dashboard", expires: Date.now() + 30_000 }));
        mock.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
        expect((await proxy(req)).headers.get("location")).toBe(`${origin}/login`);
    });

    it("OAuth failure never issues an arrival handoff", async () => {
        const res = await callback(request("/auth/callback?error=access_denied"));
        expect(res.cookies.get(AUTH_ENTRY_COOKIE)).toBeUndefined();
    });
});

describe("browser-close revocation", () => {
    it("revokes only this Supabase session without response cookies", async () => {
        const req = new NextRequest(`${origin}/api/auth/end-visit`, {
            method: "POST", headers: { origin },
        });
        const res = await endVisit(req);
        expect(res.status).toBe(204);
        expect(mock.signOut).toHaveBeenCalledWith({ scope: "local" });
        expect(res.headers.get("set-cookie")).toBeNull();
    });

    it("rejects cross-origin logout requests", async () => {
        const req = new NextRequest(`${origin}/api/auth/end-visit`, {
            method: "POST", headers: { origin: "https://other.example.com" },
        });
        expect((await endVisit(req)).status).toBe(403);
        expect(mock.signOut).not.toHaveBeenCalled();
    });

    it("a late failed beacon cannot erase a new login", async () => {
        mock.signOut.mockRejectedValueOnce(new Error("private network failure"));
        const req = new NextRequest(`${origin}/api/auth/end-visit`, { method: "POST", headers: { origin } });
        const res = await endVisit(req);
        expect(res.status).toBe(503);
        expect(res.headers.get("set-cookie")).toBeNull();
        expect(await res.text()).toBe("");
    });
});

describe("authenticated profile endpoint", () => {
    it("does not return a user without a Supabase session", async () => {
        mock.getUser.mockResolvedValue({ data: { user: null }, error: null });
        expect((await me()).status).toBe(401);
    });

    it("does not return a banned profile as authenticated", async () => {
        mock.saved = { data: profile("student", "banned"), error: null };
        expect((await me()).status).toBe(401);
    });

    it("returns the persisted role and disables caching", async () => {
        mock.saved = { data: { ...profile("teacher"), full_name: "Existing User" }, error: null };
        const res = await me();
        expect(res.status).toBe(200);
        expect(res.headers.get("cache-control")).toBe("no-store");
        expect((await res.json()).user.role).toBe("lecturer");
    });
});

describe("email login profile resolution", () => {
    it("reports a database failure instead of claiming onboarding is needed", async () => {
        read(null, { message: "private database error" });
        const res = await emailLogin(request("/api/auth/login", { email: "test@example.com", password: "fixture-password" }));
        expect(res.status).toBe(503);
        const body = await res.json();
        expect(body.redirectTo).toBeUndefined();
        expect(body.message).not.toContain("private database error");
    });

    it.each([null, profile("pending")])("only missing or pending profiles enter onboarding", async data => {
        read(data);
        const res = await emailLogin(request("/api/auth/login", { email: "test@example.com", password: "fixture-password" }));
        expect(res.status).toBe(200);
        expect((await res.json()).redirectTo).toBe("/auth/select-role");
    });

    it("existing lecturer skips onboarding after email login", async () => {
        read(profile("lecturer"));
        const res = await emailLogin(request("/api/auth/login", { email: "test@example.com", password: "fixture-password" }));
        expect((await res.json()).user.role).toBe("lecturer");
    });

    it("allows an existing non-.edu.vn Admin to sign in", async () => {
        read(profile("admin"));
        const res = await emailLogin(request("/api/auth/login", {
            email: " Legacy-Admin@Example.com ", password: "fixture-password",
        }));
        expect(res.status).toBe(200);
        expect((await res.json()).redirectTo).toBe("/ui/dashboard");
        expect(mock.signInWithPassword).toHaveBeenCalledWith({
            email: "legacy-admin@example.com", password: "fixture-password",
        });
    });
});

describe("education email registration boundary", () => {
    const validRegistration = {
        name: "New User", password: "fixture-password", role: "student",
    };

    it.each(["new-user@example.com", "new-user@edu.vn.attacker.com", "invalid"])(
        "rejects new non-education account %s before Supabase signup", async email => {
            const res = await register(request("/api/auth/register", { ...validRegistration, email }));
            expect(res.status).toBe(400);
            expect((await res.json()).message).toContain(".edu.vn");
            expect(mock.signUp).not.toHaveBeenCalled();
        }
    );

    it.each(["student@university.edu.vn", "LECTURER@EDU.VN"])(
        "allows a new education account %s", async email => {
            const res = await register(request("/api/auth/register", { ...validRegistration, email }));
            expect(res.status).toBe(201);
            expect(mock.signUp).toHaveBeenCalledWith(expect.objectContaining({
                email: email.toLowerCase(),
                options: expect.objectContaining({
                    data: expect.objectContaining({ role: "student" }),
                }),
            }));
        }
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// CASE 1–8: canonical origin resolution (bug fix verification)
// These tests prove that the callback route NEVER redirects to 0.0.0.0.
// ─────────────────────────────────────────────────────────────────────────────

/** Build a minimal Request (not NextRequest) simulating what Next.js Route
 *  Handlers receive. Accepts optional extra headers (e.g. forwarded headers). */
function callbackRequest(url: string, extraHeaders: Record<string, string> = {}): Request {
    return new Request(url, { headers: extraHeaders });
}

describe("canonical origin resolution – NEXT_PUBLIC_APP_URL priority", () => {
    // CASE 1: request comes in with 0.0.0.0 host but APP_URL is set correctly.
    it("CASE 1 – 0.0.0.0 host is replaced by NEXT_PUBLIC_APP_URL", async () => {
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
        read(null); // no profile → will insert pending and redirect to select-role
        const req = callbackRequest("http://0.0.0.0:3000/auth/callback?code=test-code-1");
        const res = await callback(req);
        const location = res.headers.get("location")!;
        expect(location).toBe("http://localhost:3000/auth/select-role");
        expect(location).not.toContain("0.0.0.0");
    });

    // CASE 2: normal localhost request – should work as before.
    it("CASE 2 – localhost request resolves correctly", async () => {
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
        read(null);
        const req = callbackRequest("http://localhost:3000/auth/callback?code=test-code-2");
        const res = await callback(req);
        expect(res.headers.get("location")).toBe("http://localhost:3000/auth/select-role");
    });

    // CASE 3: existing student → dashboard.
    it("CASE 3 – existing student goes to dashboard, not select-role", async () => {
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
        read(profile("student"));
        const req = callbackRequest("http://0.0.0.0:3000/auth/callback?code=test-code-3");
        const res = await callback(req);
        const location = res.headers.get("location")!;
        expect(location).toBe("http://localhost:3000/ui/dashboard");
        expect(location).not.toContain("0.0.0.0");
    });

    // CASE 4: existing lecturer → dashboard.
    it("CASE 4 – existing lecturer goes to dashboard, not select-role", async () => {
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
        read(profile("lecturer"));
        const req = callbackRequest("http://0.0.0.0:3000/auth/callback?code=test-code-4");
        const res = await callback(req);
        const location = res.headers.get("location")!;
        expect(location).toBe("http://localhost:3000/ui/dashboard");
        expect(location).not.toContain("0.0.0.0");
    });

    // CASE 5: pending education account → select-role.
    it("CASE 5 – pending profile goes to select-role (edu.vn email)", async () => {
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
        const eduUser = { ...mock.user, email: "user@school.edu.vn" };
        mock.exchange.mockResolvedValueOnce({ data: { user: eduUser }, error: null });
        read(profile("pending")); // profile already exists as pending
        const req = callbackRequest("http://0.0.0.0:3000/auth/callback?code=test-code-5");
        const res = await callback(req);
        expect(res.headers.get("location")).toBe("http://localhost:3000/auth/select-role");
    });

    // CASE 6: gmail.com new account with no profile → blocked and redirected to login with education_email_required
    it("CASE 6 – gmail.com new account is blocked and redirected to education_email_required", async () => {
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
        const gmailUser = { ...mock.user, email: "user@gmail.com" };
        mock.exchange.mockResolvedValueOnce({ data: { user: gmailUser }, error: null });
        read(null); // no profile
        const req = callbackRequest("http://0.0.0.0:3000/auth/callback?code=test-code-6");
        const res = await callback(req);
        const location = res.headers.get("location")!;
        expect(location).toBe("http://localhost:3000/login?error=education_email_required");
        expect(location).not.toContain("0.0.0.0");
        expect(mock.signOut).toHaveBeenCalled();
    });

    // CASE 7: production URL – must use the production origin, never localhost.
    it("CASE 7 – production APP_URL is used, not localhost", async () => {
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://example.vercel.app");
        read(null);
        const req = callbackRequest("http://0.0.0.0:3000/auth/callback?code=test-code-7");
        const res = await callback(req);
        const location = res.headers.get("location")!;
        expect(location).toBe("https://example.vercel.app/auth/select-role");
        expect(location).not.toContain("localhost");
        expect(location).not.toContain("0.0.0.0");
    });

    // CASE 8: password recovery – fix must not break reset-password redirect.
    it("CASE 8 – password recovery redirect is not broken by origin fix", async () => {
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
        read(profile("student"));
        const req = callbackRequest("http://0.0.0.0:3000/auth/callback?code=recovery-code&type=recovery");
        const res = await callback(req);
        expect(res.headers.get("location")).toBe("http://localhost:3000/reset-password");
        expect(res.headers.get("location")).not.toContain("0.0.0.0");
    });
});

describe("canonical origin resolution – forwarded headers fallback", () => {
    it("uses x-forwarded-proto + x-forwarded-host when APP_URL is absent", async () => {
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
        read(null);
        const req = callbackRequest("http://0.0.0.0:3000/auth/callback?code=fwd-code", {
            "x-forwarded-proto": "https",
            "x-forwarded-host": "staging.example.com",
        });
        const res = await callback(req);
        const location = res.headers.get("location")!;
        expect(location).toContain("https://staging.example.com");
        expect(location).not.toContain("0.0.0.0");
    });

    it("uses request.url origin when it is a valid browser host (no APP_URL, no forwarded headers)", async () => {
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
        read(null);
        const req = callbackRequest("http://localhost:3000/auth/callback?code=fallback-code");
        const res = await callback(req);
        expect(res.headers.get("location")).toBe("http://localhost:3000/auth/select-role");
    });
});
