// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { describe, expect, it } from "vitest";
import {
    dashboardForRole,
    authenticatedProfileRole,
    isAuthenticatedRole,
    isRouteAllowedForRole,
} from "@/lib/auth-routing";

describe("Supabase authentication role routing", () => {
    it("normalizes legacy teacher only at the database boundary", () => {
        expect(authenticatedProfileRole("teacher")).toBe("lecturer");
        expect(authenticatedProfileRole("pending")).toBeNull();
        expect(authenticatedProfileRole("unknown")).toBeNull();
    });
    it("accepts only permanent authenticated roles", () => {
        expect(isAuthenticatedRole("student")).toBe(true);
        expect(isAuthenticatedRole("lecturer")).toBe(true);
        expect(isAuthenticatedRole("admin")).toBe(true);
        expect(isAuthenticatedRole("pending")).toBe(false);
        expect(isAuthenticatedRole("teacher")).toBe(false);
        expect(isAuthenticatedRole(undefined)).toBe(false);
    });

    it("routes each role to its dashboard", () => {
        expect(dashboardForRole("student")).toBe("/ui/dashboard");
        expect(dashboardForRole("lecturer")).toBe("/ui/dashboard");
        expect(dashboardForRole("admin")).toBe("/ui/dashboard");
    });

    it("prevents student access to lecturer and admin routes", () => {
        expect(isRouteAllowedForRole("/ui/submit_assignment", "student")).toBe(true);
        expect(isRouteAllowedForRole("/ui/grading_detail", "student")).toBe(false);
        expect(isRouteAllowedForRole("/ui/server_config/users", "student")).toBe(false);
        expect(isRouteAllowedForRole("/ui/create_assignment", "student")).toBe(false);
    });

    it("prevents lecturer access to student and admin routes", () => {
        expect(isRouteAllowedForRole("/ui/grading_detail", "lecturer")).toBe(true);
        expect(isRouteAllowedForRole("/ui/my_results", "lecturer")).toBe(false);
        expect(isRouteAllowedForRole("/ui/server_config", "lecturer")).toBe(false);
        expect(isRouteAllowedForRole("/ui/create_assignment", "lecturer")).toBe(true);
    });

    it("allows admin routes while retaining grading oversight", () => {
        expect(isRouteAllowedForRole("/ui/server_config", "admin")).toBe(true);
        expect(isRouteAllowedForRole("/ui/server_config/users", "admin")).toBe(true);
        expect(isRouteAllowedForRole("/ui/grading_detail", "admin")).toBe(true);
        expect(isRouteAllowedForRole("/ui/create_assignment", "admin")).toBe(false);
        expect(isRouteAllowedForRole("/ui/submit_assignment", "admin")).toBe(false);
        expect(isRouteAllowedForRole("/ui/my_results", "admin")).toBe(false);
    });
});
