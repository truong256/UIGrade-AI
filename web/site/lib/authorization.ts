/**
 * lib/authorization.ts
 *
 * Centralized RBAC / authorization layer for UIGrade AI.
 *
 * DESIGN PRINCIPLES:
 *  - Role source is ALWAYS from server-verified JWT or DB profile — never client headers.
 *  - A single canonical role set is enforced: "admin" | "lecturer" | "student".
 *  - Legacy aliases (teacher → lecturer, User → student) are normalized transparently.
 *  - Every sensitive operation has an explicit authorization check here.
 *  - UI visibility ≠ security — server must always re-check.
 */

// ---------------------------------------------------------------------------
// Canonical role type
// ---------------------------------------------------------------------------

export const ROLES = {
    ADMIN: "admin",
    LECTURER: "lecturer",
    STUDENT: "student",
} as const;

export type CanonicalRole = (typeof ROLES)[keyof typeof ROLES];

// All known role aliases, including legacy values from MongoDB (teacher, User)
// and Supabase types.
type RawRole = CanonicalRole | "teacher" | "User" | string | undefined | null;

/**
 * Normalize any raw role string to a canonical role.
 * - "teacher" → "lecturer"
 * - "User"    → "student"
 * - Unknown   → "student" (safe default — least privilege)
 */
export function normalizeRole(raw: RawRole): CanonicalRole {
    if (raw === "admin") return ROLES.ADMIN;
    if (raw === "lecturer") return ROLES.LECTURER;
    if (raw === "teacher") return ROLES.LECTURER; // legacy alias
    if (raw === "student") return ROLES.STUDENT;
    if (raw === "User") return ROLES.STUDENT; // legacy alias
    return ROLES.STUDENT; // safe default — never escalate
}

// ---------------------------------------------------------------------------
// Actor type (server-verified identity only)
// ---------------------------------------------------------------------------

export interface AuthenticatedActor {
    userId: string;
    email: string;
    role: CanonicalRole;
    studentCode?: string;
}

// ---------------------------------------------------------------------------
// Authorization errors
// ---------------------------------------------------------------------------

export class AuthorizationError extends Error {
    readonly statusCode: number;

    constructor(message: string, statusCode: 401 | 403 = 403) {
        super(message);
        this.name = "AuthorizationError";
        this.statusCode = statusCode;
    }
}

// ---------------------------------------------------------------------------
// Core guards — throw AuthorizationError on failure
// ---------------------------------------------------------------------------

/**
 * Ensures the actor is authenticated.
 * Throws 401 if actor is null/undefined.
 */
export function requireAuth(actor: AuthenticatedActor | null | undefined): asserts actor is AuthenticatedActor {
    if (!actor?.userId) {
        throw new AuthorizationError("Bạn chưa đăng nhập", 401);
    }
}

/**
 * Ensures the actor has the "admin" role.
 * Throws 403 if not admin.
 */
export function requireAdmin(actor: AuthenticatedActor | null | undefined): asserts actor is AuthenticatedActor {
    requireAuth(actor);
    if (actor.role !== ROLES.ADMIN) {
        throw new AuthorizationError("Bạn không có quyền thực hiện thao tác này — chỉ Admin mới được phép");
    }
}

/**
 * Ensures the actor is a lecturer or admin.
 * Throws 403 if student or unauthenticated.
 */
export function requireLecturerOrAdmin(actor: AuthenticatedActor | null | undefined): asserts actor is AuthenticatedActor {
    requireAuth(actor);
    if (actor.role !== ROLES.ADMIN && actor.role !== ROLES.LECTURER) {
        throw new AuthorizationError("Bạn không có quyền thực hiện thao tác này");
    }
}

// ---------------------------------------------------------------------------
// User management authorization
// ---------------------------------------------------------------------------

interface MinimalUserRecord {
    _id?: unknown;
    id?: unknown;
    role?: string;
    isActive?: boolean;
}

/**
 * Returns true if the actor is allowed to view/modify the target user.
 *
 * Rules:
 *  - Admin can manage any non-admin user.
 *  - Admin modifying another admin account → requires additional last-admin checks (handled separately).
 *  - Lecturer/Student → NEVER allowed in user management.
 */
export function canManageUser(actor: AuthenticatedActor, target: MinimalUserRecord): boolean {
    if (actor.role !== ROLES.ADMIN) return false;

    const targetRole = normalizeRole(target.role);

    // Admin can manage anyone except we need last-admin guard for admin targets
    // (that guard is done separately with canDeactivateAdmin / canDeleteAdmin)
    if (targetRole === ROLES.ADMIN) {
        // Allow read/edit of admin profile, but destructive ops need extra check
        return true;
    }

    return true;
}

/**
 * Check whether actor (admin) can deactivate / lock a target user.
 *
 * Protection rules:
 *  1. Lecturer/Student can NEVER lock anyone.
 *  2. Admin cannot lock themselves (via this endpoint).
 *  3. Admin cannot lock the last remaining active admin.
 */
export function assertCanDeactivateUser(
    actor: AuthenticatedActor,
    target: MinimalUserRecord,
    activeAdminCount: number
): void {
    requireAdmin(actor);

    const targetId = String(target._id ?? target.id ?? "");
    const targetRole = normalizeRole(target.role);

    if (actor.userId === targetId) {
        throw new AuthorizationError("Bạn không thể khóa chính mình");
    }

    if (targetRole === ROLES.ADMIN && activeAdminCount <= 1) {
        throw new AuthorizationError(
            "Không thể khóa tài khoản Admin cuối cùng đang hoạt động trong hệ thống"
        );
    }
}

/**
 * Check whether actor can delete a target user.
 *
 * Protection rules:
 *  1. Lecturer/Student can NEVER delete anyone.
 *  2. Admin cannot delete themselves.
 *  3. Admin cannot delete the last active admin.
 */
export function assertCanDeleteUser(
    actor: AuthenticatedActor,
    target: MinimalUserRecord,
    activeAdminCount: number
): void {
    requireAdmin(actor);

    const targetId = String(target._id ?? target.id ?? "");
    const targetRole = normalizeRole(target.role);

    if (actor.userId === targetId) {
        throw new AuthorizationError("Bạn không thể xóa chính mình");
    }

    if (targetRole === ROLES.ADMIN && activeAdminCount <= 1) {
        throw new AuthorizationError(
            "Không thể xóa tài khoản Admin cuối cùng đang hoạt động trong hệ thống"
        );
    }
}

/**
 * Check whether actor can change a target user's role.
 *
 * Rules:
 *  - Only admin can change roles.
 *  - Cannot demote the last active admin.
 *  - Cannot promote to admin unless actor is admin.
 */
export function assertCanChangeRole(
    actor: AuthenticatedActor,
    target: MinimalUserRecord,
    newRole: string,
    activeAdminCount: number
): void {
    requireAdmin(actor);

    const targetRole = normalizeRole(target.role);
    const canonicalNewRole = normalizeRole(newRole);

    // Demoting the last active admin?
    if (targetRole === ROLES.ADMIN && canonicalNewRole !== ROLES.ADMIN && activeAdminCount <= 1) {
        throw new AuthorizationError(
            "Không thể hạ quyền Admin cuối cùng đang hoạt động trong hệ thống"
        );
    }
}

/**
 * Check whether actor can create a user with the specified role.
 * Only admin can create admin accounts.
 */
export function assertCanCreateUserWithRole(actor: AuthenticatedActor, role: string): void {
    requireAdmin(actor);

    const canonicalRole = normalizeRole(role);
    if (canonicalRole === ROLES.ADMIN) {
        // Only admin can create another admin — already checked above (requireAdmin)
        return;
    }
}

// ---------------------------------------------------------------------------
// Class ownership authorization
// ---------------------------------------------------------------------------

/**
 * Check whether actor owns a class or is admin.
 * Lecturer can only manage their own classes.
 */
export function assertOwnsClass(
    actor: AuthenticatedActor,
    classLecturerId: string | undefined | null
): void {
    requireLecturerOrAdmin(actor);

    if (actor.role === ROLES.ADMIN) return; // admin can manage any class

    if (!classLecturerId || actor.userId !== String(classLecturerId)) {
        throw new AuthorizationError("Bạn không có quyền quản lý lớp học này");
    }
}

/**
 * Check whether actor can grade a submission (must own the class).
 */
export function assertCanGradeSubmission(
    actor: AuthenticatedActor,
    classLecturerId: string | undefined | null
): void {
    assertOwnsClass(actor, classLecturerId);
}

// ---------------------------------------------------------------------------
// Submission ownership authorization
// ---------------------------------------------------------------------------

/**
 * Check whether actor can read/write their own submission.
 * Admins and the class lecturer can also access.
 */
export function assertCanAccessSubmission(
    actor: AuthenticatedActor,
    submissionOwnerId: string,
    classLecturerId?: string | null
): void {
    requireAuth(actor);

    if (actor.role === ROLES.ADMIN) return;
    if (actor.userId === submissionOwnerId) return;

    if (actor.role === ROLES.LECTURER && classLecturerId && actor.userId === String(classLecturerId)) {
        return;
    }

    throw new AuthorizationError("Bạn không có quyền truy cập bài nộp này");
}

// ---------------------------------------------------------------------------
// HTTP status resolver (standardized)
// ---------------------------------------------------------------------------

/**
 * Map an error to an HTTP status code.
 * Uses the statusCode property if available (AuthorizationError),
 * otherwise falls back to keyword matching.
 */
export function resolveHttpStatus(error: unknown): number {
    if (error instanceof AuthorizationError) {
        return error.statusCode;
    }

    if (error instanceof Error) {
        const msg = error.message.toLowerCase();
        if (msg.includes("chưa đăng nhập") || msg.includes("unauthenticated")) return 401;
        if (msg.includes("không có quyền") || msg.includes("forbidden")) return 403;
        if (msg.includes("không tìm thấy") || msg.includes("not found")) return 404;
        if (msg.includes("đã tồn tại") || msg.includes("conflict")) return 409;
    }

    return 400;
}
