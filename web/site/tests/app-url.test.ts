// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

/**
 * tests/app-url.test.ts
 *
 * Unit tests for lib/app-url.ts — getCanonicalOrigin(), normalizeOrigin(),
 * and isLocalhostOrigin().
 *
 * Scenarios covered:
 *  - A valid browser-facing request origin takes priority in production
 *  - VERCEL_PROJECT_PRODUCTION_URL safely handles invalid request origins
 *  - NEXT_PUBLIC_APP_URL is skipped on production when it resolves to localhost
 *  - NEXT_PUBLIC_APP_URL is used on development even when it is localhost
 *  - x-forwarded-proto + x-forwarded-host fallback
 *  - VERCEL_URL fallback
 *  - request.url fallback (valid browser host)
 *  - 0.0.0.0 / :: bind addresses are rejected
 *  - trailing slash normalization
 *  - http/https normalization
 *  - bare hostname normalization
 *  - localhost is never returned as production canonical origin
 */
import { describe, expect, it, vi, afterEach } from "vitest";
import {
    getCanonicalOrigin,
    normalizeOrigin,
    isLocalhostOrigin,
} from "@/lib/app-url";

/** Build a minimal Request the same way Next.js Route Handlers receive it. */
function req(url: string, headers: Record<string, string> = {}): Request {
    return new Request(url, { headers });
}

// ---------------------------------------------------------------------------
// normalizeOrigin()
// ---------------------------------------------------------------------------

describe("normalizeOrigin()", () => {
    it("parses a full HTTPS URL and strips trailing slash", () => {
        expect(normalizeOrigin("https://app.vercel.app/")).toBe("https://app.vercel.app");
    });

    it("parses a full HTTPS URL without trailing slash", () => {
        expect(normalizeOrigin("https://app.vercel.app")).toBe("https://app.vercel.app");
    });

    it("parses a full HTTPS URL with path and query", () => {
        expect(normalizeOrigin("https://app.vercel.app/auth/callback?code=abc")).toBe(
            "https://app.vercel.app"
        );
    });

    it("prepends https:// to a bare hostname", () => {
        expect(normalizeOrigin("app.vercel.app")).toBe("https://app.vercel.app");
    });

    it("does NOT double-prefix https://", () => {
        // Must not produce "https://https://..."
        const result = normalizeOrigin("https://app.vercel.app");
        expect(result).toBe("https://app.vercel.app");
        expect(result).not.toContain("https://https://");
    });

    it("accepts HTTP explicitly", () => {
        expect(normalizeOrigin("http://localhost:3000")).toBe("http://localhost:3000");
    });

    it("returns null for empty string", () => {
        expect(normalizeOrigin("")).toBeNull();
    });

    it("returns null for undefined", () => {
        expect(normalizeOrigin(undefined)).toBeNull();
    });

    it("returns null for whitespace-only string", () => {
        expect(normalizeOrigin("   ")).toBeNull();
    });

    it("returns null for malformed input", () => {
        // A completely invalid URL that cannot be parsed even with prepended protocol
        expect(normalizeOrigin("not a valid://url!@#$")).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// isLocalhostOrigin()
// ---------------------------------------------------------------------------

describe("isLocalhostOrigin()", () => {
    it.each([
        "http://localhost:3000",
        "http://localhost",
        "http://127.0.0.1:3000",
        "http://0.0.0.0:3000",
    ])("returns true for %s", (origin) => {
        expect(isLocalhostOrigin(origin)).toBe(true);
    });

    it.each([
        "https://app.vercel.app",
        "https://uigrade-ai.vercel.app",
        "https://staging.example.com",
    ])("returns false for %s", (origin) => {
        expect(isLocalhostOrigin(origin)).toBe(false);
    });

    it("returns false for malformed string", () => {
        expect(isLocalhostOrigin("not-a-url")).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// getCanonicalOrigin() — environment variable strategies
// ---------------------------------------------------------------------------

describe("getCanonicalOrigin() — production environment (VERCEL_ENV=production)", () => {
    afterEach(() => vi.unstubAllEnvs());

    it("CASE P0 — keeps the active Vercel alias instead of switching cookie hosts", () => {
        vi.stubEnv("VERCEL_ENV", "production");
        vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "site-tan-sigma-58.vercel.app");
        const result = getCanonicalOrigin(req("https://site-truong257.vercel.app/auth/callback?code=x"));
        expect(result).toBe("https://site-truong257.vercel.app");
    });

    it("CASE P1 — VERCEL_PROJECT_PRODUCTION_URL replaces an invalid bind origin", () => {
        vi.stubEnv("VERCEL_ENV", "production");
        vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "uigrade-ai.vercel.app");
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
        const result = getCanonicalOrigin(req("http://0.0.0.0:3000/auth/callback?code=x"));
        expect(result).toBe("https://uigrade-ai.vercel.app");
        expect(result).not.toContain("localhost");
    });

    it("CASE P2 — VERCEL_PROJECT_PRODUCTION_URL with https:// prefix is normalized", () => {
        vi.stubEnv("VERCEL_ENV", "production");
        vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "https://uigrade-ai.vercel.app/");
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
        const result = getCanonicalOrigin(req("http://0.0.0.0:3000/auth/callback?code=x"));
        expect(result).toBe("https://uigrade-ai.vercel.app");
    });

    it("CASE P3 — localhost NEXT_PUBLIC_APP_URL is skipped on production", () => {
        vi.stubEnv("VERCEL_ENV", "production");
        vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
        vi.stubEnv("VERCEL_URL", "uigrade-ai-git-main-org.vercel.app");
        const result = getCanonicalOrigin(req("http://0.0.0.0:3000/auth/callback?code=x"));
        // Must NOT return localhost — should fall through to VERCEL_URL
        expect(result).toBe("https://uigrade-ai-git-main-org.vercel.app");
        expect(result).not.toContain("localhost");
    });

    it("CASE P4 — 127.0.0.1 NEXT_PUBLIC_APP_URL is skipped on production", () => {
        vi.stubEnv("VERCEL_ENV", "production");
        vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://127.0.0.1:3000");
        vi.stubEnv("VERCEL_URL", "uigrade-ai.vercel.app");
        const result = getCanonicalOrigin(req("http://0.0.0.0:3000/auth/callback?code=x"));
        expect(result).toBe("https://uigrade-ai.vercel.app");
        expect(result).not.toContain("127.0.0.1");
    });

    it("CASE P5 — production NEXT_PUBLIC_APP_URL (https) is accepted on production", () => {
        vi.stubEnv("VERCEL_ENV", "production");
        vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://uigrade-ai.vercel.app");
        const result = getCanonicalOrigin(req("http://0.0.0.0:3000/auth/callback?code=x"));
        expect(result).toBe("https://uigrade-ai.vercel.app");
    });

    it("rejects an HTTP NEXT_PUBLIC_APP_URL in production", () => {
        vi.stubEnv("VERCEL_ENV", "production");
        vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://public.example.com");
        vi.stubEnv("VERCEL_URL", "uigrade-ai.vercel.app");
        expect(getCanonicalOrigin(req("http://0.0.0.0:3000/auth/callback?code=x")))
            .toBe("https://uigrade-ai.vercel.app");
    });

    it("CASE P6 — untrusted forwarded host cannot override the Vercel fallback", () => {
        vi.stubEnv("VERCEL_ENV", "production");
        vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
        vi.stubEnv("VERCEL_URL", "uigrade-ai.vercel.app");
        const result = getCanonicalOrigin(req("http://0.0.0.0:3000/auth/callback?code=x", {
            "x-forwarded-proto": "https",
            "x-forwarded-host": "attacker.example",
        }));
        expect(result).toBe("https://uigrade-ai.vercel.app");
    });

    it("CASE P7 — VERCEL_URL fallback when all others absent", () => {
        vi.stubEnv("VERCEL_ENV", "production");
        vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
        vi.stubEnv("VERCEL_URL", "uigrade-ai-abc123.vercel.app");
        const result = getCanonicalOrigin(req("http://0.0.0.0:3000/auth/callback?code=x"));
        expect(result).toBe("https://uigrade-ai-abc123.vercel.app");
        expect(result).not.toContain("localhost");
    });

    it("CASE P8 — 0.0.0.0 request.url is rejected even on production", () => {
        vi.stubEnv("VERCEL_ENV", "production");
        vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
        vi.stubEnv("VERCEL_URL", "");
        // With nothing configured, falls back to hard-coded localhost
        const result = getCanonicalOrigin(req("http://0.0.0.0:3000/auth/callback?code=x"));
        expect(result).not.toContain("0.0.0.0");
        expect(result).not.toContain("::");
    });

    it.each([
        "http://public.example.com/auth/callback?code=x",
        "https://localhost:3000/auth/callback?code=x",
        "http://[::]:3000/auth/callback?code=x",
        "https://[::1]:3000/auth/callback?code=x",
    ])("rejects unsafe production request origin %s", url => {
        vi.stubEnv("VERCEL_ENV", "production");
        vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "uigrade-ai.vercel.app");
        expect(getCanonicalOrigin(req(url))).toBe("https://uigrade-ai.vercel.app");
    });
});

describe("getCanonicalOrigin() — development environment (no VERCEL_ENV)", () => {
    afterEach(() => vi.unstubAllEnvs());

    it("CASE D1 — localhost NEXT_PUBLIC_APP_URL is accepted in development", () => {
        vi.stubEnv("VERCEL_ENV", "");
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
        const result = getCanonicalOrigin(req("http://0.0.0.0:3000/auth/callback?code=x"));
        expect(result).toBe("http://localhost:3000");
    });

    it("CASE D2 — 0.0.0.0 host in request.url is replaced by NEXT_PUBLIC_APP_URL", () => {
        vi.stubEnv("VERCEL_ENV", "");
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
        const result = getCanonicalOrigin(req("http://0.0.0.0:3000/auth/callback?code=x"));
        expect(result).toBe("http://localhost:3000");
        expect(result).not.toContain("0.0.0.0");
    });

    it("CASE D3 — localhost request.url is accepted directly when no env vars set", () => {
        vi.stubEnv("VERCEL_ENV", "");
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
        vi.stubEnv("VERCEL_URL", "");
        vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
        const result = getCanonicalOrigin(req("http://localhost:3000/auth/callback?code=x"));
        expect(result).toBe("http://localhost:3000");
    });

    it("CASE D4 — x-forwarded headers are used for staging dev server", () => {
        vi.stubEnv("VERCEL_ENV", "");
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
        vi.stubEnv("VERCEL_URL", "");
        const result = getCanonicalOrigin(req("http://0.0.0.0:3000/auth/callback?code=x", {
            "x-forwarded-proto": "https",
            "x-forwarded-host": "staging.example.com",
        }));
        expect(result).toBe("https://staging.example.com");
    });
});

describe("getCanonicalOrigin() — URL normalization", () => {
    afterEach(() => vi.unstubAllEnvs());

    it("strips trailing slash from NEXT_PUBLIC_APP_URL", () => {
        vi.stubEnv("VERCEL_ENV", "");
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.vercel.app/");
        const result = getCanonicalOrigin(req("http://0.0.0.0:3000/auth/callback?code=x"));
        expect(result).toBe("https://app.vercel.app");
        // Ensure redirect would not create //auth/callback double-slash
        expect(result + "/auth/callback").toBe("https://app.vercel.app/auth/callback");
    });

    it("strips path from NEXT_PUBLIC_APP_URL (user misconfiguration)", () => {
        vi.stubEnv("VERCEL_ENV", "");
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://app.vercel.app/some/path");
        const result = getCanonicalOrigin(req("http://0.0.0.0:3000/auth/callback?code=x"));
        expect(result).toBe("https://app.vercel.app");
    });

    it("VERCEL_URL bare hostname gets https:// prepended", () => {
        vi.stubEnv("VERCEL_ENV", "");
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
        vi.stubEnv("VERCEL_URL", "app-git-main-org.vercel.app");
        const result = getCanonicalOrigin(req("http://0.0.0.0:3000/auth/callback?code=x"));
        expect(result).toBe("https://app-git-main-org.vercel.app");
    });

    it("VERCEL_PROJECT_PRODUCTION_URL bare hostname gets https:// prepended", () => {
        vi.stubEnv("VERCEL_ENV", "production");
        vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "uigrade-ai.vercel.app");
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
        const result = getCanonicalOrigin(req("http://0.0.0.0:3000/auth/callback?code=x"));
        expect(result).toBe("https://uigrade-ai.vercel.app");
    });
});

describe("getCanonicalOrigin() — VERCEL_ENV=preview", () => {
    afterEach(() => vi.unstubAllEnvs());

    it("CASE PR1 — VERCEL_PROJECT_PRODUCTION_URL not used in preview env", () => {
        vi.stubEnv("VERCEL_ENV", "preview");
        vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "uigrade-ai.vercel.app");
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
        vi.stubEnv("VERCEL_URL", "uigrade-ai-preview-abc.vercel.app");
        const result = getCanonicalOrigin(req("http://0.0.0.0:3000/auth/callback?code=x"));
        // Preview should NOT use VERCEL_PROJECT_PRODUCTION_URL
        // It should fall through to VERCEL_URL
        expect(result).toBe("https://uigrade-ai-preview-abc.vercel.app");
    });

    it("CASE PR2 — localhost NEXT_PUBLIC_APP_URL is accepted in preview (not blocked)", () => {
        vi.stubEnv("VERCEL_ENV", "preview");
        vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "");
        vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
        // In preview, localhost APP_URL is only blocked in production env
        const result = getCanonicalOrigin(req("http://0.0.0.0:3000/auth/callback?code=x"));
        expect(result).toBe("http://localhost:3000");
    });
});
