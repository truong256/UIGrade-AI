// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LoginFormCard } from "@/components/auth/LoginFormCard";
import { RegisterFormCard } from "@/components/auth/RegisterFormCard";

const navigation = vi.hoisted(() => ({
    push: vi.fn(),
    refresh: vi.fn(),
}));
const oauth = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
    useRouter: () => navigation,
}));

vi.mock("@/lib/supabase/client", () => ({
    getSupabaseBrowserClient: () => ({
        auth: { signInWithOAuth: oauth },
    }),
}));

describe("Auth Soft UI accessibility", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
        oauth.mockReset();
        navigation.push.mockReset();
        navigation.refresh.mockReset();
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
    });

    it("places the login identity and heading inside the auth card", () => {
        render(<LoginFormCard />);

        expect(screen.getByRole("img", { name: "UIGrade AI" })).toBeTruthy();
        expect(screen.getByRole("heading", { level: 1, name: "Chào mừng trở lại" })).toBeTruthy();
        expect(screen.getByText("Đăng nhập để tiếp tục")).toBeTruthy();
    });

    it("provides real labels and an accessible password visibility control", () => {
        render(<LoginFormCard />);

        expect(screen.getByLabelText("Email").getAttribute("type")).toBe("email");
        const password = screen.getByLabelText("Mật khẩu");
        expect(password.getAttribute("type")).toBe("password");

        fireEvent.click(screen.getByRole("button", { name: "Hiện mật khẩu" }));
        expect(password.getAttribute("type")).toBe("text");
        expect(screen.getByRole("button", { name: "Ẩn mật khẩu" })).toBeTruthy();
    });

    it("links an invalid login email message to its input", async () => {
        render(<LoginFormCard />);

        fireEvent.change(screen.getByLabelText("Email"), { target: { value: "invalid" } });
        fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "secret123" } });
        fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

        const email = screen.getByLabelText("Email");
        const message = await screen.findByText(/Địa chỉ email không đúng định dạng/);
        expect(email.getAttribute("aria-invalid")).toBe("true");
        expect(email.getAttribute("aria-describedby")).toBe(message.id);
        expect(fetch).not.toHaveBeenCalled();
    });

    it("blocks credential login while Google OAuth is starting", () => {
        oauth.mockReturnValue(new Promise(() => undefined));
        render(<LoginFormCard />);

        fireEvent.change(screen.getByLabelText("Email"), { target: { value: "admin@example.com" } });
        fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "secret123" } });
        fireEvent.click(screen.getByRole("button", { name: "Tiếp tục với Google" }));

        const submit = screen.getByRole("button", { name: "Đăng nhập" }) as HTMLButtonElement;
        expect(submit.disabled).toBe(true);
        fireEvent.submit(submit.closest("form") as HTMLFormElement);
        expect(fetch).not.toHaveBeenCalled();
    });
});

describe("Registration experience", () => {
    beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
        cleanup();
        vi.unstubAllGlobals();
    });

    it("does not show password guidance as an error before the user types", () => {
        render(<RegisterFormCard />);

        expect(screen.queryByText("Mật khẩu cần ít nhất 6 ký tự.")).toBeNull();
        fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "12345" } });
        expect(screen.getByText("Mật khẩu cần ít nhất 6 ký tự.")).toBeTruthy();
    });

    it("rejects a password containing only whitespace", async () => {
        render(<RegisterFormCard />);

        fireEvent.change(screen.getByLabelText("Họ và tên"), { target: { value: "Nguyễn Văn A" } });
        fireEvent.change(screen.getByLabelText("Email"), { target: { value: "student@university.edu.vn" } });
        fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "      " } });
        fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu"), { target: { value: "      " } });
        fireEvent.click(screen.getByRole("button", { name: "Đăng ký tài khoản" }));

        expect(await screen.findByText("Mật khẩu cần ít nhất 6 ký tự.")).toBeTruthy();
        expect(fetch).not.toHaveBeenCalled();
    });

    it("rejects a non-education registration email inline without calling the API", async () => {
        render(<RegisterFormCard />);

        fireEvent.change(screen.getByLabelText("Họ và tên"), { target: { value: "Nguyễn Văn A" } });
        fireEvent.change(screen.getByLabelText("Email"), { target: { value: "student@gmail.com" } });
        fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "secret123" } });
        fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu"), { target: { value: "secret123" } });
        fireEvent.click(screen.getByRole("button", { name: "Đăng ký tài khoản" }));

        const message = await screen.findByText("Vui lòng sử dụng email giáo dục có tên miền .edu.vn.");
        const email = screen.getByLabelText("Email");
        expect(email.getAttribute("aria-invalid")).toBe("true");
        expect(email.getAttribute("aria-describedby")).toBe(message.id);
        expect(fetch).not.toHaveBeenCalled();
    });

    it("offers only student and lecturer registration roles", () => {
        render(<RegisterFormCard />);

        const student = screen.getByRole("button", { name: "Sinh viên" });
        const lecturer = screen.getByRole("button", { name: "Giảng viên" });
        expect(student.getAttribute("aria-pressed")).toBe("true");
        expect(lecturer.getAttribute("aria-pressed")).toBe("false");
        expect(screen.queryByRole("button", { name: /admin|quản trị/i })).toBeNull();
    });

    it("prevents duplicate registration requests", async () => {
        const request = vi.fn().mockReturnValue(new Promise(() => undefined));
        vi.stubGlobal("fetch", request);
        render(<RegisterFormCard />);

        fireEvent.change(screen.getByLabelText("Họ và tên"), { target: { value: "Nguyễn Văn A" } });
        fireEvent.change(screen.getByLabelText("Email"), { target: { value: "student@university.edu.vn" } });
        fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "secret123" } });
        fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu"), { target: { value: "secret123" } });

        const form = screen.getByRole("button", { name: "Đăng ký tài khoản" }).closest("form");
        expect(form).not.toBeNull();
        fireEvent.submit(form as HTMLFormElement);
        fireEvent.submit(form as HTMLFormElement);

        await waitFor(() => expect(request).toHaveBeenCalled());
        expect(request).toHaveBeenCalledTimes(1);
    });

    it("keeps an existing non-education account eligible for login", async () => {
        const request = vi.fn().mockResolvedValue({
            ok: false,
            json: async () => ({ message: "Sai thông tin đăng nhập" }),
        });
        vi.stubGlobal("fetch", request);
        render(<LoginFormCard />);

        fireEvent.change(screen.getByLabelText("Email"), { target: { value: "legacy-admin@example.com" } });
        fireEvent.change(screen.getByLabelText("Mật khẩu"), { target: { value: "secret123" } });
        fireEvent.click(screen.getByRole("button", { name: "Đăng nhập" }));

        await waitFor(() => expect(request).toHaveBeenCalledTimes(1));
        expect(JSON.parse(String(request.mock.calls[0][1]?.body))).toMatchObject({
            email: "legacy-admin@example.com",
        });
    });
});
