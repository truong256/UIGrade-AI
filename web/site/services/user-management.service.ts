/**
 * services/user-management.service.ts
 *
 * User management business logic with proper server-side authorization.
 *
 * SECURITY DESIGN:
 *  - The actor (caller) must be an AuthenticatedActor with a server-verified role.
 *  - Target users are ALWAYS loaded from the database before any authorization check.
 *    The role in the request body is NEVER used to determine target permissions.
 *  - All authorization is delegated to lib/authorization.ts — no duplicated logic.
 *  - Payload validation uses strict field allowlists — unknown fields are rejected.
 *  - Role normalization is applied both on input and output.
 *
 * AUTHORIZATION MATRIX:
 *  Action                        Admin  Lecturer  Student
 *  ─────────────────────────────────────────────────────
 *  List all users                YES    NO        NO
 *  Create user (any role)        YES    NO        NO
 *  Create admin user             YES    NO        NO
 *  Update non-admin user         YES    NO        NO
 *  Update admin user             YES    NO        NO
 *  Lock non-admin user           YES    NO        NO
 *  Lock admin (if not last)      YES    NO        NO
 *  Lock last active admin        NO     NO        NO
 *  Delete non-admin user         YES    NO        NO
 *  Delete admin (if not last)    YES    NO        NO
 *  Delete last active admin      NO     NO        NO
 *  Change role to admin          YES    NO        NO
 *  Demote last active admin      NO     NO        NO
 */

import User, { IUser } from "@/models/User.model";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import {
    type AuthenticatedActor,
    requireAdmin,
    assertCanDeactivateUser,
    assertCanDeleteUser,
    assertCanChangeRole,
    assertCanCreateUserWithRole,
    validateRoleInput,
    normalizeRole,
    ROLES,
} from "@/lib/authorization";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UserStatusFilter = "all" | "active" | "locked";
type RoleFilter = "all" | "admin" | "lecturer" | "student" | "teacher" | "User";

type ListUsersParams = {
    keyword?: string;
    roles?: RoleFilter;
    status?: UserStatusFilter;
    page?: number;
    limit?: number;
};

/**
 * Payload for creating a new user.
 * Uses strict `role` field (canonical). "roles" alias is not accepted.
 */
export type CreateUserPayload = {
    name?: string;
    email?: string;
    password?: string;
    studentCode?: string;
    role?: string;
    department?: string;
    cohort?: string;
};

/**
 * Payload for updating a user.
 * Strict allowlist — only known fields. Unknown fields cause a validation error.
 */
type UpdateUserPayload = {
    name?: string;
    email?: string;
    studentCode?: string;
    role?: string;
    department?: string;
    cohort?: string;
    isActive?: boolean;
    password?: string;
};

const KNOWN_UPDATE_FIELDS: (keyof UpdateUserPayload)[] = [
    "name", "email", "studentCode", "role", "department", "cohort", "isActive", "password",
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizeText(value: unknown, fallback = ""): string {
    if (typeof value === "string") return value.trim();
    if (value === null || value === undefined) return fallback;
    return String(value).trim();
}

function normalizeEmail(value: unknown): string {
    return normalizeText(value).toLowerCase();
}

function normalizePage(value: unknown, fallback: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
    return Math.floor(parsed);
}

function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function escapeRegExp(value: string): string {
    return value.replace(/[\\^$.*+?()[\]{}|]/g, "\\$&");
}

function toPublicUser(user: Partial<IUser> & Record<string, any>) {
    return {
        _id: String(user._id ?? ""),
        name: user.name ?? "",
        email: user.email ?? "",
        studentCode: user.studentCode ?? "",
        // Always return canonical role to the client
        role: normalizeRole(user.role),
        department: user.department ?? "",
        cohort: user.cohort ?? "",
        isVerified: Boolean(user.isVerified),
        isActive: user.isActive !== false,
        lastLoginAt: user.lastLoginAt ?? null,
        createdAt: user.createdAt ?? null,
        updatedAt: user.updatedAt ?? null,
    };
}

/**
 * Count the number of active admin accounts in the DB.
 * Used to enforce last-admin protection.
 */
async function countActiveAdmins(): Promise<number> {
    // Query both canonical and legacy role values
    return User.countDocuments({
        role: { $in: ["admin"] },
        isActive: { $ne: false },
    });
}

/**
 * In-process asynchronous mutex for serializing privileged mutations.
 * Prevents TOCTOU race conditions when locking, deleting, or demoting admins.
 */
export class AsyncMutex {
    private mutex = Promise.resolve();

    async runExclusive<T>(callback: () => Promise<T>): Promise<T> {
        let release: () => void;
        const waitPromise = new Promise<void>((resolve) => {
            release = resolve;
        });
        const currentLock = this.mutex;
        this.mutex = currentLock.then(() => waitPromise);
        await currentLock;
        try {
            return await callback();
        } finally {
            release!();
        }
    }
}

export const privilegedMutationMutex = new AsyncMutex();

/**
 * Validate that the incoming payload does not have unknown fields.
 * This prevents typo fields (e.g. "rolee") from being silently ignored.
 */
function rejectUnknownFields(body: Record<string, unknown>, allowed: string[]): void {
    const unknown = Object.keys(body).filter((k) => !allowed.includes(k));
    if (unknown.length > 0) {
        throw new Error(`Trường không hợp lệ: ${unknown.join(", ")}`);
    }
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const userManagementService = {
    /**
     * List users with filtering, pagination, and stats.
     * Requires actor to be an admin.
     */
    async listUsers(params: ListUsersParams = {}, actor: AuthenticatedActor) {
        requireAdmin(actor);

        const keyword = normalizeText(params.keyword);
        const roleFilter = (params.roles ?? "all") as RoleFilter;
        const status = (params.status ?? "all") as UserStatusFilter;
        const page = normalizePage(params.page, 1);
        const limit = Math.min(20, Math.max(1, normalizePage(params.limit, 10)));

        const query: Record<string, any> = {};

        if (roleFilter !== "all") {
            // Handle canonical + legacy aliases
            if (roleFilter === "lecturer") {
                query.role = { $in: ["lecturer", "teacher"] };
            } else if (roleFilter === "student") {
                query.role = { $in: ["student", "User"] };
            } else {
                query.role = roleFilter;
            }
        }

        if (status === "active") {
            query.isActive = { $ne: false };
        } else if (status === "locked") {
            query.isActive = false;
        }

        if (keyword) {
            const regex = new RegExp(escapeRegExp(keyword), "i");
            query.$or = [
                { name: regex },
                { email: regex },
                { studentCode: regex },
                { department: regex },
                { cohort: regex },
            ];
        }

        const skip = (page - 1) * limit;

        const [users, total, totalUsers, activeUsers, lockedUsers] = await Promise.all([
            User.find(query)
                .select("name email studentCode role department cohort isVerified isActive lastLoginAt createdAt updatedAt")
                .sort({ createdAt: -1, _id: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(query),
            User.countDocuments(),
            User.countDocuments({ isActive: { $ne: false } }),
            User.countDocuments({ isActive: false }),
        ]);

        return {
            stats: {
                total: totalUsers,
                active: activeUsers,
                locked: lockedUsers,
            },
            filters: { keyword, role: roleFilter, status, page, limit },
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.max(1, Math.ceil(total / limit)),
            },
            users: users.map((user) => toPublicUser(user as any)),
        };
    },

    /**
     * Create a new user.
     * Requires actor to be an admin.
     * Only admin can create admin accounts.
     */
    async createUser(payload: Record<string, unknown>, actor: AuthenticatedActor) {
        requireAdmin(actor);

        // Reject unknown fields
        const allowedFields = ["name", "email", "password", "studentCode", "role", "department", "cohort"];
        rejectUnknownFields(payload, allowedFields);

        const name = normalizeText(payload.name);
        const email = normalizeEmail(payload.email);
        const password = normalizeText(payload.password);
        const canonicalRole = validateRoleInput(payload.role !== undefined ? payload.role : "student");
        const studentCode = normalizeText(payload.studentCode).toUpperCase();
        const department = normalizeText(payload.department);
        const cohort = normalizeText(payload.cohort);

        // Authorization: can actor create a user with this role?
        assertCanCreateUserWithRole(actor, canonicalRole);

        // Validation
        if (!name) throw new Error("Tên người dùng không được để trống");
        if (!email || !isValidEmail(email)) throw new Error("Email không hợp lệ");
        if (password.length < 6) throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
        if (canonicalRole === ROLES.STUDENT && !studentCode) {
            throw new Error("Mã sinh viên là bắt buộc với tài khoản sinh viên");
        }

        const existedEmail = await User.findOne({ email }).lean();
        if (existedEmail) throw new Error("Email đã tồn tại");

        if (studentCode) {
            const existedCode = await User.findOne({ studentCode }).lean();
            if (existedCode) throw new Error("Mã sinh viên đã tồn tại");
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        // Store canonical role (or keep legacy if DB still uses teacher/User)
        // We store the canonical role value going forward
        const dbRole = canonicalRole === ROLES.LECTURER ? "lecturer"
            : canonicalRole === ROLES.STUDENT ? "student"
            : "admin";

        const created = await User.create({
            name,
            email,
            password: hashedPassword,
            studentCode: studentCode || undefined,
            role: dbRole,
            department,
            cohort,
            isActive: true,
            isVerified: true,
        });

        return toPublicUser(created.toObject() as any);
    },

    /**
     * Update a user's profile, role, or status.
     * Requires actor to be an admin.
     * Target user is loaded from DB inside privilegedMutationMutex — role from request body is NEVER used for authorization.
     * Atomic lock guarantees race-safe Last-Admin invariant under concurrent mutations.
     */
    async updateUser(id: string, payload: Record<string, unknown>, actor: AuthenticatedActor) {
        requireAdmin(actor);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error("ID người dùng không hợp lệ");
        }

        // Reject unknown fields to prevent silent data corruption
        rejectUnknownFields(payload, [...KNOWN_UPDATE_FIELDS]);

        return privilegedMutationMutex.runExclusive(async () => {
            // Load the target user from DB INSIDE atomic mutex — do NOT trust payload for role info
            const targetUser = await User.findById(id).lean();
            if (!targetUser) {
                throw new Error("Không tìm thấy người dùng");
            }

            const nextIsActive = typeof payload.isActive === "boolean" ? payload.isActive : undefined;

            // Authorization checks based on DB-loaded target
            if (nextIsActive === false) {
                const activeAdminCount = await countActiveAdmins();
                assertCanDeactivateUser(actor, targetUser as any, activeAdminCount);
            }

            let dbRole: string | undefined;
            if (payload.role !== undefined) {
                const canonicalRole = validateRoleInput(payload.role);
                const activeAdminCount = await countActiveAdmins();
                assertCanChangeRole(actor, targetUser as any, canonicalRole, activeAdminCount);
                dbRole = canonicalRole;
            }

            // Field-level extraction & validation
            const name = payload.name !== undefined ? normalizeText(payload.name) : undefined;
            const email = payload.email !== undefined ? normalizeEmail(payload.email) : undefined;
            const studentCode = payload.studentCode !== undefined
                ? normalizeText(payload.studentCode).toUpperCase()
                : undefined;
            const department = payload.department !== undefined ? normalizeText(payload.department) : undefined;
            const cohort = payload.cohort !== undefined ? String(payload.cohort) : undefined;
            const password = payload.password !== undefined ? normalizeText(payload.password) : undefined;

            if (name !== undefined && !name) throw new Error("Tên không được để trống");

            if (email !== undefined) {
                if (!email || !isValidEmail(email)) throw new Error("Email không hợp lệ");
                const existed = await User.findOne({ email, _id: { $ne: id } }).lean();
                if (existed) throw new Error("Email đã tồn tại");
            }

            if (studentCode !== undefined && studentCode) {
                if (studentCode.length < 3) throw new Error("Mã sinh viên không hợp lệ");
                const existed = await User.findOne({ studentCode, _id: { $ne: id } }).lean();
                if (existed) throw new Error("Mã sinh viên đã tồn tại");
            }

            const finalRole = dbRole ?? normalizeRole((targetUser as any).role);
            const finalStudentCode =
                studentCode !== undefined ? (studentCode || undefined) : (targetUser as any).studentCode;

            if (finalRole === ROLES.STUDENT && !finalStudentCode) {
                throw new Error("Mã sinh viên là bắt buộc với tài khoản sinh viên");
            }

            // Build update object
            const updateData: Record<string, unknown> = {};
            if (name !== undefined) updateData.name = name;
            if (email !== undefined) updateData.email = email;
            if (dbRole !== undefined) updateData.role = dbRole;
            if (studentCode !== undefined) updateData.studentCode = studentCode || undefined;
            if (department !== undefined) updateData.department = department;
            if (cohort !== undefined) updateData.cohort = cohort;
            if (typeof nextIsActive === "boolean") updateData.isActive = nextIsActive;

            if (password !== undefined && password) {
                if (password.length < 6) throw new Error("Mật khẩu phải có ít nhất 6 ký tự");
                updateData.password = await bcrypt.hash(password, 12);
            }

            const updated = await User.findByIdAndUpdate(
                id,
                { $set: updateData },
                { new: true, runValidators: true }
            )
                .select("name email studentCode role department cohort isVerified isActive lastLoginAt createdAt updatedAt")
                .lean();

            if (!updated) throw new Error("Không tìm thấy người dùng");

            return toPublicUser(updated as any);
        });
    },

    /**
     * Delete a user permanently.
     * Requires actor to be an admin.
     * Target user is loaded and validated inside privilegedMutationMutex.
     * Atomic lock guarantees race-safe Last-Admin invariant under concurrent mutations.
     */
    async deleteUser(id: string, actor: AuthenticatedActor) {
        requireAdmin(actor);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error("ID người dùng không hợp lệ");
        }

        return privilegedMutationMutex.runExclusive(async () => {
            // Load target from DB inside atomic mutex — never trust client-provided role
            const targetUser = await User.findById(id).lean();
            if (!targetUser) {
                throw new Error("Không tìm thấy người dùng để xóa");
            }

            const activeAdminCount = await countActiveAdmins();
            assertCanDeleteUser(actor, targetUser as any, activeAdminCount);

            await User.findByIdAndDelete(id);

            return { deleted: id };
        });
    },
};