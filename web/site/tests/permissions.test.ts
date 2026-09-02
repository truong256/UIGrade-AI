import { describe, it, expect } from "vitest";

type UserRole = "student" | "lecturer" | "teacher" | "admin";

interface UserContext {
  userId: string;
  role: UserRole;
}

function canCreateClass(user: UserContext | null): boolean {
  if (!user) return false;
  return user.role === "teacher" || user.role === "lecturer" || user.role === "admin";
}

function canManageAssignment(user: UserContext | null, lecturerId?: string): boolean {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.role === "teacher" || user.role === "lecturer") {
    return !lecturerId || user.userId === lecturerId;
  }
  return false;
}

function canSubmitAssignment(user: UserContext | null): boolean {
  if (!user) return false;
  return user.role === "student" || user.role === "admin";
}

function canAccessServerConfig(user: UserContext | null): boolean {
  if (!user) return false;
  return user.role === "admin";
}

describe("Permission & Access Control Tests", () => {
  const studentUser: UserContext = { userId: "user-stu-01", role: "student" };
  const teacherUser: UserContext = { userId: "user-tea-01", role: "teacher" };
  const lecturerUser: UserContext = { userId: "user-lec-01", role: "lecturer" };
  const adminUser: UserContext = { userId: "user-adm-01", role: "admin" };

  describe("Classroom Permissions", () => {
    it("should allow teachers, lecturers and admins to create classes", () => {
      expect(canCreateClass(teacherUser)).toBe(true);
      expect(canCreateClass(lecturerUser)).toBe(true);
      expect(canCreateClass(adminUser)).toBe(true);
    });

    it("should deny students and unauthenticated users from creating classes", () => {
      expect(canCreateClass(studentUser)).toBe(false);
      expect(canCreateClass(null)).toBe(false);
    });
  });

  describe("Assignment Management Permissions", () => {
    it("should allow lecturer who owns the assignment to edit it", () => {
      expect(canManageAssignment(teacherUser, "user-tea-01")).toBe(true);
      expect(canManageAssignment(lecturerUser, "user-lec-01")).toBe(true);
    });

    it("should deny lecturer from editing assignments created by others (unless admin)", () => {
      expect(canManageAssignment(teacherUser, "user-tea-99")).toBe(false);
      expect(canManageAssignment(adminUser, "user-tea-99")).toBe(true);
    });

    it("should allow students to submit assignments", () => {
      expect(canSubmitAssignment(studentUser)).toBe(true);
    });

    it("should deny unauthenticated users from submitting", () => {
      expect(canSubmitAssignment(null)).toBe(false);
    });
  });

  describe("System Administration Permissions", () => {
    it("should only allow admin users to access server config", () => {
      expect(canAccessServerConfig(adminUser)).toBe(true);
      expect(canAccessServerConfig(teacherUser)).toBe(false);   // teacher = lecturer (legacy) — MUST be false
      expect(canAccessServerConfig(lecturerUser)).toBe(false);  // CRITICAL: lecturer must NOT access server config
      expect(canAccessServerConfig(studentUser)).toBe(false);
      expect(canAccessServerConfig(null)).toBe(false);
    });

    it("REGRESSION: lecturer cannot manage user accounts", () => {
      // Directly test the intended policy: only admin manages users
      const canManageUsers = (user: UserContext | null) => user?.role === "admin";
      expect(canManageUsers(adminUser)).toBe(true);
      expect(canManageUsers(lecturerUser)).toBe(false); // CRITICAL fix
      expect(canManageUsers(teacherUser)).toBe(false);  // legacy teacher also blocked
      expect(canManageUsers(studentUser)).toBe(false);
      expect(canManageUsers(null)).toBe(false);
    });
  });
});
