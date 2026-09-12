"use client";

import { useEffect } from "react";

export function installVisitBoundary(
    target: Window,
    revoke: () => void,
    reenter: () => void,
): () => void {
    const originalVisibility = target.document.documentElement.style.visibility;
    const onHide = () => {
        // Also hide BFCache snapshots so Back cannot briefly expose old user data.
        target.document.documentElement.style.visibility = "hidden";
        const path = target.location.pathname;
        if (
            path.startsWith("/ui/") ||
            path === "/auth/select-role" ||
            path === "/reset-password"
        ) revoke();
    };
    const onShow = (event: PageTransitionEvent) => {
        if (event.persisted) reenter();
    };
    target.addEventListener("pagehide", onHide);
    target.addEventListener("pageshow", onShow);
    return () => {
        target.removeEventListener("pagehide", onHide);
        target.removeEventListener("pageshow", onShow);
        target.document.documentElement.style.visibility = originalVisibility;
    };
}

export function VisitBoundary() {
    useEffect(() => installVisitBoundary(window, () => {
        // Failure here is expected when the browser closes abruptly. Server-side
        // document-entry checks still require a fresh login on the next visit.
        try {
            if (!navigator.sendBeacon?.("/api/auth/end-visit")) {
                void fetch("/api/auth/end-visit", { method: "POST", keepalive: true })
                    .catch(() => undefined);
            }
        } catch {
            // No UI remains to display an error; never persist/retry credentials.
        }
    }, () => window.location.replace("/login")), []);
    return null;
}
