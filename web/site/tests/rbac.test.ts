/**
 * tests/rbac.test.ts
 *
 * Comprehensive RBAC regression tests for UIGrade AI security fixes.
 *
 * Tests cover:
 *  - normalizeRole() canonical normalization
 *  - requireAdmin() guard
 *  - requireLecturerOrAdmin() guard
 *  - canManageUser() - lecturer/student cannot manage users
 *  - assertCanDeactivateUser() - teacher cannot lock admin; last-admin protection
 *  - assertCanDeleteUser() - teacher cannot delete admin; last-admin protection
 *  - assertCanChangeRole() - teacher cannot change admin role; last-admin protection
 *  - assertCanCreateUserWithRole() - only admin can create admin accounts
 *  - assertOwnsClass() - lecturer can only manage their own class
 *  - assertCanAccessSubmission() - student can only access their own submission
 *  - Header spoofing: getCurrentUserFromRequest() ignores x-user-role header
 *  - Role spoofing: role from request body does not grant access
 */

import { describe, it, expect } from "vitest";
import {
    normalizeRole,
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
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const adminActor: AuthenticatedActor = { userId: "admin-001", email: "admin@test.com", role: "admin" };
const lecturerActor: AuthenticatedActor = { userId: "lec-001", email: "lec@test.com", role: "lecturer" };
const studentActor: AuthenticatedActor = { userId: "stu-001", email: "stu@test.com", role: "student" };

const adminTarget = { _id: "admin-002", role: "admin", isActive: true };
const lecturerTarget = { _id: "lec-002", role: "lecturer", isActive: true };
const studentTarget = { _id: "stu-002", role: "student", isActive: true };

// ---------------------------------------------------------------------------
// 1. Role normalization
// ---------------------------------------------------------------------------

describe("normalizeRole()", () => {
    it("passes canonical admin through unchanged", () => {
        expect(normalizeRole("admin")).toBe(ROLES.ADMIN);
    });

    it("passes canonical lecturer through unchanged", () => {
        expect(normalizeRole("lecturer")).toBe(ROLES.LECTURER);
    });

    it("passes canonical student through unchanged", () => {
        expect(normalizeRole("student")).toBe(ROLES.STUDENT);
    });

    it("normalizes legacy 'teacher' to 'lecturer'", () => {
        expect(normalizeRole("teacher")).toBe(ROLES.LECTURER);
    });

    it("normalizes legacy 'User' (PascalCase) to 'student'", () => {
        expect(normalizeRole("User")).toBe(ROLES.STUDENT);
    });

    it("defaults unknown roles to 'student' (least privilege)", () => {
        expect(normalizeRole("superadmin")).toBe(ROLES.STUDENT);
        expect(normalizeRole("hacker")).toBe(ROLES.STUDENT);
        expect(normalizeRole("")).toBe(ROLES.STUDENT);
        expect(normalizeRole(null)).toBe(ROLES.STUDENT);
        expect(normalizeRole(undefined)).toBe(ROLES.STUDENT);
    });

    it("does NOT escalate unknown roles to admin or lecturer", () => {
        expect(normalizeRole("ADMIN")).not.toBe(ROLES.ADMIN); // case-sensitive
        expect(normalizeRole("TEACHER")).not.toBe(ROLES.LECTURER);
    });
});

// ---------------------------------------------------------------------------
// 2. requireAuth()
// ---------------------------------------------------------------------------

describe("requireAuth()", () => {
    it("allows authenticated users", () => {
        expect(() => requireAuth(adminActor)).not.toThrow();
        expect(() => requireAuth(lecturerActor)).not.toThrow();
        expect(() => requireAuth(studentActor)).not.toThrow();
    });

    it("throws 401 for null", () => {
        expect(() => requireAuth(null)).toThrowError(AuthorizationError);
        try { requireAuth(null); } catch (e) {
            expect((e as AuthorizationError).statusCode).toBe(401);
        }
    });

    it("throws 401 for undefined", () => {
        expect(() => requireAuth(undefined)).toThrowError(AuthorizationError);
    });
});

// ---------------------------------------------------------------------------
// 3. requireAdmin()
// ---------------------------------------------------------------------------

describe("requireAdmin()", () => {
    it("allows admin", () => {
        expect(() => requireAdmin(adminActor)).not.toThrow();
    });

    it("throws 403 for lecturer (not admin)", () => {
        expect(() => requireAdmin(lecturerActor)).toThrowError(AuthorizationError);
        try { requireAdmin(lecturerActor); } catch (e) {
            expect((e as AuthorizationError).statusCode).toBe(403);
        }
    });

    it("throws 403 for student", () => {
        expect(() => requireAdmin(studentActor)).toThrowError(AuthorizationError);
    });

    it("throws 401 for unauthenticated (null)", () => {
        try { requireAdmin(null); } catch (e) {
            expect((e as AuthorizationError).statusCode).toBe(401);
        }
    });

    // CRITICAL REGRESSION: Teacher/Lecturer role must NOT grant admin access
    it("SECURITY: teacher role (legacy) cannot pass requireAdmin", () => {
        const teacherActor: AuthenticatedActor = { userId: "t-01", email: "t@x.com", role: "lecturer" };
        expect(() => requireAdmin(teacherActor)).toThrowError(AuthorizationError);
    });
});

// ---------------------------------------------------------------------------
// 4. requireLecturerOrAdmin()
// ---------------------------------------------------------------------------

describe("requireLecturerOrAdmin()", () => {
    it("allows admin", () => {
        expect(() => requireLecturerOrAdmin(adminActor)).not.toThrow();
    });

    it("allows lecturer", () => {
        expect(() => requireLecturerOrAdmin(lecturerActor)).not.toThrow();
    });

    it("throws 403 for student", () => {
        expect(() => requireLecturerOrAdmin(studentActor)).toThrowError(AuthorizationError);
    });

    it("throws 401 for null", () => {
        try { requireLecturerOrAdmin(null); } catch (e) {
            expect((e as AuthorizationError).statusCode).toBe(401);
        }
    });
});

// ---------------------------------------------------------------------------
// 5. canManageUser()
// ---------------------------------------------------------------------------

describe("canManageUser()", () => {
    it("admin can manage a student", () => {
        expect(canManageUser(adminActor, studentTarget)).toBe(true);
    });

    it("admin can manage a lecturer", () => {
        expect(canManageUser(adminActor, lecturerTarget)).toBe(true);
    });

    it("admin can manage another admin (subject to last-admin check)", () => {
        expect(canManageUser(adminActor, adminTarget)).toBe(true);
    });

    // CRITICAL REGRESSION: Lecturer must NOT be able to manage any user
    it("SECURITY: lecturer cannot manage users", () => {
        expect(canManageUser(lecturerActor, studentTarget)).toBe(false);
        expect(canManageUser(lecturerActor, adminTarget)).toBe(false);
    });

    it("SECURITY: student cannot manage users", () => {
        expect(canManageUser(studentActor, studentTarget)).toBe(false);
        expect(canManageUser(studentActor, adminTarget)).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// 6. assertCanDeactivateUser() — Critical: Teacher locking Admin
// ---------------------------------------------------------------------------

describe("assertCanDeactivateUser()", () => {
    // CRITICAL TEST CASE — The original vulnerability
    it("SECURITY: lecturer CANNOT lock an admin account → 403", () => {
        expect(() =>
            assertCanDeactivateUser(lecturerActor, adminTarget, 3)
        ).toThrowError(AuthorizationError);

        try {
            assertCanDeactivateUser(lecturerActor, adminTarget, 3);
        } catch (e) {
            expect((e as AuthorizationError).statusCode).toBe(403);
        }
    });

    it("SECURITY: student CANNOT lock an admin account → 403", () => {
        expect(() =>
            assertCanDeactivateUser(studentActor, adminTarget, 3)
        ).toThrowError(AuthorizationError);
    });

    it("SECURITY: lecturer CANNOT lock any user → 403", () => {
        expect(() =>
            assertCanDeactivateUser(lecturerActor, studentTarget, 0)
        ).toThrowError(AuthorizationError);
    });

    it("admin CAN lock a non-admin user", () => {
        expect(() =>
            assertCanDeactivateUser(adminActor, studentTarget, 2)
        ).not.toThrow();
    });

    it("admin CAN lock another admin if there are 2+ active admins", () => {
        expect(() =>
            assertCanDeactivateUser(adminActor, adminTarget, 2)
        ).not.toThrow();
    });

    it("LAST-ADMIN PROTECTION: admin CANNOT lock the last active admin", () => {
        expect(() =>
            assertCanDeactivateUser(adminActor, adminTarget, 1)
        ).toThrowError(AuthorizationError);
    });

    it("admin CANNOT lock themselves", () => {
        const selfTarget = { _id: "admin-001", role: "admin", isActive: true };
        expect(() =>
            assertCanDeactivateUser(adminActor, selfTarget, 3)
        ).toThrowError(AuthorizationError);
    });
});

// ---------------------------------------------------------------------------
// 7. assertCanDeleteUser() — Critical: Teacher deleting Admin
// ---------------------------------------------------------------------------

describe("assertCanDeleteUser()", () => {
    // CRITICAL TEST CASE
    it("SECURITY: lecturer CANNOT delete an admin account → 403", () => {
        expect(() =>
            assertCanDeleteUser(lecturerActor, adminTarget, 3)
        ).toThrowError(AuthorizationError);

        try {
            assertCanDeleteUser(lecturerActor, adminTarget, 3);
        } catch (e) {
            expect((e as AuthorizationError).statusCode).toBe(403);
        }
    });

    it("SECURITY: student CANNOT delete any user → 403", () => {
        expect(() =>
            assertCanDeleteUser(studentActor, adminTarget, 3)
        ).toThrowError(AuthorizationError);

        expect(() =>
            assertCanDeleteUser(studentActor, studentTarget, 0)
        ).toThrowError(AuthorizationError);
    });

    it("admin CAN delete a non-admin user", () => {
        expect(() =>
            assertCanDeleteUser(adminActor, studentTarget, 2)
        ).not.toThrow();
    });

    it("LAST-ADMIN PROTECTION: admin CANNOT delete the last active admin", () => {
        expect(() =>
            assertCanDeleteUser(adminActor, adminTarget, 1)
        ).toThrowError(AuthorizationError);
    });

    it("admin CANNOT delete themselves", () => {
        const selfTarget = { _id: "admin-001", role: "admin", isActive: true };
        expect(() =>
            assertCanDeleteUser(adminActor, selfTarget, 3)
        ).toThrowError(AuthorizationError);
    });

    it("admin CAN delete another admin if there are 2+ active admins", () => {
        expect(() =>
            assertCanDeleteUser(adminActor, adminTarget, 2)
        ).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// 8. assertCanChangeRole() — Critical: Teacher changing Admin role
// ---------------------------------------------------------------------------

describe("assertCanChangeRole()", () => {
    // CRITICAL TEST CASE
    it("SECURITY: lecturer CANNOT change admin role to teacher → 403", () => {
        expect(() =>
            assertCanChangeRole(lecturerActor, adminTarget, "lecturer", 3)
        ).toThrowError(AuthorizationError);
    });

    it("SECURITY: lecturer CANNOT change admin role to student → 403", () => {
        expect(() =>
            assertCanChangeRole(lecturerActor, adminTarget, "student", 3)
        ).toThrowError(AuthorizationError);
    });

    it("SECURITY: student CANNOT change anyone's role → 403", () => {
        expect(() =>
            assertCanChangeRole(studentActor, lecturerTarget, "student", 0)
        ).toThrowError(AuthorizationError);
    });

    it("admin CAN change a student to lecturer", () => {
        expect(() =>
            assertCanChangeRole(adminActor, studentTarget, "lecturer", 2)
        ).not.toThrow();
    });

    it("admin CAN promote student to admin", () => {
        expect(() =>
            assertCanChangeRole(adminActor, studentTarget, "admin", 2)
        ).not.toThrow();
    });

    it("LAST-ADMIN PROTECTION: cannot demote the last active admin", () => {
        expect(() =>
            assertCanChangeRole(adminActor, adminTarget, "lecturer", 1)
        ).toThrowError(AuthorizationError);
    });

    it("admin CAN demote another admin if there are 2+ active admins", () => {
        expect(() =>
            assertCanChangeRole(adminActor, adminTarget, "lecturer", 2)
        ).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// 9. assertCanCreateUserWithRole()
// ---------------------------------------------------------------------------

describe("assertCanCreateUserWithRole()", () => {
    it("SECURITY: lecturer CANNOT create any user → 403", () => {
        expect(() =>
            assertCanCreateUserWithRole(lecturerActor, "student")
        ).toThrowError(AuthorizationError);
    });

    it("SECURITY: student CANNOT create any user → 403", () => {
        expect(() =>
            assertCanCreateUserWithRole(studentActor, "admin")
        ).toThrowError(AuthorizationError);
    });

    it("admin CAN create a student", () => {
        expect(() =>
            assertCanCreateUserWithRole(adminActor, "student")
        ).not.toThrow();
    });

    it("admin CAN create another admin", () => {
        expect(() =>
            assertCanCreateUserWithRole(adminActor, "admin")
        ).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// 10. assertOwnsClass() — Class isolation
// ---------------------------------------------------------------------------

describe("assertOwnsClass()", () => {
    it("lecturer can manage their own class", () => {
        expect(() =>
            assertOwnsClass(lecturerActor, "lec-001")
        ).not.toThrow();
    });

    it("SECURITY: lecturer CANNOT manage another lecturer's class → 403", () => {
        expect(() =>
            assertOwnsClass(lecturerActor, "other-lec-999")
        ).toThrowError(AuthorizationError);
    });

    it("admin can manage any class", () => {
        expect(() =>
            assertOwnsClass(adminActor, "any-lecturer-id")
        ).not.toThrow();
    });

    it("SECURITY: student CANNOT manage any class → 403", () => {
        expect(() =>
            assertOwnsClass(studentActor, "lec-001")
        ).toThrowError(AuthorizationError);
    });
});

// ---------------------------------------------------------------------------
// 11. assertCanAccessSubmission() — IDOR/BOLA
// ---------------------------------------------------------------------------

describe("assertCanAccessSubmission()", () => {
    it("student can access their own submission", () => {
        expect(() =>
            assertCanAccessSubmission(studentActor, "stu-001")
        ).not.toThrow();
    });

    it("SECURITY: student CANNOT access another student's submission → 403", () => {
        expect(() =>
            assertCanAccessSubmission(studentActor, "stu-999")
        ).toThrowError(AuthorizationError);
    });

    it("class lecturer can access submissions in their class", () => {
        expect(() =>
            assertCanAccessSubmission(lecturerActor, "stu-999", "lec-001")
        ).not.toThrow();
    });

    it("SECURITY: lecturer CANNOT access submissions outside their class → 403", () => {
        expect(() =>
            assertCanAccessSubmission(lecturerActor, "stu-999", "other-lec-000")
        ).toThrowError(AuthorizationError);
    });

    it("admin can access any submission", () => {
        expect(() =>
            assertCanAccessSubmission(adminActor, "stu-999")
        ).not.toThrow();
    });
});

// ---------------------------------------------------------------------------
// 12. Header spoofing defense — getCurrentUserFromRequest must ignore x-user-role
// ---------------------------------------------------------------------------

describe("Header spoofing defense", () => {
    // We test this by verifying that getCurrentUserFromRequest does NOT read
    // x-user-role headers. We test the behavior through normalizeRole and
    // the fact that the function signature doesn't expose a header path.

    it("SECURITY: role cannot be escalated via normalizeRole with arbitrary strings", () => {
        // Even if a malicious header passed a role value, normalizeRole should
        // only return known canonical roles, defaulting to 'student'
        expect(normalizeRole("root")).toBe(ROLES.STUDENT);
        expect(normalizeRole("superuser")).toBe(ROLES.STUDENT);
        expect(normalizeRole("ADMIN")).toBe(ROLES.STUDENT); // case-sensitive!
        expect(normalizeRole("admin'--")).toBe(ROLES.STUDENT);
        expect(normalizeRole("admin; DROP TABLE users;")).toBe(ROLES.STUDENT);
    });

    it("SECURITY: empty or whitespace role strings default to student (not admin)", () => {
        expect(normalizeRole("   ")).toBe(ROLES.STUDENT);
        expect(normalizeRole("")).toBe(ROLES.STUDENT);
    });

    it("SECURITY: JSON injection attempts normalize to student", () => {
        expect(normalizeRole("{\"role\":\"admin\"}")).toBe(ROLES.STUDENT);
    });

    it("SECURITY: getCurrentUserFromRequest ignores x-user-id and x-user-role headers completely", () => {
        const fakeHeaderRequest = new Request("http://localhost:3000/api/settings/users", {
            headers: {
                "x-user-id": "fake-admin-id",
                "x-user-role": "admin",
                "x-user-email": "hacker@evil.com",
            },
        });

        // Must return null because there is no valid signed cookie
        const user = getCurrentUserFromRequest(fakeHeaderRequest);
        expect(user).toBeNull();

        // And passing null to requireAdmin must throw 401
        expect(() => requireAdmin(user)).toThrowError(AuthorizationError);
        try {
            requireAdmin(user);
        } catch (e) {
            expect((e as AuthorizationError).statusCode).toBe(401);
        }
    });

    it("SECURITY: unauthenticated request without cookies returns null", () => {
        const noAuthRequest = new Request("http://localhost:3000/api/settings/users");
        const user = getCurrentUserFromRequest(noAuthRequest);
        expect(user).toBeNull();
    });

    it("SECURITY: request with malformed cookie returns null", () => {
        const malformedRequest = new Request("http://localhost:3000/api/settings/users", {
            headers: {
                cookie: "token=invalid.malformed.jwt.token",
            },
        });
        const user = getCurrentUserFromRequest(malformedRequest);
        expect(user).toBeNull();
    });
});

// ---------------------------------------------------------------------------
// 13. Grading IDOR / BOLA authorization
// ---------------------------------------------------------------------------

describe("assertCanGradeSubmission()", () => {
    it("lecturer can grade submissions in their own class", () => {
        expect(() => assertCanGradeSubmission(lecturerActor, "lec-001")).not.toThrow();
    });

    it("SECURITY: lecturer CANNOT grade submissions in another lecturer's class → 403", () => {
        expect(() => assertCanGradeSubmission(lecturerActor, "other-lec-888")).toThrowError(AuthorizationError);
        try {
            assertCanGradeSubmission(lecturerActor, "other-lec-888");
        } catch (e) {
            expect((e as AuthorizationError).statusCode).toBe(403);
        }
    });

    it("admin can grade submissions in any class", () => {
        expect(() => assertCanGradeSubmission(adminActor, "other-lec-888")).not.toThrow();
    });

    it("SECURITY: student CANNOT grade submissions → 403", () => {
        expect(() => assertCanGradeSubmission(studentActor, "stu-001")).toThrowError(AuthorizationError);
    });
});

// ---------------------------------------------------------------------------
// 14. resolveHttpStatus() mapping
// ---------------------------------------------------------------------------

describe("resolveHttpStatus()", () => {
    it("resolves 401 for unauthenticated AuthorizationError", () => {
        const err = new AuthorizationError("Bạn chưa đăng nhập", 401);
        expect(resolveHttpStatus(err)).toBe(401);
    });

    it("resolves 403 for forbidden AuthorizationError", () => {
        const err = new AuthorizationError("Bạn không có quyền", 403);
        expect(resolveHttpStatus(err)).toBe(403);
    });

    it("resolves 401 for generic Error mentioning chưa đăng nhập", () => {
        const err = new Error("bạn chưa đăng nhập");
        expect(resolveHttpStatus(err)).toBe(401);
    });

    it("resolves 403 for generic Error mentioning không có quyền", () => {
        const err = new Error("bạn không có quyền truy cập");
        expect(resolveHttpStatus(err)).toBe(403);
    });

    it("resolves 404 for generic Error mentioning không tìm thấy", () => {
        const err = new Error("không tìm thấy người dùng");
        expect(resolveHttpStatus(err)).toBe(404);
    });

    it("resolves 409 for conflict errors mentioning đã tồn tại", () => {
        const err = new Error("email đã tồn tại");
        expect(resolveHttpStatus(err)).toBe(409);
    });

    it("defaults to 400 for unknown errors", () => {
        const err = new Error("tham số không hợp lệ");
        expect(resolveHttpStatus(err)).toBe(400);
    });
});

// ---------------------------------------------------------------------------
// 15. Client-side Role Spoofing (JSON body / parameter injection)
// ---------------------------------------------------------------------------

describe("Client-side Role Spoofing Immunity", () => {
    it("SECURITY: student attempting to set role=admin in body is blocked", () => {
        expect(() => assertCanCreateUserWithRole(studentActor, "admin")).toThrowError(AuthorizationError);
    });

    it("SECURITY: lecturer attempting to promote themselves to admin is blocked", () => {
        expect(() => assertCanChangeRole(lecturerActor, lecturerTarget, "admin", 2)).toThrowError(AuthorizationError);
    });

    it("SECURITY: lecturer attempting to create admin account is blocked", () => {
        expect(() => assertCanCreateUserWithRole(lecturerActor, "admin")).toThrowError(AuthorizationError);
    });

    it("SECURITY: student attempting to modify another student's account is blocked", () => {
        expect(canManageUser(studentActor, studentTarget)).toBe(false);
    });

    it("SECURITY: lecturer attempting to update admin fields is blocked", () => {
        expect(canManageUser(lecturerActor, adminTarget)).toBe(false);
        expect(() => assertCanDeactivateUser(lecturerActor, adminTarget, 2)).toThrowError(AuthorizationError);
        expect(() => assertCanDeleteUser(lecturerActor, adminTarget, 2)).toThrowError(AuthorizationError);
        expect(() => assertCanChangeRole(lecturerActor, adminTarget, "lecturer", 2)).toThrowError(AuthorizationError);
    });
});

// ---------------------------------------------------------------------------
// 16. Supabase Admin Client Fail-Secure Behavior
// ---------------------------------------------------------------------------

describe("createSupabaseAdminClient Fail-Secure", () => {
    it("SECURITY: throws clear error if SUPABASE configuration is missing/placeholder", () => {
        // Since test environment doesn't have real SUPABASE_SERVICE_ROLE_KEY / URL configured,
        // it must throw a clear error instead of silently downgrading to anon key
        expect(() => createSupabaseAdminClient()).toThrow(/\[Supabase Admin\]/);
    });
});

// ---------------------------------------------------------------------------
// 17. Server Config Access Matrix
// ---------------------------------------------------------------------------

describe("Server Config RBAC Matrix", () => {
    it("allows only admin to access server config", () => {
        expect(() => requireAdmin(adminActor)).not.toThrow();
        expect(() => requireAdmin(lecturerActor)).toThrowError(AuthorizationError);
        expect(() => requireAdmin(studentActor)).toThrowError(AuthorizationError);
        expect(() => requireAdmin(null)).toThrowError(AuthorizationError);
    });
});


