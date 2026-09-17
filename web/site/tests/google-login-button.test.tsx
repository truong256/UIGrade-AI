// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";

const oauth = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/client", () => ({
    getSupabaseBrowserClient: () => ({ auth: { signInWithOAuth: oauth } }),
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("Google button", () => {
    it("uses the current origin callback and prevents duplicate requests", () => {
        oauth.mockReturnValue(new Promise(() => {}));
        render(<SocialLoginButtons />);
        const button = screen.getByRole("button");
        fireEvent.click(button); fireEvent.click(button);
        expect(oauth).toHaveBeenCalledTimes(1);
        expect(oauth).toHaveBeenCalledWith({ provider: "google", options: {
            redirectTo: `${window.location.origin}/auth/callback`,
        } });
        expect((button as HTMLButtonElement).disabled).toBe(true);
    });

    it("shows a safe error and enables retry after provider failure", async () => {
        oauth.mockResolvedValue({ error: { message: "sensitive-provider-detail" } });
        const onError = vi.fn();
        render(<SocialLoginButtons onError={onError} />);
        fireEvent.click(screen.getByRole("button"));
        await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));
        expect(onError.mock.calls[0][0]).not.toContain("sensitive-provider-detail");
        expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(false);
    });
});
