"use client";

import type { AssignmentItem, SubmitAction } from "@/app/ui/submit_assignment/type/submit_assignment.type";
import FileUploadBox from "./FileUploadBox";

type SubmissionFormProps = {
    assignment?: AssignmentItem | null;
    files?: File[];
    repositoryUrl?: string;
    note?: string;
    submitting?: boolean;
    canSubmit?: boolean;
    disabled?: boolean;
    onFilesChange?: (files: FileList | File[]) => void;
    onRemoveFile?: (index: number) => void;
    onRepositoryUrlChange?: (value: string) => void;
    onNoteChange?: (value: string) => void;
    onSubmit?: ((action: SubmitAction) => void) | (() => void);
    // Legacy support
    content?: string;
    onContentChange?: (value: string) => void;
    studentName?: string;
    onStudentNameChange?: (value: string) => void;
};

export function SubmissionForm({
    files = [],
    repositoryUrl = "",
    note = "",
    submitting = false,
    canSubmit = true,
    disabled = false,
    onFilesChange,
    onRemoveFile,
    onRepositoryUrlChange,
    onNoteChange,
    onSubmit,
    content,
    onContentChange,
    studentName,
    onStudentNameChange,
}: SubmissionFormProps) {
    const isRichMode = onRepositoryUrlChange !== undefined || onFilesChange !== undefined;

    const handleSubmit = (action: SubmitAction = "submit") => {
        if (!onSubmit) return;
        if (onSubmit.length > 0) {
            (onSubmit as (action: SubmitAction) => void)(action);
        } else {
            (onSubmit as () => void)();
        }
    };

    if (!isRichMode) {
        return (
            <div className="space-y-4">
                {onStudentNameChange && (
                    <div>
                        <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                            Tên sinh viên / Nhóm thực hiện *
                        </label>
                        <input
                            type="text"
                            value={studentName || ""}
                            onChange={(e) => onStudentNameChange(e.target.value)}
                            disabled={disabled || submitting}
                            placeholder="VD: Nguyễn Văn A - MSSV: 2026001"
                            className="h-11 w-full rounded-xl border border-slate-200 px-4 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                        />
                    </div>
                )}

                <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                        Ghi chú nộp bài / Link mã nguồn bổ sung
                    </label>
                    <textarea
                        value={content || ""}
                        onChange={(e) => onContentChange?.(e.target.value)}
                        disabled={disabled || submitting}
                        placeholder="Ghi chú thêm về kiến trúc, tài khoản test, hoặc hướng dẫn chạy..."
                        className="min-h-[100px] w-full rounded-xl border border-slate-200 p-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    />
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        type="button"
                        onClick={() => handleSubmit("submit")}
                        disabled={disabled || submitting}
                        className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <span className="material-symbols-outlined text-[18px]">send</span>
                        {submitting ? "Đang gửi bài..." : "Nộp bài tập"}
                    </button>
                </div>
            </div>
        );
    }

    const firstFile = files.length > 0 ? files[0] : null;

    return (
        <div className="space-y-4">
            <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Tải lên file APK hoặc ZIP mã nguồn *
                </label>
                <FileUploadBox
                    selectedFile={firstFile}
                    onFileSelect={(file) => {
                        if (file && onFilesChange) {
                            onFilesChange([file]);
                        } else if (!file && onRemoveFile) {
                            onRemoveFile(0);
                        }
                    }}
                    disabled={disabled || submitting || !canSubmit}
                />
            </div>

            <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Đường dẫn Repository (GitHub / GitLab)
                </label>
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                        code
                    </span>
                    <input
                        type="url"
                        value={repositoryUrl}
                        onChange={(e) => onRepositoryUrlChange?.(e.target.value)}
                        disabled={disabled || submitting || !canSubmit}
                        placeholder="https://github.com/username/android-project"
                        className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                    />
                </div>
            </div>

            <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Ghi chú nộp bài cho Giảng viên & AI
                </label>
                <textarea
                    value={note}
                    onChange={(e) => onNoteChange?.(e.target.value)}
                    disabled={disabled || submitting || !canSubmit}
                    rows={3}
                    placeholder="Mô tả các màn hình đã hoàn thành, các testTag đặc biệt hoặc ghi chú khác..."
                    className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                />
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2 border-t border-slate-100">
                <button
                    type="button"
                    onClick={() => handleSubmit("draft")}
                    disabled={disabled || submitting || !canSubmit}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    Lưu bản nháp
                </button>

                <button
                    type="button"
                    onClick={() => handleSubmit("submit")}
                    disabled={disabled || submitting || !canSubmit}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    {submitting ? "Đang gửi bài..." : "Nộp bài chính thức"}
                </button>
            </div>
        </div>
    );
}

export default SubmissionForm;
