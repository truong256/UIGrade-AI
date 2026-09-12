"use client";

import { useEffect } from "react";

export function installVisitBoundary(
    target: Window,
    reenter: () => void,
): () => void {
    const originalVisibility = target.document.documentElement.style.visibility;
    const onHide = () => {
        // Also hide BFCache snapshots so Back cannot briefly expose old user data.
        target.document.documentElement.style.visibility = "hidden";
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
    useEffect(() => installVisitBoundary(window, () => window.location.reload()), []);
    return null;
}
