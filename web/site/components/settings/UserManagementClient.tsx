"use client";

import {useCallback, useEffect, useMemo, useRef, useState} from "react";

type UserRole = "admin" | "teacher" | "User";
type UserStatus = "all" | "active" | "locked";

type UserItem = {
    _id: string;
    name: string;
    email: string;
    studentCode?: string;
    role: UserRole;
    department?: string;
    cohort?: string;
    isVerified: boolean;
    isActive: boolean;
    lastLoginAt?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
};

type UserListResponse = {
    stats: {
        total: number;
        active: number;
        locked: number;
    };
    filters: {
        keyword: string;
        role: UserRole | "all";
        status: UserStatus;
        page: number;
        limit: number;
    };
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
    users: UserItem[];
};

type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data?: T;
};

type CreateUserForm = {
    name: string;
    email: string;
    password: string;
    studentCode: string;
    role: UserRole;
    department: string;
    cohort: string;
};

// update
type EditUserForm = {
    _id: string;
    name: string;
    email: string;
    studentCode: string;
    role: UserRole;
    department: string;
    cohort: string;
    isActive: boolean;
    password: string;
}
const defaultCreateForm: CreateUserForm = {
    name: "",
    email: "",
    password: "",
    studentCode: "",
    role: "User",
    department: "",
    cohort: "",
};

const emptyResponse: UserListResponse = {
    stats: {
        total: 0,
        active: 0,
        locked: 0,
    },
    filters: {
        keyword: "",
        role: "all",
        status: "all",
        page: 1,
        limit: 10,
    },
    pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
    },
    users: [],
};

async function parseJsonSafe<T>(response: Response): Promise<T | Record<string, never>> {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

function formatDate(value?: string | null) {
    if (!value) return "Chưa có";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Chưa có";

    return new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

function getRoleLabel(role: UserRole) {
    if (role === "admin") return "Quản trị";
    if (role === "teacher") return "Giảng viên";
    return "Sinh viên";
}

function getRoleBadgeClass(role: UserRole) {
    if (role === "admin") return "bg-violet-50 text-violet-600";
    if (role === "teacher") return "bg-sky-50 text-sky-700 font-semibold";
    return "bg-slate-100 text-slate-600";
}

function getInitials(name: string) {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}

export function UserManagementClient() {
    const [responseData, setResponseData] = useState<UserListResponse>(emptyResponse);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [keyword, setKeyword] = useState("");
    const [role, setRole] = useState<UserRole | "all">("all");
    const [status, setStatus] = useState<UserStatus>("all");
    const [page, setPage] = useState(1);
    const [createForm, setCreateForm] = useState<CreateUserForm>(defaultCreateForm);
    const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editForm, setEditForm] = useState<EditUserForm>({
        _id: "",
        name: "",
        email: "",
        studentCode: "",
        role: "User",
        department: "",
        cohort: "",
        isActive: true,
        password: "",
    });

        const loadUsers = useCallback(async () => {
            try {
                setLoading(true);
                setError("");

                const params = new URLSearchParams({
                    keyword,
                    role,
                    status,
                    page: String(page),
                    limit: "5",
                });

                console.log("fetch page =", page, params.toString());

                const response = await fetch(`/api/settings/users?${params.toString()}`, {
                    cache: "no-store",
                });

                const json = await response.json();
                setResponseData(json.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Không thể tải danh sách người dùng");
            } finally {
                setLoading(false);
            }
        }, [keyword, role, status, page]);

        useEffect(() => {
            void loadUsers();
        }, [loadUsers]);

        useEffect(() => {
            setPage(1);
        }, [keyword, role, status]);

    const roleTabs = useMemo(
        () => [
            { value: "all", label: "Tất cả người dùng" },
            { value: "teacher", label: "Giảng viên" },
            { value: "User", label: "Sinh viên" },
            { value: "admin", label: "Quản trị" },
        ],
        []
    );

    const handleCreateUser = async () => {
        try {
            setSubmitting(true);
            setError("");
            setMessage("");

            const response = await fetch("/api/settings/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(createForm),
            });

            const json = (await parseJsonSafe<ApiResponse<UserItem>>(response)) as ApiResponse<UserItem>;

            if (!response.ok || !json.success) {
                throw new Error(json.message || "Không thể tạo người dùng");
            }

            setShowCreateModal(false);
            setCreateForm(defaultCreateForm);
            setMessage(json.message || "Tạo người dùng thành công");
            setPage(1);
            await loadUsers();
        } catch (submitError) {
            setError(submitError instanceof Error ? submitError.message : "Không thể tạo người dùng");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleUser = async (user: UserItem) => {
        try {
            setSubmitting(true);
            setError("");
            setMessage("");

            const response = await fetch(`/api/settings/users/${user._id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    isActive: !user.isActive,
                }),
            });

            const json = (await parseJsonSafe<ApiResponse<UserItem>>(response)) as ApiResponse<UserItem>;

            if (!response.ok || !json.success) {
                throw new Error(json.message || "Không thể cập nhật trạng thái người dùng");
            }

            setMessage(json.message || "Cập nhật trạng thái thành công");
            await loadUsers();
        } catch (toggleError) {
            setError(toggleError instanceof Error ? toggleError.message : "Không thể cập nhật trạng thái người dùng");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteUser = async (user: UserItem) => {
        const accepted = window.confirm(`Bạn có chắc muốn xóa người dùng ${user.name}?`);
        if (!accepted) return;

        try {
            setSubmitting(true);
            setError("");
            setMessage("");

            const response = await fetch(`/api/settings/users/${user._id}`, {
                method: "DELETE",
            });

            const json = (await parseJsonSafe<ApiResponse<{ deletedId: string }>>(response)) as ApiResponse<{ deletedId: string }>;

            if (!response.ok || !json.success) {
                throw new Error(json.message || "Không thể xóa người dùng");
            }

            setMessage(json.message || "Xóa người dùng thành công");
            await loadUsers();
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : "Không thể xóa người dùng");
        } finally {
            setSubmitting(false);
        }
    };

    // hàm chuyển trang
    const totalPages = Number(responseData.pagination.totalPages || 1);
    const handlePageChange = (nextPage: number) => {
        console.log("clicked nextPage =", nextPage, "current =", page, "totalPages =", totalPages, "loading =", loading);

        if(loading) return;
        const safePage = Math.max(1,Math.min(nextPage, totalPages));

        if (safePage === page) return;
        setPage(safePage)
    }

    // hàm mở update
    const handleOpenEditModal = (user: UserItem) => {
        setEditForm({
            _id: user._id,
            name: user.name || "",
            email: user.email || "",
            studentCode: user.studentCode || "",
            role: user.role,
            department: user.department || "",
            cohort: user.cohort || "",
            isActive: user.isActive,
            password: "",
        })
        setShowEditModal(true)
    }

    // hàm lưu chỉnh sửa
    const handleUpdateuser = async () => {
        try {
            setSubmitting(true);
            setError("");
            setMessage("");

            const respone = await fetch(`/api/settings/users/${editForm._id}`,{
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: editForm.name,
                    email: editForm.email,
                    studentCode: editForm.studentCode,
                    roles: editForm.role,
                    department: editForm.department,
                    cohort: editForm.cohort,
                    isActive: editForm.isActive,
                    password: editForm.password || undefined,
                }),
            });

            const json = (await parseJsonSafe<ApiResponse<UserItem>>(respone)) as ApiResponse<UserItem>;

            if (!respone.ok || !json.success) {
                throw new Error("không thể cập nhập người dùng")
            }

            setShowEditModal(false)
            setMessage(json.message || "cập nhập người dùng thành công");
            await loadUsers();
        }catch (updateError) {
            setError(updateError instanceof Error? updateError.message :" không thể cập nhập người dùng")
        }finally {
            setSubmitting(false);
        }
    }

    // hàm đóng mở menu
    const toggleActionMenu = (userId: string) => {
        setOpenActionMenuId((prev) => (prev === userId ? null : userId));
    };

    // đóng menu
    const actionMenuRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (actionMenuRef.current && actionMenuRef.current.contains(target)) {
                return;
            }
            setOpenActionMenuId(null);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);
    return (
        <div className="flex min-h-screen gap-6 overflow-hidden">
            <main className="min-w-0 flex-1 space-y-6">
                <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Quản lý người dùng</h1>
                            <p className="mt-2 text-slate-500">
                                Quản trị tài khoản giảng viên, sinh viên và quản trị viên ngay trong khu vực Cấu hình hệ thống.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowCreateModal(true)}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-600/20 transition hover:bg-sky-700 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[18px]">person_add</span>
                            Thêm người dùng
                        </button>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-sky-50 p-2.5 text-sky-600">
                                    <span className="material-symbols-outlined text-[24px]">groups</span>
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tổng cộng</p>
                                    <p className="mt-0.5 text-2xl font-black text-slate-900">{responseData.stats.total}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                                <span className="material-symbols-outlined text-[24px]">verified_user</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Đang hoạt động</p>
                                <p className="mt-0.5 text-2xl font-black text-slate-900">{responseData.stats.active}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-xs">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-rose-50 p-2.5 text-rose-600">
                                <span className="material-symbols-outlined text-[24px]">lock</span>
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Tài khoản khóa</p>
                                <p className="mt-0.5 text-2xl font-black text-slate-900">{responseData.stats.locked}</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="overflow-hidden rounded-3xl border border-sky-100 bg-white shadow-xs">
                    <div className="border-b border-slate-100 p-5">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                            <div className="flex flex-wrap gap-2">
                                {roleTabs.map((item) => (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() => {
                                            setRole(item.value as UserRole | "all");
                                            setPage(1);
                                        }}
                                        className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition ${
                                            role === item.value
                                                ? "bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs"
                                                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <div className="relative">
                                    <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        search
                                    </span>
                                    <input
                                        value={keyword}
                                        onChange={(e) => {
                                            setKeyword(e.target.value);
                                            setPage(1);
                                        }}
                                        placeholder="Tìm tên, email, mã SV..."
                                        className="w-full rounded-xl border border-slate-200 px-10 py-2.5 text-xs outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 sm:w-64"
                                    />
                                </div>

                                <select
                                    value={status}
                                    onChange={(e) => {
                                        setStatus(e.target.value as UserStatus);
                                        setPage(1);
                                    }}
                                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 bg-white"
                                >
                                    <option value="all">Tất cả trạng thái</option>
                                    <option value="active">Đang hoạt động</option>
                                    <option value="locked">Đang khóa</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {message ? (
                        <div className="mx-6 mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 font-medium">
                            {message}
                        </div>
                    ) : null}

                    {error ? (
                        <div className="mx-6 mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700 font-medium">
                            {error}
                        </div>
                    ) : null}

                    <div className="overflow-x-auto p-6">
                        <table className="min-w-full text-left">
                            <thead className="bg-slate-50">
                            <tr>
                                <th className="rounded-l-2xl px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Người dùng</th>
                                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Vai trò</th>
                                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Trạng thái</th>
                                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">Lần đăng nhập cuối</th>
                                <th className="rounded-r-2xl px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500">Thao tác</th>
                            </tr>
                            </thead>
                            <tbody
                                key={`${role}-${status}-${keyword}-${responseData.pagination.page}`}
                                className="divide-y divide-slate-100"
                            >
                            {loading ? (
                                Array.from({ length: 5 }).map((_, index) => (
                                    <tr key={index}>
                                        <td className="px-5 py-4" colSpan={5}>
                                            <div className="h-12 animate-pulse rounded-xl bg-slate-100" />
                                        </td>
                                    </tr>
                                ))
                            ) : responseData.users.length ? (
                                responseData.users.map((user) => (
                                    <tr key={user._id} className="transition hover:bg-sky-50/30">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-xs font-bold text-sky-700">
                                                    {getInitials(user.name) || "U"}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-xs text-slate-900">{user.name}</p>
                                                    <p className="text-[11px] text-slate-500">{user.email}</p>
                                                    {user.studentCode ? (
                                                        <p className="text-[10px] text-sky-700 font-mono">Mã: {user.studentCode}</p>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadgeClass(user.role)}`}>
                                                    {getRoleLabel(user.role)}
                                                </span>
                                        </td>
                                        <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                                                        user.isActive
                                                            ? "bg-emerald-50 text-emerald-600"
                                                            : "bg-rose-50 text-rose-600"
                                                    }`}
                                                >
                                                    <span
                                                        className={`h-2 w-2 rounded-full ${user.isActive ? "bg-emerald-500" : "bg-rose-500"}`}
                                                    />
                                                    {user.isActive ? "Đang hoạt động" : "Tạm khóa"}
                                                </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-500">{formatDate(user.lastLoginAt)}</td>
                                        <td className="relative px-5 py-4">
                                            <div className="flex justify-end">
                                                <div className="relative" ref={openActionMenuId === user._id ? actionMenuRef : null}>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleActionMenu(user._id);
                                                        }}
                                                        className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50"
                                                    >
                                                        <span className="material-symbols-outlined text-[22px]">more_vert</span>
                                                    </button>

                                                    {openActionMenuId === user._id ? (
                                                        <div
                                                            className="absolute right-0 top-full z-50 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl"
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    handleOpenEditModal(user);
                                                                    setOpenActionMenuId(null);
                                                                }}
                                                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-amber-50"
                                                            >
                                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                                                Sửa
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    handleToggleUser(user);
                                                                    setOpenActionMenuId(null);
                                                                }}
                                                                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                                                                    user.isActive
                                                                        ? "text-rose-600 hover:bg-rose-50"
                                                                        : "text-emerald-600 hover:bg-emerald-50"
                                                                }`}
                                                            >
                        <span className="material-symbols-outlined text-[20px]">
                            {user.isActive ? "lock" : "lock_open"}
                        </span>
                                                                {user.isActive ? "Khóa" : "Mở khóa"}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    handleDeleteUser(user);
                                                                    setOpenActionMenuId(null);
                                                                }}
                                                                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                                            >
                                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                                                Xóa
                                                            </button>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">
                                        Không có người dùng phù hợp với bộ lọc hiện tại.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            Hiển thị trang {responseData.pagination.page}/{responseData.pagination.totalPages} — tổng {responseData.pagination.total} người dùng
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={page <= 1 || loading}
                                onClick={() => handlePageChange(page - 1)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                            </button>
                            <button
                                type="button"
                                disabled={page >= totalPages || loading}
                                onClick={() => handlePageChange(page + 1)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            {showCreateModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
                    <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Thêm người dùng</h2>
                                <p className="mt-1 text-sm text-slate-500">Tạo nhanh tài khoản mới cho sinh viên, giảng viên hoặc quản trị viên.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-slate-700">Họ và tên</label>
                                <input
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    placeholder="Nhập họ và tên"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Email</label>
                                <input
                                    value={createForm.email}
                                    onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    placeholder="Nhập email"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Mật khẩu mặc định</label>
                                <input
                                    type="password"
                                    value={createForm.password}
                                    onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    placeholder="Tối thiểu 6 ký tự"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Vai trò</label>
                                <select
                                    value={createForm.role}
                                    onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value as UserRole }))}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                >
                                    <option value="User">Sinh viên</option>
                                    <option value="teacher">Giảng viên</option>
                                    <option value="admin">Quản trị viên</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Mã sinh viên</label>
                                <input
                                    value={createForm.studentCode}
                                    onChange={(e) => setCreateForm((prev) => ({ ...prev, studentCode: e.target.value.toUpperCase() }))}
                                    disabled={createForm.role !== "User"}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100"
                                    placeholder={createForm.role === "User" ? "Bắt buộc với sinh viên" : "Không bắt buộc"}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Khoa/Bộ môn</label>
                                <input
                                    value={createForm.department}
                                    onChange={(e) => setCreateForm((prev) => ({ ...prev, department: e.target.value }))}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    placeholder="Ví dụ: CNTT"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Khóa/Lớp</label>
                                <input
                                    value={createForm.cohort}
                                    onChange={(e) => setCreateForm((prev) => ({ ...prev, cohort: e.target.value }))}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                    placeholder="Ví dụ: K21B"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={handleCreateUser}
                                className="rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-600/20 transition hover:bg-sky-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submitting ? "Đang tạo..." : "Tạo tài khoản"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
            {showEditModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
                    <div className="w-full max-w-2xl rounded-[28px] bg-white p-6 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900">Chỉnh sửa người dùng</h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Cập nhật thông tin tài khoản, vai trò và trạng thái hoạt động.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="space-y-2 md:col-span-2">
                                <label className="text-sm font-semibold text-slate-700">Họ và tên</label>
                                <input
                                    value={editForm.name}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Email</label>
                                <input
                                    value={editForm.email}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, email: e.target.value }))}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Vai trò</label>
                                <select
                                    value={editForm.role}
                                    onChange={(e) =>
                                        setEditForm((prev) => ({
                                            ...prev,
                                            role: e.target.value as UserRole,
                                        }))
                                    }
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                >
                                    <option value="User">Sinh viên</option>
                                    <option value="teacher">Giảng viên</option>
                                    <option value="admin">Quản trị viên</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Mã sinh viên</label>
                                <input
                                    value={editForm.studentCode}
                                    onChange={(e) =>
                                        setEditForm((prev) => ({
                                            ...prev,
                                            studentCode: e.target.value.toUpperCase(),
                                        }))
                                    }
                                    disabled={editForm.role !== "User"}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-100"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Khoa/Bộ môn</label>
                                <input
                                    value={editForm.department}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, department: e.target.value }))}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Khóa/Lớp</label>
                                <input
                                    value={editForm.cohort}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, cohort: e.target.value }))}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Mật khẩu mới</label>
                                <input
                                    type="password"
                                    value={editForm.password}
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, password: e.target.value }))}
                                    placeholder="Để trống nếu không đổi"
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">Trạng thái</label>
                                <select
                                    value={editForm.isActive ? "active" : "locked"}
                                    onChange={(e) =>
                                        setEditForm((prev) => ({
                                            ...prev,
                                            isActive: e.target.value === "active",
                                        }))
                                    }
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                >
                                    <option value="active">Đang hoạt động</option>
                                    <option value="locked">Tạm khóa</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={handleUpdateuser}
                                className="rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-600/20 transition hover:bg-sky-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submitting ? "Đang lưu..." : "Lưu thay đổi"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
