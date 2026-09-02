"use client";

import { useEffect, useState } from "react";

type StudentSearchItem = {
    _id: string;
    name: string;
    email: string;
    studentCode?: string;
};

type AddStudentDialogProps = {
    open: boolean;
    classroomId: string;
    onClose: () => void;
    onSuccess: () => Promise<void>;
};

export function AddStudentDialog({
                                     open,
                                     classroomId,
                                     onClose,
                                     onSuccess,
                                 }: AddStudentDialogProps) {
    const [keyword, setKeyword] = useState("");
    const [results, setResults] = useState<StudentSearchItem[]>([]);
    const [selected, setSelected] = useState<StudentSearchItem | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) {
            setKeyword("");
            setResults([]);
            setSelected(null);
            setError("");
            return;
        }

        const query = keyword.trim();

        if (query.length < 2) {
            setResults([]);
            setSelected(null);
            return;
        }

        const timeout = setTimeout(async () => {
            try {
                setLoading(true);
                setError("");

                const res = await fetch(
                    `/api/classes/${classroomId}/students?mode=available&keyword=${encodeURIComponent(
                        query
                    )}`,
                    {
                        method: "GET",
                        cache: "no-store",
                    }
                );

                const result = await res.json();

                if (!res.ok) {
                    setError(result.message || "Không thể tìm sinh viên");
                    setResults([]);
                    return;
                }

                setResults(result.items || []);
            } catch {
                setError("Có lỗi xảy ra khi tìm sinh viên");
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeout);
    }, [classroomId, keyword, open]);

    if (!open) return null;

    const handleAddStudent = async () => {
        if (!selected) {
            setError("Vui lòng chọn một sinh viên");
            return;
        }

        try {
            setSaving(true);
            setError("");

            const res = await fetch(`/api/classes/${classroomId}/students`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    studentId: selected._id,
                }),
            });

            const result = await res.json();

            if (!res.ok) {
                setError(result.message || "Không thể thêm sinh viên");
                return;
            }

            await onSuccess();
            onClose();
        } catch {
            setError("Có lỗi xảy ra khi thêm sinh viên");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
            <div
                className="w-full max-w-xl rounded-3xl border border-sky-100 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150"
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sky-600 text-[22px]">person_add</span>
                            Thêm Sinh viên vào Lớp
                        </h3>
                        <p className="mt-0.5 text-xs text-slate-500">
                            Tìm kiếm theo tên sinh viên, email hoặc mã số sinh viên
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 transition"
                        aria-label="Đóng dialog"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                <div className="mt-4 space-y-3.5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Từ khóa tìm kiếm
                        </label>
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                                search
                            </span>
                            <input
                                type="text"
                                value={keyword}
                                onChange={(e) => {
                                    setKeyword(e.target.value);
                                    setSelected(null);
                                }}
                                placeholder="Nhập tên, email hoặc mã SV (tối thiểu 2 ký tự)..."
                                className="h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            />
                        </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto rounded-2xl border border-sky-100 divide-y divide-slate-100">
                        {loading ? (
                            <div className="px-4 py-6 text-center text-xs text-slate-500">
                                <span className="inline-block animate-spin mr-2">⏳</span> Đang tìm kiếm...
                            </div>
                        ) : results.length === 0 ? (
                            <div className="px-4 py-6 text-center text-xs text-slate-400">
                                {keyword.trim().length < 2
                                    ? "Nhập ít nhất 2 ký tự để bắt đầu tìm kiếm"
                                    : "Không tìm thấy sinh viên nào phù hợp hoặc đã tham gia lớp."}
                            </div>
                        ) : (
                            results.map((student) => {
                                const isSelected = selected?._id === student._id;

                                return (
                                    <button
                                        key={student._id}
                                        type="button"
                                        onClick={() => setSelected(student)}
                                        className={`flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition ${
                                            isSelected
                                                ? "bg-sky-50"
                                                : "hover:bg-sky-50/50"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 font-bold text-xs">
                                                {student.name?.slice(0, 1).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-semibold text-xs text-slate-900 truncate">
                                                    {student.name}
                                                </div>
                                                <div className="text-[11px] text-slate-500 truncate">
                                                    {student.email}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {student.studentCode && (
                                                <span className="text-[11px] font-mono text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md">
                                                    {student.studentCode}
                                                </span>
                                            )}
                                            {isSelected && (
                                                <span className="rounded-lg bg-sky-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
                                                    Đã chọn
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {error ? (
                        <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-2.5 text-xs text-red-600 font-medium flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">error</span>
                            {error}
                        </div>
                    ) : null}

                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                        >
                            Hủy bỏ
                        </button>

                        <button
                            type="submit"
                            onClick={handleAddStudent}
                            disabled={!selected || saving}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-600/20 hover:bg-sky-700 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            <span className="material-symbols-outlined text-[16px]">person_add</span>
                            {saving ? "Đang thêm..." : "Thêm vào lớp"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}