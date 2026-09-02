"use client";

import { useState, type FormEvent } from "react";
import { Classroom, ClassroomSemester, ClassroomStatus } from "@/app/ui/my_classes/type/classroom.type";

type EditClassPayload = {
    name: string;
    code: string;
    description?: string;
    semester: ClassroomSemester;
    academicYear: string;
    status: ClassroomStatus;
};

type EditClassDialogProps = {
    open: boolean;
    classroom: Classroom | null;
    onClose: () => void;
    onUpdate?: (id: string, payload: EditClassPayload) => Promise<boolean>;
    onSubmit?: (id: string, payload: EditClassPayload) => Promise<boolean>;
    loading?: boolean;
};

function EditClassDialogForm({
    classroom,
    onClose,
    onUpdate,
    onSubmit,
    loading = false,
}: {
    classroom: Classroom;
    onClose: () => void;
    onUpdate?: (id: string, payload: EditClassPayload) => Promise<boolean>;
    onSubmit?: (id: string, payload: EditClassPayload) => Promise<boolean>;
    loading?: boolean;
}) {
    const classData = classroom as any;
    const [name, setName] = useState(classData.name || "");
    const [code, setCode] = useState(classData.code || "");
    const [description, setDescription] = useState(classData.description || "");
    const [semester, setSemester] = useState<ClassroomSemester>((classData.semester as ClassroomSemester) || "HK1");
    const [academicYear, setAcademicYear] = useState(classData.academicYear || "2025-2026");
    const [status, setStatus] = useState<ClassroomStatus>((classData.status as ClassroomStatus) || "active");
    const [error, setError] = useState("");

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        const trimmedName = name.trim();
        const trimmedCode = code.trim().toUpperCase();
        const trimmedDescription = description.trim();
        const trimmedAcademicYear = academicYear.trim();

        if (!trimmedName) {
            setError("Vui lòng nhập tên lớp");
            return;
        }

        if (!trimmedCode) {
            setError("Vui lòng nhập mã lớp");
            return;
        }

        if (!trimmedAcademicYear) {
            setError("Vui lòng nhập năm học");
            return;
        }

        const classId = classData.id || classData._id || "";
        const updater = onUpdate || onSubmit;
        if (updater) {
            const success = await updater(classId, {
                name: trimmedName,
                code: trimmedCode,
                description: trimmedDescription || undefined,
                semester,
                academicYear: trimmedAcademicYear,
                status,
            });

            if (success) {
                onClose();
            }
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-xl rounded-3xl border border-sky-100 bg-white p-6 shadow-2xl transition-all">
                <div className="flex items-center justify-between border-b border-sky-100 pb-4">
                    <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-200">
                            <span className="material-symbols-outlined text-[20px]">edit_note</span>
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">
                                Chỉnh sửa thông tin lớp
                            </h2>
                            <p className="text-xs text-slate-500">
                                Cập nhật thông tin chi tiết và trạng thái của lớp học
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    {error ? (
                        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-600">
                            {error}
                        </div>
                    ) : null}

                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Tên lớp học <span className="text-rose-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ví dụ: Lập trình Android Nâng cao"
                            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                                Mã lớp <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="Ví dụ: ANDROID_01"
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-mono font-bold uppercase outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                                Trạng thái
                            </label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as ClassroomStatus)}
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            >
                                <option value="active">Đang hoạt động</option>
                                <option value="archived">Đã lưu trữ</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                                Học kỳ
                            </label>
                            <select
                                value={semester}
                                onChange={(e) => setSemester(e.target.value as ClassroomSemester)}
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            >
                                <option value="HK1">Học kỳ 1</option>
                                <option value="HK2">Học kỳ 2</option>
                                <option value="HK3">Học kỳ 3 (Hè)</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                                Năm học <span className="text-rose-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={academicYear}
                                onChange={(e) => setAcademicYear(e.target.value)}
                                placeholder="2025-2026"
                                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-700">
                            Mô tả lớp học
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Mô tả nội dung môn học, yêu cầu..."
                            className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                        />
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
                        >
                            Hủy
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-5 py-2 text-xs font-bold text-white shadow-md shadow-sky-600/20 transition hover:bg-sky-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[16px]">save</span>
                                    Lưu thay đổi
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function EditClassDialog({
    open,
    classroom,
    onClose,
    onUpdate,
    onSubmit,
    loading = false,
}: EditClassDialogProps) {
    if (!open || !classroom) return null;

    const classData = classroom as any;
    return (
        <EditClassDialogForm
            key={classData.id || classData._id || "edit-class"}
            classroom={classroom}
            onClose={onClose}
            onUpdate={onUpdate}
            onSubmit={onSubmit}
            loading={loading}
        />
    );
}

export default EditClassDialog;