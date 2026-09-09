// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { installVisitBoundary } from "@/components/auth/VisitBoundary";

let dispose: (() => void) | undefined;
afterEach(() => { dispose?.(); window.history.replaceState(null, "", "/"); });

describe("document lifecycle", () => {
    it.each(["/ui/dashboard", "/auth/select-role"])("revokes when leaving %s", path => {
        window.history.replaceState(null, "", path);
        const revoke = vi.fn();
        dispose = installVisitBoundary(window, revoke, vi.fn());
        window.dispatchEvent(new PageTransitionEvent("pagehide"));
        expect(revoke).toHaveBeenCalledTimes(1);
        expect(document.documentElement.style.visibility).toBe("hidden");
    });

    it("does not revoke when leaving login for Google OAuth", () => {
        window.history.replaceState(null, "", "/login");
        const revoke = vi.fn();
        dispose = installVisitBoundary(window, revoke, vi.fn());
        window.dispatchEvent(new PageTransitionEvent("pagehide"));
        expect(revoke).not.toHaveBeenCalled();
    });

    it("requires server entry on BFCache restoration, not initial pageshow", () => {
        const reenter = vi.fn();
        dispose = installVisitBoundary(window, vi.fn(), reenter);
        window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: false }));
        expect(reenter).not.toHaveBeenCalled();
        window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
        expect(reenter).toHaveBeenCalledTimes(1);
    });

    it("switching tabs does not end a visit", () => {
        const revoke = vi.fn();
        dispose = installVisitBoundary(window, revoke, vi.fn());
        document.dispatchEvent(new Event("visibilitychange"));
        expect(revoke).not.toHaveBeenCalled();
    });

    it("removes listeners on cleanup", () => {
        window.history.replaceState(null, "", "/ui/dashboard");
        const revoke = vi.fn();
        const reenter = vi.fn();
        dispose = installVisitBoundary(window, revoke, reenter);
        dispose();
        window.dispatchEvent(new PageTransitionEvent("pagehide"));
        window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));
        expect(revoke).not.toHaveBeenCalled();
        expect(reenter).not.toHaveBeenCalled();
        expect(document.documentElement.style.visibility).not.toBe("hidden");
    });
});
