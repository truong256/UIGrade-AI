import type { CurrentUserPayload } from "@/lib/current-user";
import { requireAdmin, validateRoleInput } from "@/lib/authorization";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UserStatus } from "@/types/database.types";

type LegacyUiRole = "admin" | "teacher" | "User";
type CanonicalRole = "admin" | "lecturer" | "student";

type UserListInput = {
    keyword?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
};

type UserMutationInput = {
    name?: string;
    email?: string;
    password?: string;
    studentCode?: string;
    role?: string;
    roles?: string;
    department?: string;
    cohort?: string;
    isActive?: boolean;
};

function canonicalRole(value: unknown): CanonicalRole {
    const role = validateRoleInput(value || "student");
    if (role === "admin") return "admin";
    if (role === "lecturer") return "lecturer";
    return "student";
}

function legacyUiRole(role: string): LegacyUiRole {
    if (role === "admin") return "admin";
    if (role === "lecturer") return "teacher";
    return "User";
}

function normalizeStatus(isActive: boolean | undefined): UserStatus {
    return isActive === false ? "inactive" : "active";
}

function isEducationEmail(value: string) {
    const email = value.trim().toLowerCase();
    const domain = email.split("@")[1] || "";
    return Boolean(email && (domain === "edu.vn" || domain.endsWith(".edu.vn")));
}

function ensureUuid(value: string) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
        throw new Error("ID người dùng không hợp lệ");
    }
}

function toUserItem(row: Record<string, any>) {
    return {
        _id: String(row.id),
        name: String(row.full_name || "Người dùng"),
        email: String(row.email || ""),
        studentCode: row.student_code || "",
        role: legacyUiRole(String(row.role || "student")),
        department: row.department || "",
        cohort: row.cohort || "",
        isVerified: true,
        isActive: row.status === "active",
        lastLoginAt: row.last_sign_in_at || null,
        createdAt: row.created_at || null,
        updatedAt: row.updated_at || null,
    };
}

function safePage(value: unknown, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

async function attachLastSignIn(users: Array<Record<string, any>>) {
    if (!users.length) return users;
    const admin = createSupabaseAdminClient();
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) return users;
    const byId = new Map(data.users.map((user) => [user.id, user.last_sign_in_at || null]));
    return users.map((row) => ({ ...row, last_sign_in_at: byId.get(String(row.id)) || null }));
}

export const userManagementService = {
    async listUsers(actor: CurrentUserPayload | null, input: UserListInput = {}) {
        requireAdmin(actor);
        const admin = createSupabaseAdminClient();
        const keyword = String(input.keyword || "").trim();
        const roleInput = String(input.role || "all");
        const statusInput = String(input.status || "all");
        const page = safePage(input.page, 1);
        const limit = Math.min(safePage(input.limit, 10), 100);
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        let query = admin
            .from("profiles")
            .select("id,full_name,email,role,status,student_code,department,cohort,created_at,updated_at", { count: "exact" });

        if (keyword) {
            const escaped = keyword.replace(/[%_,()]/g, " ").trim();
            query = query.or(`full_name.ilike.%${escaped}%,email.ilike.%${escaped}%,student_code.ilike.%${escaped}%`);
        }
        if (roleInput !== "all") query = query.eq("role", canonicalRole(roleInput));
        if (statusInput === "active") query = query.eq("status", "active");
        if (statusInput === "locked") query = query.neq("status", "active");

        const { data, error, count } = await query.order("created_at", { ascending: false }).range(from, to);
        if (error) throw new Error(`Không thể tải danh sách người dùng: ${error.message}`);

        const [{ count: totalCount, error: totalError }, { count: activeCount, error: activeError }] = await Promise.all([
            admin.from("profiles").select("id", { count: "exact", head: true }),
            admin.from("profiles").select("id", { count: "exact", head: true }).eq("status", "active"),
        ]);
        if (totalError || activeError) throw new Error("Không thể tải thống kê người dùng");

        const enriched = await attachLastSignIn((data || []) as Array<Record<string, any>>);
        const total = count || 0;
        const allTotal = totalCount || 0;
        const active = activeCount || 0;
        return {
            stats: { total: allTotal, active, locked: Math.max(0, allTotal - active) },
            filters: { keyword, role: roleInput, status: statusInput, page, limit },
            pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
            users: enriched.map(toUserItem),
        };
    },

    async createUser(actor: CurrentUserPayload | null, input: UserMutationInput) {
        requireAdmin(actor);
        const admin = createSupabaseAdminClient();
        const name = String(input.name || "").trim();
        const email = String(input.email || "").trim().toLowerCase();
        const password = String(input.password || "");
        const role = canonicalRole(input.role || "student");

        if (name.length < 2) throw new Error("Tên người dùng phải có ít nhất 2 ký tự");
        if (!isEducationEmail(email)) throw new Error("Tài khoản mới phải sử dụng email giáo dục .edu.vn");
        if (password.length < 8) throw new Error("Mật khẩu phải có ít nhất 8 ký tự");
        if (role === "student" && !String(input.studentCode || "").trim()) {
            throw new Error("Mã sinh viên là bắt buộc với tài khoản sinh viên");
        }

        const { data: created, error: createError } = await admin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: name,
                role: role === "admin" ? "pending" : role,
                student_code: role === "student" ? String(input.studentCode || "").trim() : undefined,
            },
        });
        if (createError || !created.user) throw new Error(createError?.message || "Không thể tạo tài khoản Auth");

        const profileUpdate = {
            full_name: name,
            email,
            role,
            status: "active" as const,
            student_code: role === "student" ? String(input.studentCode || "").trim() || null : null,
            department: String(input.department || "").trim() || null,
            cohort: String(input.cohort || "").trim() || null,
        };
        const { data: profile, error: profileError } = await admin
            .from("profiles")
            .update(profileUpdate)
            .eq("id", created.user.id)
            .select("id,full_name,email,role,status,student_code,department,cohort,created_at,updated_at")
            .single();
        if (profileError) {
            await admin.auth.admin.deleteUser(created.user.id).catch(() => undefined);
            throw new Error(`Không thể hoàn thiện hồ sơ người dùng: ${profileError.message}`);
        }

        await admin.auth.admin.updateUserById(created.user.id, {
            user_metadata: { full_name: name, role },
        });
        return toUserItem(profile as Record<string, any>);
    },

    async updateUser(actor: CurrentUserPayload | null, userId: string, input: UserMutationInput) {
        requireAdmin(actor);
        ensureUuid(userId);
        const admin = createSupabaseAdminClient();
        const { data: existing, error: existingError } = await admin
            .from("profiles")
            .select("id,full_name,email,role,status,student_code,department,cohort,created_at,updated_at")
            .eq("id", userId)
            .maybeSingle();
        if (existingError) throw new Error(`Không thể tải người dùng: ${existingError.message}`);
        if (!existing) throw new Error("Không tìm thấy người dùng");

        const desiredRole = input.roles !== undefined || input.role !== undefined
            ? canonicalRole(input.roles ?? input.role)
            : canonicalRole(existing.role);
        const desiredStatus: UserStatus = input.isActive === undefined ? existing.status : normalizeStatus(input.isActive);
        const name = input.name === undefined ? existing.full_name : String(input.name).trim();
        const email = input.email === undefined ? existing.email : String(input.email).trim().toLowerCase();
        if (!name) throw new Error("Tên người dùng không được để trống");
        if (!email || !email.includes("@")) throw new Error("Email không hợp lệ");
        if (desiredRole === "student" && !String(input.studentCode ?? existing.student_code ?? "").trim()) {
            throw new Error("Mã sinh viên là bắt buộc với tài khoản sinh viên");
        }

        const authUpdate: Record<string, any> = {
            email,
            user_metadata: { full_name: name, role: desiredRole },
        };
        if (input.password) {
            if (String(input.password).length < 8) throw new Error("Mật khẩu phải có ít nhất 8 ký tự");
            authUpdate.password = String(input.password);
        }
        const { error: authError } = await admin.auth.admin.updateUserById(userId, authUpdate);
        if (authError) throw new Error(`Không thể cập nhật tài khoản Auth: ${authError.message}`);

        const { data: updated, error: updateError } = await admin
            .from("profiles")
            .update({
                full_name: name,
                email,
                role: desiredRole,
                status: desiredStatus,
                student_code: desiredRole === "student" ? String(input.studentCode ?? existing.student_code ?? "").trim() || null : null,
                department: input.department === undefined ? existing.department : String(input.department).trim() || null,
                cohort: input.cohort === undefined ? existing.cohort : String(input.cohort).trim() || null,
            })
            .eq("id", userId)
            .select("id,full_name,email,role,status,student_code,department,cohort,created_at,updated_at")
            .single();
        if (updateError) throw new Error(`Không thể cập nhật hồ sơ: ${updateError.message}`);
        return toUserItem(updated as Record<string, any>);
    },

    async deleteUser(actor: CurrentUserPayload | null, userId: string) {
        requireAdmin(actor);
        ensureUuid(userId);
        if (actor?.userId === userId) throw new Error("Bạn không thể xóa chính tài khoản đang đăng nhập");
        const admin = createSupabaseAdminClient();
        const { error } = await admin.auth.admin.deleteUser(userId);
        if (error) throw new Error(`Không thể xóa người dùng: ${error.message}`);
        return { deletedId: userId };
    },
};
