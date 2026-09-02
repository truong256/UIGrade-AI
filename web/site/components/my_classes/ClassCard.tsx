"use client";

import { useEffect, useRef, useState } from "react";
import { Classroom } from "@/app/ui/my_classes/type/classroom.type";

type ClassCardProps = {
    classroom: Classroom;
    onDelete: (id: string) => void;
    onOpenDetail: (classroom: Classroom) => void;
    onEdit: (classroom: Classroom) => void;
    canManageClassUI: boolean;
};

type ClassStatsResponse = {
    activeStudentCount?: number;
    canManageMembers?: boolean;
    message?: string;
};

export function ClassCard({
                              classroom,
                              onDelete,
                              onOpenDetail,
                              onEdit,
                              canManageClassUI,
                          }: ClassCardProps) {
    const fallbackStudentCount =
        classroom.approvedStudentCount ??
        classroom.studentCount ??
        classroom.totalStudents ??
        0;

    const [openMenu, setOpenMenu] = useState(false);
    const [studentCount, setStudentCount] = useState<number>(fallbackStudentCount);
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        let ignore = false;

        async function loadStudentCount() {
            if (!classroom?._id) {
                if (!ignore) setStudentCount(0);
                return;
            }

            try {
                const res = await fetch(`/api/classes/${classroom._id}/stats`, {
                    method: "GET",
                    cache: "no-store",
                    credentials: "include",
                });

                const result: ClassStatsResponse = await res.json().catch(() => ({}));

                if (!res.ok) {
                    if (!ignore) {
                        setStudentCount(fallbackStudentCount);
                    }
                    return;
                }

                const count = Number(result.activeStudentCount);

                if (!ignore) {
                    setStudentCount(Number.isFinite(count) ? count : 0);
                }
            } catch {
                if (!ignore) {
                    setStudentCount(fallbackStudentCount);
                }
            }
        }

        void loadStudentCount();

        return () => {
            ignore = true;
        };
    }, [
        classroom?._id,
        classroom?.approvedStudentCount,
        classroom?.studentCount,
        classroom?.totalStudents,
        fallbackStudentCount,
    ]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (!menuRef.current) return;

            if (!menuRef.current.contains(event.target as Node)) {
                setOpenMenu(false);
            }
        }

        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setOpenMenu(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, []);

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={() => onOpenDetail(classroom)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpenDetail(classroom);
                }
            }}
            className="group relative cursor-pointer rounded-2xl border border-sky-100 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-1 hover:border-sky-300 hover:shadow-md"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-slate-900 group-hover:text-sky-950">
                        {classroom.name}
                    </h3>
                    <p className="mt-1 truncate text-xs font-medium text-slate-500">
                        Mã lớp: <span className="text-sky-700 font-semibold">{classroom.code}</span>
                    </p>
                </div>

                <div className="flex items-start gap-2">
                    <span className="rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                        {classroom.semester || "HK1"}
                    </span>

                    {canManageClassUI ? (
                        <div
                            ref={menuRef}
                            className="relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                aria-label="Mở menu quản lý lớp"
                                onClick={() => setOpenMenu((prev) => !prev)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-sky-100 bg-white text-slate-500 transition hover:bg-sky-50 hover:text-sky-700"
                            >
                                <span className="material-symbols-outlined text-[18px]">more_vert</span>
                            </button>

                            {openMenu ? (
                                <div className="absolute right-0 top-10 z-20 w-44 overflow-hidden rounded-2xl border border-sky-100 bg-white py-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOpenMenu(false);
                                            onEdit(classroom);
                                        }}
                                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-medium text-slate-700 transition hover:bg-sky-50"
                                    >
                                        <span className="material-symbols-outlined text-[16px] text-sky-600">edit</span>
                                        Chỉnh sửa
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setOpenMenu(false);
                                            onDelete(classroom._id);
                                        }}
                                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-medium text-red-600 transition hover:bg-red-50"
                                    >
                                        <span className="material-symbols-outlined text-[16px] text-red-500">delete</span>
                                        Xóa lớp
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>

            <p className="mt-3 line-clamp-2 text-xs text-slate-600 leading-relaxed">
                {classroom.description || "Chưa có mô tả cho môn học này."}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
                    {classroom.academicYear || "2025-2026"}
                </span>

                <span className="rounded-lg bg-sky-50 border border-sky-100 px-2.5 py-1 text-[11px] font-medium text-sky-700">
                    {studentCount} sinh viên
                </span>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-400 border-t border-slate-50 pt-3">
                <span className="transition group-hover:text-sky-600 font-medium flex items-center gap-1">
                    Xem chi tiết & bài tập
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
            </div>
        </div>
    );
}