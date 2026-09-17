// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
    normalizeRole,
    validateRoleInput,
    isAccountAccessAllowed,
    ROLES,
    requireAuth,
    requireAdmin,
    requireLecturerOrAdmin,
    canManageUser,
    assertCanDeactivateUser,
    assertCanDeleteUser,
    assertCanChangeRole,
    assertCanCreateUserWithRole,
    assertOwnsClass,
    assertCanGradeSubmission,
    assertCanAccessSubmission,
    resolveHttpStatus,
    AuthorizationError,
    type AuthenticatedActor,
} from "@/lib/authorization";
import { getCurrentUserFromRequest } from "@/lib/current-user";

const adminActor: AuthenticatedActor = { userId: "admin-001", email: "admin@school.edu.vn", role: "admin" };
const lecturerActor: AuthenticatedActor = { userId: "lec-001", email: "lec@school.edu.vn", role: "lecturer" };
const studentActor: AuthenticatedActor = { userId: "stu-001", email: "stu@school.edu.vn", role: "student" };
const adminTarget = { _id: "admin-002", role: "admin", isActive: true };
const lecturerTarget = { _id: "lec-002", role: "lecturer", isActive: true };
const studentTarget = { _id: "stu-002", role: "student", isActive: true };

describe("role normalization and strict input", () => {
    it("keeps canonical roles and only normalizes supported compatibility aliases", () => {
        expect(normalizeRole("admin")).toBe(ROLES.ADMIN);
        expect(normalizeRole("lecturer")).toBe(ROLES.LECTURER);
        expect(normalizeRole("student")).toBe(ROLES.STUDENT);
        expect(normalizeRole("teacher")).toBe(ROLES.LECTURER);
        expect(normalizeRole("User")).toBe(ROLES.STUDENT);
        expect(normalizeRole("superadmin")).toBe(ROLES.STUDENT);
        expect(normalizeRole("ADMIN")).toBe(ROLES.STUDENT);
    });

    it("rejects unknown roles at write boundaries", () => {
        expect(validateRoleInput("admin")).toBe(ROLES.ADMIN);
        expect(validateRoleInput("teacher")).toBe(ROLES.LECTURER);
        expect(validateRoleInput("User")).toBe(ROLES.STUDENT);
        expect(() => validateRoleInput("root")).toThrowError(AuthorizationError);
        expect(() => validateRoleInput("ADMIN")).toThrowError(AuthorizationError);
        expect(() => validateRoleInput("")).toThrowError(AuthorizationError);
    });
});

describe("authentication and role guards", () => {
    it("requires an authenticated actor", () => {
        expect(() => requireAuth(adminActor)).not.toThrow();
        expect(() => requireAuth(null)).toThrowError(AuthorizationError);
    });

    it("allows only admins through requireAdmin", () => {
        expect(() => requireAdmin(adminActor)).not.toThrow();
        expect(() => requireAdmin(lecturerActor)).toThrowError(AuthorizationError);
        expect(() => requireAdmin(studentActor)).toThrowError(AuthorizationError);
        expect(() => requireAdmin(null)).toThrowError(AuthorizationError);
    });

    it("allows lecturer or admin but never student", () => {
        expect(() => requireLecturerOrAdmin(adminActor)).not.toThrow();
        expect(() => requireLecturerOrAdmin(lecturerActor)).not.toThrow();
        expect(() => requireLecturerOrAdmin(studentActor)).toThrowError(AuthorizationError);
    });
});

describe("user administration authorization", () => {
    it("only admins can manage users or create privileged accounts", () => {
        expect(canManageUser(adminActor, studentTarget)).toBe(true);
        expect(canManageUser(lecturerActor, studentTarget)).toBe(false);
        expect(canManageUser(studentActor, adminTarget)).toBe(false);
        expect(() => assertCanCreateUserWithRole(adminActor, "admin")).not.toThrow();
        expect(() => assertCanCreateUserWithRole(lecturerActor, "admin")).toThrowError(AuthorizationError);
    });

    it("prevents non-admin account state and role mutations", () => {
        expect(() => assertCanDeactivateUser(lecturerActor, adminTarget, 3)).toThrowError(AuthorizationError);
        expect(() => assertCanDeleteUser(studentActor, lecturerTarget, 3)).toThrowError(AuthorizationError);
        expect(() => assertCanChangeRole(lecturerActor, studentTarget, "admin", 3)).toThrowError(AuthorizationError);
    });

    it("prevents self destructive admin operations", () => {
        const selfActor: AuthenticatedActor = { userId: "admin-self", email: "admin@school.edu.vn", role: "admin" };
        const selfTarget = { _id: "admin-self", role: "admin", isActive: true };
        expect(() => assertCanDeactivateUser(selfActor, selfTarget, 2)).toThrowError(AuthorizationError);
        expect(() => assertCanDeleteUser(selfActor, selfTarget, 2)).toThrowError(AuthorizationError);
        expect(() => assertCanChangeRole(selfActor, selfTarget, "student", 1)).toThrowError(AuthorizationError);
    });
});

describe("PostgreSQL last-admin invariant", () => {
    const migration = readFileSync(
        resolve(process.cwd(), "supabase/migrations/20260902000001_fix_rls_security.sql"),
        "utf8"
    );

    it("serializes concurrent admin mutations with a transaction advisory lock", () => {
        expect(migration).toContain("pg_advisory_xact_lock");
        expect(migration).toContain("admin_last_invariant_lock");
    });

    it("blocks deleting, demoting, or locking the last active admin", () => {
        expect(migration).toContain("Cannot delete the last active admin account");
        expect(migration).toContain("Cannot demote or lock the last active admin account");
        expect(migration).toContain("BEFORE UPDATE OR DELETE ON public.profiles");
    });
});

describe("class and submission authorization", () => {
    it("restricts class ownership to the lecturer or admin", () => {
        expect(() => assertOwnsClass(lecturerActor, "lec-001")).not.toThrow();
        expect(() => assertOwnsClass(lecturerActor, "other-lecturer")).toThrowError(AuthorizationError);
        expect(() => assertOwnsClass(adminActor, "other-lecturer")).not.toThrow();
    });

    it("restricts grading to the owning lecturer or admin", () => {
        expect(() => assertCanGradeSubmission(lecturerActor, "lec-001")).not.toThrow();
        expect(() => assertCanGradeSubmission(lecturerActor, "other-lecturer")).toThrowError(AuthorizationError);
        expect(() => assertCanGradeSubmission(studentActor, "stu-001")).toThrowError(AuthorizationError);
    });

    it("restricts students to their own submission", () => {
        expect(() => assertCanAccessSubmission(studentActor, "stu-001")).not.toThrow();
        expect(() => assertCanAccessSubmission(studentActor, "stu-999")).toThrowError(AuthorizationError);
        expect(() => assertCanAccessSubmission(adminActor, "stu-999")).not.toThrow();
    });
});

describe("account status", () => {
    it("allows active users and denies blocked states", () => {
        expect(isAccountAccessAllowed("active")).toBe(true);
        expect(isAccountAccessAllowed("ACTIVE")).toBe(true);
        expect(isAccountAccessAllowed("locked")).toBe(false);
        expect(isAccountAccessAllowed("inactive")).toBe(false);
        expect(isAccountAccessAllowed("banned")).toBe(false);
        expect(isAccountAccessAllowed("suspended")).toBe(false);
        expect(isAccountAccessAllowed("pending")).toBe(false);
        expect(isAccountAccessAllowed("active", false)).toBe(false);
    });
});

describe("request spoofing defense", () => {
    it("ignores client identity headers without a verified Supabase session", async () => {
        const request = new Request("http://localhost:3000/api/settings/users", {
            headers: {
                "x-user-id": "fake-admin-id",
                "x-user-role": "admin",
                "x-user-email": "attacker@example.com",
            },
        });
        const user = await getCurrentUserFromRequest(request);
        expect(user).toBeNull();
        expect(() => requireAdmin(user)).toThrowError(AuthorizationError);
    });
});

describe("HTTP status mapping", () => {
    it("preserves authentication and authorization statuses", () => {
        expect(resolveHttpStatus(new AuthorizationError("Bạn chưa đăng nhập", 401))).toBe(401);
        expect(resolveHttpStatus(new AuthorizationError("Bạn không có quyền", 403))).toBe(403);
        expect(resolveHttpStatus(new Error("không tìm thấy người dùng"))).toBe(404);
        expect(resolveHttpStatus(new Error("email đã tồn tại"))).toBe(409);
    });
});
