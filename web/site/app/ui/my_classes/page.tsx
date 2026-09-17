"use client";

// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { useEffect, useMemo, useRef, useState } from "react";
import { ClassesHeader } from "@/components/my_classes/ClassesHeader";
import { SemesterFilters } from "@/components/my_classes/SemesterFilters";
import { ClassesGrid } from "@/components/my_classes/ClassesGrid";
import { AddClassCard } from "@/components/my_classes/AddClassCard";
import { Classroom } from "@/app/ui/my_classes/type/classroom.type";
import { JoinClassDialog } from "@/components/my_classes/JoinClassDialog";
import { fetchCurrentUserClient, type AuthUser } from "@/lib/auth-client";
type CreateClassPayload = {
    name: string;
    code: string;
    description?: string;
    semester: "HK1" | "HK2" | "HK3";
    academicYear: string;
};

type UpdateClassPayload = {
    name: string;
    code: string;
    description?: string;
    semester: "HK1" | "HK2" | "HK3";
    academicYear: string;
    status: "active" | "archived";
};

type CurrentUser = AuthUser;
type ClassMutation = {
    kind: "create" | "update" | "delete";
    targetId?: string;
};

export default function MyClassesPage() {
    const [classes, setClasses] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);
    const [mutation, setMutation] = useState<ClassMutation | null>(null);
    const mutationRef = useRef<ClassMutation | null>(null);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [semesterFilter, setSemesterFilter] = useState("all");
    const [search, setSearch] = useState("");

    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
    const [loadingUser, setLoadingUser] = useState(true);

    const canManageClassUI = currentUser?.role === "lecturer";

    const beginMutation = (nextMutation: ClassMutation) => {
        if (mutationRef.current) return false;

        mutationRef.current = nextMutation;
        setMutation(nextMutation);
        setError("");
        setNotice("");
        return true;
    };

    const finishMutation = () => {
        mutationRef.current = null;
        setMutation(null);
    };

    const fetchCurrentUser = async () => {
        try {
            setLoadingUser(true);
            const user = await fetchCurrentUserClient();
            setCurrentUser(user);
        } catch {
            setCurrentUser(null);
        } finally {
            setLoadingUser(false);
        }
    };

    const fetchClasses = async () => {
        try {
            setLoading(true);
            setError("");

            const res = await fetch("/api/classes", {
                method: "GET",
                cache: "no-store",
            });

            const result = await res.json();

            if (!res.ok) {
                setError(result.message || "Không lấy được danh sách lớp");
                setClasses([]);
                return;
            }

            setClasses(result.data || []);
        } catch {
            setError("Có lỗi xảy ra khi tải danh sách lớp");
            setClasses([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchCurrentUser();
        void fetchClasses();
    }, []);

    const handleCreateClass = async (payload: CreateClassPayload) => {
        if (!beginMutation({ kind: "create" })) return false;

        try {
            const res = await fetch("/api/classes", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (!res.ok) {
                setError(result.message || "Tạo lớp thất bại");
                return false;
            }

            await fetchClasses();
            setNotice("Đã tạo lớp học thành công.");
            return true;
        } catch {
            setError("Có lỗi xảy ra khi tạo lớp");
            return false;
        } finally {
            finishMutation();
        }
    };

    const handleUpdateClass = async (
        id: string,
        payload: UpdateClassPayload
    ) => {
        if (!beginMutation({ kind: "update", targetId: id })) return false;

        try {
            const res = await fetch(`/api/classes/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const result = await res.json();

            if (!res.ok) {
                setError(result.message || "Cập nhật lớp thất bại");
                return false;
            }

            await fetchClasses();
            setNotice("Đã cập nhật lớp học thành công.");
            return true;
        } catch {
            setError("Có lỗi xảy ra khi cập nhật lớp");
            return false;
        } finally {
            finishMutation();
        }
    };

    const handleDeleteClass = async (id: string) => {
        if (mutationRef.current) return;

        const confirmed = window.confirm("Bạn có chắc muốn xóa lớp này?");
        if (!confirmed) return;
        if (!beginMutation({ kind: "delete", targetId: id })) return;

        try {
            const res = await fetch(`/api/classes/${id}`, {
                method: "DELETE",
            });

            const result = await res.json();

            if (!res.ok) {
                setError(result.message || "Xóa lớp thất bại");
                return;
            }

            await fetchClasses();
            setNotice("Đã xóa lớp học thành công.");
        } catch {
            setError("Có lỗi xảy ra khi xóa lớp");
        } finally {
            finishMutation();
        }
    };

    const filteredClasses = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return classes.filter((item) => {
            const matchSemester =
                semesterFilter === "all" ? true : item.semester === semesterFilter;

            if (!matchSemester) {
                return false;
            }

            if (!keyword) {
                return true;
            }

            const name = item.name?.toLowerCase() || "";
            const code = item.code?.toLowerCase() || "";
            const description = item.description?.toLowerCase() || "";
            const academicYear = item.academicYear?.toLowerCase() || "";

            return (
                name.includes(keyword) ||
                code.includes(keyword) ||
                description.includes(keyword) ||
                academicYear.includes(keyword)
            );
        });
    }, [classes, semesterFilter, search]);
    const [openJoin, setOpenJoin] = useState(false);
    return (
        <div className="space-y-6">
            <ClassesHeader total={filteredClasses.length}
                           onJoin={
                               !loadingUser && currentUser?.role === "student"
                                   ? () => setOpenJoin(true)
                                   : undefined
                           }/>

            <SemesterFilters
                value={semesterFilter}
                onChange={setSemesterFilter}
            />

            {error ? (
                <div role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                    {error}
                </div>
            ) : null}

            {notice ? (
                <div
                    role="status"
                    className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700"
                >
                    {notice}
                </div>
            ) : null}

            {!loadingUser && canManageClassUI ? (
                <AddClassCard
                    onCreate={handleCreateClass}
                    loading={mutation?.kind === "create"}
                />
            ) : null}

            <div className="relative w-full md:max-w-md">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    search
                </span>
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm theo tên lớp, mã lớp..."
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-700 outline-none transition focus:border-orange-300 focus:ring-4 focus:ring-orange-100"
                />
            </div>

            <ClassesGrid
                classes={filteredClasses}
                loading={loading}
                onDelete={handleDeleteClass}
                onUpdate={handleUpdateClass}
                onRefresh={fetchClasses}
                canManageClassUI={canManageClassUI}
                managementDisabled={mutation !== null}
                updatingClassId={mutation?.kind === "update" ? mutation.targetId : undefined}
                deletingClassId={mutation?.kind === "delete" ? mutation.targetId : undefined}
            />
            <JoinClassDialog
                open={openJoin}
                onClose={() => setOpenJoin(false)}
                onSuccess={fetchClasses}
            />
        </div>
    );
}
