// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mock = vi.hoisted(() => ({
    cookieAdapter: null as null | {
        setAll: (
            cookies: Array<{ name: string; value: string; options: Record<string, unknown> }>,
            headers?: Record<string, string>
        ) => void;
    },
    cookieStoreSet: vi.fn(),
    profileResult: {
        data: { id: "auth-user-id", role: "student", status: "active" },
        error: null,
    } as { data: unknown; error: unknown },
}));

vi.mock("next/headers", () => ({
    cookies: async () => ({
        getAll: () => [{
            name: "sb-plcrwxcwgfcqtfuidloz-auth-token-code-verifier",
            value: "pkce-verifier-fixture",
        }],
        set: mock.cookieStoreSet,
    }),
}));

vi.mock("@supabase/ssr", () => ({
    createServerClient: (_url: string, _key: string, options: {
        cookies: typeof mock.cookieAdapter;
    }) => {
        mock.cookieAdapter = options.cookies;
        const query = {
            select: () => query,
            eq: () => query,
            maybeSingle: async () => mock.profileResult,
        };

        return {
            auth: {
                exchangeCodeForSession: async () => {
                    options.cookies?.setAll([{
                        name: "sb-plcrwxcwgfcqtfuidloz-auth-token",
                        value: "session-fixture",
                        options: { path: "/", httpOnly: true, sameSite: "lax" },
                    }], { "cache-control": "private, no-store" });

                    return {
                        data: {
                            user: {
                                id: "auth-user-id",
                                email: "student@university.edu.vn",
                                user_metadata: {},
                            },
                        },
                        error: null,
                    };
                },
            },
            from: () => query,
        };
    },
}));

import { GET as callback } from "@/app/auth/callback/route";

describe("OAuth callback response cookies", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mock.cookieAdapter = null;
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://plcrwxcwgfcqtfuidloz.supabase.co");
        vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-public-key");
        vi.stubEnv("VERCEL_ENV", "production");
        vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "site-tan-sigma-58.vercel.app");
        mock.profileResult = {
            data: { id: "auth-user-id", role: "student", status: "active" },
            error: null,
        };
    });

    afterEach(() => vi.unstubAllEnvs());

    it("returns the exchanged Supabase session cookie on the same-host redirect", async () => {
        const origin = "https://site-truong257.vercel.app";
        const response = await callback(new NextRequest(
            `${origin}/auth/callback?code=one-time-code`
        ));

        expect(response.headers.get("location")).toBe(`${origin}/ui/dashboard`);
        expect(response.cookies.get("sb-plcrwxcwgfcqtfuidloz-auth-token")?.value)
            .toBe("session-fixture");
        expect(response.headers.get("cache-control")).toBe("private, no-store");
    });

    it("preserves the authenticated session when the profile read fails", async () => {
        mock.profileResult = { data: null, error: new Error("private database error") };
        const logger = vi.spyOn(console, "error").mockImplementation(() => undefined);
        try {
            const origin = "https://site-truong257.vercel.app";
            const response = await callback(new NextRequest(
                `${origin}/auth/callback?code=one-time-code`
            ));

            expect(response.headers.get("location"))
                .toBe(`${origin}/login?error=profile_unavailable`);
            expect(response.cookies.get("sb-plcrwxcwgfcqtfuidloz-auth-token")?.value)
                .toBe("session-fixture");
        } finally {
            logger.mockRestore();
        }
    });
});
