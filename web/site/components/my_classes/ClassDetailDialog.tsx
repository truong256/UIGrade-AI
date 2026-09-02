"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
    Classroom,
    ClassroomUserRef,
} from "@/app/ui/my_classes/type/classroom.type";
import { AddStudentDialog } from "./AddStudentDialog";

type ClassroomMemberUser = ClassroomUserRef & {
    role?: string;
};

type ClassroomMemberItem = {
    _id: string;
    userId?: ClassroomMemberUser;
    roleInClass: "teacher" | "student";
    status: "active" | "pending";
    isOwner?: boolean;
};

type ClassDetailDialogProps = {
    open: boolean;
    classroom: Classroom | null;
    onClose: () => void;
    onStudentAdded: () => Promise<void>;
};

function getTeacherInfo(teacher: Classroom["teacherId"]): ClassroomUserRef | null {
    if (!teacher || typeof teacher === "string") {
        return null;
    }

    return teacher;
}

export function ClassDetailDialog({
                                      open,
                                      classroom,
                                      onClose,
                                      onStudentAdded,
                                  }: ClassDetailDialogProps) {
    const [openAddStudent, setOpenAddStudent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [actionId, setActionId] = useState("");
    const [error, setError] = useState("");
    const [canManageMembers, setCanManageMembers] = useState(false);
    const [members, setMembers] = useState<ClassroomMemberItem[]>([]);
    const [pendingMembers, setPendingMembers] = useState<ClassroomMemberItem[]>([]);
    const [studentCount, setStudentCount] = useState<number | null>(null);

    const teacher = getTeacherInfo(classroom?.teacherId);

    const activeStudents = useMemo(
        () =>
            members.filter(
                (item) =>
                    item.roleInClass === "student" && item.status === "active"
            ),
        [members]
    );

    const fallbackStudentCount =
        classroom?.approvedStudentCount ??
        classroom?.studentCount ??
        classroom?.totalStudents ??
        0;

    const currentStudentsCount = canManageMembers
        ? activeStudents.length
        : studentCount ?? fallbackStudentCount;

    const loadStats = useCallback(async (): Promise<boolean> => {
        if (!classroom?._id) return false;

        try {
            const res = await fetch(`/api/classes/${classroom._id}/stats`, {
                method: "GET",
                cache: "no-store",
                credentials: "include",
            });

            const result = await res.json().catch(() => ({}));

            if (!res.ok) {
                setStudentCount(fallbackStudentCount);
                setCanManageMembers(false);
                setMembers([]);
                setPendingMembers([]);
                return false;
            }

            const count = Number(result.activeStudentCount);
            setStudentCount(Number.isFinite(count) ? count : 0);

            const teacherCanManage = Boolean(result.canManageMembers);
            setCanManageMembers(teacherCanManage);

            if (!teacherCanManage) {
                setMembers([]);
                setPendingMembers([]);
            }

            return teacherCanManage;
        } catch {
            setStudentCount(fallbackStudentCount);
            setCanManageMembers(false);
            setMembers([]);
            setPendingMembers([]);
            return false;
        }
    }, [classroom?._id, fallbackStudentCount]);

    const loadMembers = useCallback(async () => {
        if (!classroom?._id) return;

        try {
            const activeRes = await fetch(
                `/api/classes/${classroom._id}/students?status=active`,
                {
                    method: "GET",
                    cache: "no-store",
                    credentials: "include",
                }
            );

            const activeResult = await activeRes.json().catch(() => ({}));

            if (activeRes.status === 403) {
                setCanManageMembers(false);
                setMembers([]);
                setPendingMembers([]);
                return;
            }

            if (!activeRes.ok) {
                setError(activeResult.message || "Không thể tải danh sách thành viên");
                setMembers([]);
                return;
            }

            const pendingRes = await fetch(
                `/api/classes/${classroom._id}/students?status=pending`,
                {
                    method: "GET",
                    cache: "no-store",
                    credentials: "include",
                }
            );

            const pendingResult = await pendingRes.json().catch(() => ({}));

            if (pendingRes.status === 403) {
                setCanManageMembers(false);
                setPendingMembers([]);
                return;
            }

            if (!pendingRes.ok) {
                setError(pendingResult.message || "Không thể tải danh sách chờ duyệt");
                setPendingMembers([]);
                return;
            }

            setCanManageMembers(true);
            setMembers(Array.isArray(activeResult.items) ? activeResult.items : []);
            setPendingMembers(
                Array.isArray(pendingResult.items) ? pendingResult.items : []
            );
        } catch {
            setError("Có lỗi xảy ra khi tải dữ liệu lớp học");
            setMembers([]);
            setPendingMembers([]);
            setCanManageMembers(false);
        }
    }, [classroom?._id]);

    const refreshData = useCallback(async () => {
        if (!classroom?._id) return;

        setLoading(true);
        setError("");

        try {
            const teacherCanManage = await loadStats();

            if (teacherCanManage) {
                await loadMembers();
            }
        } finally {
            setLoading(false);
        }
    }, [classroom?._id, loadMembers, loadStats]);

    useEffect(() => {
        if (!open || !classroom) {
            setMembers([]);
            setPendingMembers([]);
            setCanManageMembers(false);
            setStudentCount(null);
            setError("");
            setLoading(false);
            return;
        }

        void refreshData();
    }, [open, classroom, refreshData]);

    if (!open || !classroom) {
        return null;
    }

    const handleStudentChanged = async () => {
        await Promise.all([refreshData(), onStudentAdded()]);
    };

    const handleApprove = async (studentId?: string) => {
        if (!studentId) return;

        try {
            setActionId(studentId);
            setError("");

            const res = await fetch(`/api/classes/${classroom._id}/students/${studentId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({ action: "approve" }),
            });

            const result = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(result.message || "Không thể duyệt sinh viên");
                return;
            }

            await handleStudentChanged();
        } catch {
            setError("Có lỗi xảy ra khi duyệt sinh viên");
        } finally {
            setActionId("");
        }
    };

    const handleChangeRole = async (
        memberId?: string,
        roleInClass: "teacher" | "student" = "student"
    ) => {
        if (!memberId) return;

        try {
            setActionId(memberId);
            setError("");

            const res = await fetch(`/api/classes/${classroom._id}/students/${memberId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    action: "change-role",
                    roleInClass,
                }),
            });

            const result = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(result.message || "Không thể cập nhật vai trò");
                return;
            }

            await handleStudentChanged();
        } catch {
            setError("Có lỗi xảy ra khi cập nhật vai trò");
        } finally {
            setActionId("");
        }
    };

    const handleRemoveStudent = async (studentId?: string) => {
        if (!studentId) return;

        const confirmed = window.confirm("Bạn có chắc muốn xóa thành viên này khỏi lớp?");
        if (!confirmed) return;

        try {
            setActionId(studentId);
            setError("");

            const res = await fetch(`/api/classes/${classroom._id}/students/${studentId}`, {
                method: "DELETE",
                credentials: "include",
            });

            const result = await res.json().catch(() => ({}));

            if (!res.ok) {
                setError(result.message || "Không thể xóa thành viên khỏi lớp");
                return;
            }

            await handleStudentChanged();
        } catch {
            setError("Có lỗi xảy ra khi xóa thành viên");
        } finally {
            setActionId("");
        }
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">
                                {classroom.name}
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Mã lớp: {classroom.code}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                        >
                            ×
                        </button>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-sm text-slate-500">Học kỳ</p>
                            <p className="mt-1 font-semibold text-slate-900">
                                {classroom.semester || "Chưa có"}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-sm text-slate-500">Năm học</p>
                            <p className="mt-1 font-semibold text-slate-900">
                                {classroom.academicYear || "Chưa có"}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-sm text-slate-500">Trạng thái</p>
                            <p className="mt-1 font-semibold capitalize text-slate-900">
                                {classroom.status || "active"}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-sm text-slate-500">Tổng sinh viên hiện có</p>
                            <p className="mt-1 font-semibold text-slate-900">
                                {currentStudentsCount}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">Giảng viên</p>
                        <p className="mt-1 font-semibold text-slate-900">
                            {teacher?.name || "Chưa có"}
                        </p>
                        <p className="text-sm text-slate-500">{teacher?.email || ""}</p>
                    </div>

                    {error ? (
                        <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                            {error}
                        </div>
                    ) : null}

                    {!canManageMembers ? (
                        <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                            <p className="text-sm text-slate-500">Thông tin thành viên</p>
                            <p className="mt-1 text-sm text-slate-700">
                                Bạn có thể xem số lượng sinh viên hiện có trong lớp. Chỉ giáo viên
                                mới quản lý được danh sách thành viên.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-sm text-slate-500">
                                            Thành viên đang hoạt động
                                        </p>
                                        <p className="mt-1 text-sm text-slate-700">
                                            Quản lý học sinh và phân quyền trong lớp
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setOpenAddStudent(true)}
                                        className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
                                    >
                                        + Thêm sinh viên
                                    </button>
                                </div>

                                <div className="mt-4 max-h-[360px] overflow-y-auto pr-1">
                                    {loading ? (
                                        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-500">
                                            Đang tải danh sách thành viên...
                                        </div>
                                    ) : members.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-500">
                                            Chưa có thành viên nào.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {members.map((member) => {
                                                const memberId = member.userId?._id;
                                                const isBusy = actionId === memberId;

                                                return (
                                                    <div
                                                        key={member._id}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3"
                                                    >
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <div className="font-semibold text-slate-900">
                                                                    {member.userId?.name || "Chưa có tên"}
                                                                </div>
                                                                <div className="text-sm text-slate-500">
                                                                    {member.userId?.email || "Chưa có email"}
                                                                </div>
                                                                <div className="mt-1 text-xs text-blue-700 font-medium">
                                                                    Mã SV:{" "}
                                                                    {member.userId?.studentCode || "Chưa có"}
                                                                </div>
                                                                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                                                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                                                                        {member.roleInClass === "teacher"
                                                                            ? "Giáo viên"
                                                                            : "Học sinh"}
                                                                    </span>
                                                                    {member.isOwner ? (
                                                                        <span className="rounded-full bg-blue-100 border border-blue-200 px-3 py-1 text-blue-800 font-semibold">
                                                                            Chủ lớp
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                            </div>

                                                            {!member.isOwner ? (
                                                                <div className="flex flex-col gap-2">
                                                                    {member.roleInClass === "student" ? (
                                                                        <button
                                                                            type="button"
                                                                            disabled={isBusy}
                                                                            onClick={() =>
                                                                                handleChangeRole(
                                                                                    memberId,
                                                                                    "teacher"
                                                                                )
                                                                            }
                                                                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-70"
                                                                        >
                                                                            {isBusy
                                                                                ? "Đang xử lý..."
                                                                                : "Đặt làm GV"}
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            type="button"
                                                                            disabled={isBusy}
                                                                            onClick={() =>
                                                                                handleChangeRole(
                                                                                    memberId,
                                                                                    "student"
                                                                                )
                                                                            }
                                                                            className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-70"
                                                                        >
                                                                            {isBusy
                                                                                ? "Đang xử lý..."
                                                                                : "Đặt làm HS"}
                                                                        </button>
                                                                    )}

                                                                    <button
                                                                        type="button"
                                                                        disabled={isBusy}
                                                                        onClick={() =>
                                                                            handleRemoveStudent(memberId)
                                                                        }
                                                                        className="rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100 disabled:opacity-70"
                                                                    >
                                                                        {isBusy ? "Đang xử lý..." : "Xóa"}
                                                                    </button>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-2xl bg-slate-50 p-4">
                                <div>
                                    <p className="text-sm text-slate-500">Yêu cầu chờ duyệt</p>
                                    <p className="mt-1 text-sm text-slate-700">
                                        Sinh viên nhập mã lớp sẽ xuất hiện tại đây
                                    </p>
                                </div>

                                <div className="mt-4 max-h-[360px] overflow-y-auto pr-1">
                                    {loading ? (
                                        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-500">
                                            Đang tải danh sách chờ duyệt...
                                        </div>
                                    ) : pendingMembers.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-500">
                                            Không có yêu cầu nào đang chờ.
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {pendingMembers.map((member) => {
                                                const memberId = member.userId?._id;
                                                const isBusy = actionId === memberId;

                                                return (
                                                    <div
                                                        key={member._id}
                                                        className="rounded-2xl border border-slate-200 px-4 py-3"
                                                    >
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <div className="font-semibold text-slate-900">
                                                                    {member.userId?.name || "Chưa có tên"}
                                                                </div>
                                                                <div className="text-sm text-slate-500">
                                                                    {member.userId?.email || "Chưa có email"}
                                                                </div>
                                                                <div className="mt-1 text-xs text-blue-700 font-medium">
                                                                    Mã SV:{" "}
                                                                    {member.userId?.studentCode || "Chưa có"}
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-col gap-2">
                                                                <button
                                                                    type="button"
                                                                    disabled={isBusy}
                                                                    onClick={() => handleApprove(memberId)}
                                                                    className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs disabled:opacity-70"
                                                                >
                                                                    {isBusy ? "Đang xử lý..." : "Duyệt"}
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    disabled={isBusy}
                                                                    onClick={() =>
                                                                        handleRemoveStudent(memberId)
                                                                    }
                                                                    className="rounded-xl bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-70"
                                                                >
                                                                    {isBusy ? "Đang xử lý..." : "Từ chối"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-4 rounded-2xl bg-blue-50/50 border border-blue-100 p-4">
                        <p className="text-xs font-semibold text-slate-500">Mô tả khóa học</p>
                        <p className="mt-1 text-xs text-slate-700 leading-relaxed">
                            {classroom.description || "Chưa có mô tả"}
                        </p>
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>

            <AddStudentDialog
                open={openAddStudent}
                classroomId={classroom._id}
                onClose={() => setOpenAddStudent(false)}
                onSuccess={async () => {
                    setOpenAddStudent(false);
                    await handleStudentChanged();
                }}
            />
        </>
    );
}