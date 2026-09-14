// @vitest-environment jsdom
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { isEducationEmail } from "@/lib/education-email";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { LoginFormCard } from "@/components/auth/LoginFormCard";

// Mock Supabase browser client for SocialLoginButtons
const oauth = vi.hoisted(() => vi.fn());
vi.mock("@/lib/supabase/client", () => ({
    getSupabaseBrowserClient: () => ({ auth: { signInWithOAuth: oauth } }),
}));

// Mock next/navigation useRouter
vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        refresh: vi.fn(),
    }),
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("Education Email Domain Rule (isEducationEmail)", () => {
    it("CASE 3 – approves valid .edu.vn emails (e.g. student@ictu.edu.vn)", () => {
        expect(isEducationEmail("student@ictu.edu.vn")).toBe(true);
        expect(isEducationEmail("teacher@university.edu.vn")).toBe(true);
        expect(isEducationEmail("user@school.edu.vn")).toBe(true);
        expect(isEducationEmail("admin@edu.vn")).toBe(true);
        expect(isEducationEmail("STUDENT@ICTU.EDU.VN")).toBe(true); // case-insensitive
    });

    it("CASE 1 – blocks standard Gmail accounts (user@gmail.com)", () => {
        expect(isEducationEmail("user@gmail.com")).toBe(false);
    });

    it("CASE 2 – blocks Outlook, Yahoo and generic corporate accounts", () => {
        expect(isEducationEmail("user@outlook.com")).toBe(false);
        expect(isEducationEmail("user@yahoo.com")).toBe(false);
        expect(isEducationEmail("user@company.com")).toBe(false);
        expect(isEducationEmail("user@somedomain.org")).toBe(false);
    });

    it("CASE 4 – blocks deceptive suffixes (user@edu.vn.fake.com, fakeedu.vn)", () => {
        expect(isEducationEmail("user@edu.vn.fake.com")).toBe(false);
        expect(isEducationEmail("user@fakeedu.vn")).toBe(false);
        expect(isEducationEmail("user@edu.vn.com")).toBe(false);
        expect(isEducationEmail("user@myedu.vn")).toBe(false);
    });

    it("blocks null, undefined, empty or malformed strings", () => {
        expect(isEducationEmail("")).toBe(false);
        expect(isEducationEmail(null)).toBe(false);
        expect(isEducationEmail(undefined)).toBe(false);
        expect(isEducationEmail("not-an-email")).toBe(false);
    });
});

describe("Auth Error Mapping (getAuthErrorMessage)", () => {
    it("maps education_email_required to friendly Vietnamese message", () => {
        const error = getAuthErrorMessage("education_email_required");
        expect(error).not.toBeNull();
        expect(error?.title).toBe("Tài khoản không được hỗ trợ");
        expect(error?.message).toContain("UIGrade AI chỉ hỗ trợ tài khoản giáo dục");
        expect(error?.message).toContain("Vui lòng đăng nhập bằng email trường có đuôi .edu.vn.");
        expect(error?.message).not.toContain("education_email_required");
    });

    it("maps other auth errors without exposing raw code", () => {
        const accountInactive = getAuthErrorMessage("account_inactive");
        expect(accountInactive?.message).not.toContain("account_inactive");
        expect(accountInactive?.message).toContain("khóa");

        const oauthFailed = getAuthErrorMessage("oauth_failed");
        expect(oauthFailed?.message).not.toContain("oauth_failed");
        expect(oauthFailed?.message).toContain("Không thể đăng nhập bằng Google");
    });
});

describe("Login UI Education Email Required Error Display", () => {
    it("CASE 1 & 2 – renders Vietnamese alert when error=education_email_required", () => {
        render(<LoginFormCard initialErrorCode="education_email_required" />);

        // Check required title
        expect(screen.getByText("Tài khoản không được hỗ trợ")).toBeDefined();

        // Check required message content
        expect(
            screen.getByText((content) =>
                content.includes("UIGrade AI chỉ hỗ trợ tài khoản giáo dục") &&
                content.includes("Vui lòng đăng nhập bằng email trường có đuôi .edu.vn.")
            )
        ).toBeDefined();

        // Ensure raw technical error code is NOT shown
        expect(screen.queryByText("education_email_required")).toBeNull();
        expect(screen.queryByText("oauth_failed")).toBeNull();
    });

    it("CASE 7 – user can retry Google login and buttons are not stuck loading", () => {
        oauth.mockReturnValue(new Promise(() => {})); // pending promise
        render(<LoginFormCard initialErrorCode="education_email_required" />);

        const googleBtn = screen.getByRole("button", { name: /tiếp tục với google/i });
        const submitBtn = screen.getByRole("button", { name: /đăng nhập/i });

        // Buttons must NOT be stuck in loading/disabled state
        expect((googleBtn as HTMLButtonElement).disabled).toBe(false);
        expect((submitBtn as HTMLButtonElement).disabled).toBe(false);

        // User can click to retry Google login with a different account
        fireEvent.click(googleBtn);
        expect(oauth).toHaveBeenCalledTimes(1);
    });
});
