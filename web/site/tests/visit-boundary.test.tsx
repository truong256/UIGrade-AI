// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { installVisitBoundary } from "@/components/auth/VisitBoundary";

let dispose: (() => void) | undefined;
afterEach(() => { dispose?.(); window.history.replaceState(null, "", "/"); });

describe("document lifecycle", () => {
    it.each(["/ui/dashboard", "/auth/select-role", "/reset-password"])("hides sensitive snapshots without revoking session when leaving %s", path => {
        window.history.replaceState(null, "", path);
        dispose = installVisitBoundary(window, vi.fn());
        window.dispatchEvent(new PageTransitionEvent("pagehide"));
        expect(document.documentElement.style.visibility).toBe("hidden");
    });

    it("also hides the login document while navigating to Google OAuth", () => {
        window.history.replaceState(null, "", "/login");
        dispose = installVisitBoundary(window, vi.fn());
        window.dispatchEvent(new PageTransitionEvent("pagehide"));
        expect(document.documentElement.style.visibility).toBe("hidden");
    });

    it("requires server entry on BFCache restoration, not initial pageshow", () => {
        const reenter = vi.fn();
        dispose = installVisitBoundary(window, reenter);
        window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: false }));
        expect(reenter).not.toHaveBeenCalled();
        window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
        expect(reenter).toHaveBeenCalledTimes(1);
    });

    it("switching tabs does not hide or reload the document", () => {
        const reenter = vi.fn();
        dispose = installVisitBoundary(window, reenter);
        document.dispatchEvent(new Event("visibilitychange"));
        expect(reenter).not.toHaveBeenCalled();
        expect(document.documentElement.style.visibility).not.toBe("hidden");
    });

    it("removes listeners on cleanup", () => {
        window.history.replaceState(null, "", "/ui/dashboard");
        const reenter = vi.fn();
        dispose = installVisitBoundary(window, reenter);
        dispose();
        window.dispatchEvent(new PageTransitionEvent("pagehide"));
        window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
        expect(reenter).not.toHaveBeenCalled();
        expect(document.documentElement.style.visibility).not.toBe("hidden");
    });
});
