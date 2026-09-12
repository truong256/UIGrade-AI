// @vitest-environment jsdom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ResetPasswordPage from "@/app/reset-password/page";

const auth = vi.hoisted(() => ({
    getUser: vi.fn(),
    updateUser: vi.fn(),
    signOut: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
    getSupabaseBrowserClient: () => ({ auth }),
}));

beforeEach(() => {
    auth.getUser.mockResolvedValue({ data: { user: { id: "user-id" } }, error: null });
    auth.updateUser.mockResolvedValue({ error: null });
    auth.signOut.mockResolvedValue({ error: null });
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.restoreAllMocks();
});

describe("password recovery form", () => {
    it("updates the password and ends the recovery session", async () => {
        render(<ResetPasswordPage />);
        const password = await screen.findByLabelText("Mật khẩu mới");
        fireEvent.change(password, { target: { value: "new-password-123" } });
        fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu mới"), {
            target: { value: "new-password-123" },
        });
        fireEvent.click(screen.getByRole("button", { name: "Cập nhật mật khẩu" }));

        await waitFor(() => expect(auth.updateUser).toHaveBeenCalledWith({ password: "new-password-123" }));
        expect(auth.signOut).toHaveBeenCalledWith({ scope: "global" });
        expect(await screen.findByText(/Phiên khôi phục đã kết thúc/)).toBeTruthy();
    });

    it("does not show a password form for an expired recovery session", async () => {
        auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
        render(<ResetPasswordPage />);
        expect(await screen.findByText(/không hợp lệ hoặc đã hết hạn/)).toBeTruthy();
        expect(screen.queryByLabelText("Mật khẩu mới")).toBeNull();
        expect(auth.updateUser).not.toHaveBeenCalled();
    });

    it("clears cookies through the logout endpoint when remote revocation fails", async () => {
        auth.signOut.mockResolvedValue({ error: { message: "offline" } });
        const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));
        render(<ResetPasswordPage />);
        fireEvent.change(await screen.findByLabelText("Mật khẩu mới"), { target: { value: "new-password-123" } });
        fireEvent.change(screen.getByLabelText("Xác nhận mật khẩu mới"), { target: { value: "new-password-123" } });
        fireEvent.click(screen.getByRole("button", { name: "Cập nhật mật khẩu" }));

        await waitFor(() => expect(fetchSpy).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" }));
        expect(await screen.findByText(/Phiên khôi phục đã kết thúc/)).toBeTruthy();
    });
});
