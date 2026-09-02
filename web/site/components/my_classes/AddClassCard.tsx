"use client";

import { useState, type FormEvent } from "react";
import type { ClassroomSemester } from "@/app/ui/my_classes/type/classroom.type";

type AddClassPayload = {
    name: string;
    code: string;
    description?: string;
    semester: ClassroomSemester;
    academicYear: string;
};

type AddClassCardProps = {
    onCreate: (payload: AddClassPayload) => Promise<boolean>;
    loading?: boolean;
};

const DEFAULT_YEAR = "2025-2026";

export function AddClassCard({ onCreate, loading = false }: AddClassCardProps) {
    const [name, setName] = useState("");
    const [code, setCode] = useState("");
    const [description, setDescription] = useState("");
    const [semester, setSemester] = useState<ClassroomSemester>("HK1");
    const [academicYear, setAcademicYear] = useState(DEFAULT_YEAR);
    const [error, setError] = useState("");

    const resetForm = () => {
        setName("");
        setCode("");
        setDescription("");
        setSemester("HK1");
        setAcademicYear(DEFAULT_YEAR);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        const trimmedName = name.trim();
        const trimmedCode = code.trim().toUpperCase();
        const trimmedDescription = description.trim();
        const trimmedAcademicYear = academicYear.trim();

        if (!trimmedName) {
            setError("Vui lòng nhập tên lớp học");
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

        const success = await onCreate({
            name: trimmedName,
            code: trimmedCode,
            description: trimmedDescription || undefined,
            semester,
            academicYear: trimmedAcademicYear,
        });

        if (success) {
            resetForm();
        }
    };

    return (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
            <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[22px]">add_circle</span>
                Tạo Lớp học mới
            </h3>
            <p className="text-xs text-[#4A5568] mt-0.5">Điền thông tin lớp để bắt đầu giao bài tập cho sinh viên.</p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Tên lớp học *</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="VD: Lập trình Android Nâng cao - L01"
                        className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mã lớp *</label>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        placeholder="VD: ANDR2026-L01"
                        className="h-10 w-full rounded-xl border border-slate-200 px-3.5 uppercase text-sm font-semibold tracking-wider text-[#172033] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả khóa học</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Mô tả tóm tắt về môn học, yêu cầu nộp bài và tiêu chí đánh giá..."
                        className="min-h-[80px] w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Học kỳ</label>
                        <select
                            value={semester}
                            onChange={(e) => setSemester(e.target.value as ClassroomSemester)}
                            className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
                        >
                            <option value="HK1">Học kỳ 1</option>
                            <option value="HK2">Học kỳ 2</option>
                            <option value="HK3">Học kỳ 3 (Hè)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Năm học</label>
                        <input
                            type="text"
                            value={academicYear}
                            onChange={(e) => setAcademicYear(e.target.value)}
                            placeholder="2025-2026"
                            className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>

                {error ? (
                    <div className="rounded-xl bg-red-50 border border-red-200/60 px-3.5 py-2 text-xs font-medium text-red-700 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-red-600">error</span>
                        {error}
                    </div>
                ) : null}

                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 active:scale-98 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    {loading ? "Đang tạo..." : "Tạo lớp ngay"}
                </button>
            </form>
        </div>
    );
}