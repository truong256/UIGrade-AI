"use client";

import type { Dispatch, SetStateAction } from "react";
import Dialog from "./Dialog";
import EditAttachmentSection from "./EditAttachmentSection";
import type {
    AssignmentItem,
    AttachmentItem,
    EditFormState,
    SelectOption,
} from "@/app/ui/assignment_list/type/assignment_list.type";

type AssignmentEditDialogProps = {
    item: AssignmentItem | null;
    form: EditFormState;
    setForm: Dispatch<SetStateAction<EditFormState>>;
    classOptions: SelectOption[];
    existingAttachments: AttachmentItem[];
    resourceFiles: File[];
    rubricFiles: File[];
    templateFiles: File[];
    saving: boolean;
    onClose: () => void;
    onSave: () => void | Promise<void>;
    onPickResourceFiles: (files: File[]) => void;
    onPickRubricFiles: (files: File[]) => void;
    onPickTemplateFiles: (files: File[]) => void;
    onRemoveExistingAttachment: (url: string) => void;
    onRemoveResourceFile: (index: number) => void;
    onRemoveRubricFile: (index: number) => void;
    onRemoveTemplateFile: (index: number) => void;
};

export default function AssignmentEditDialog({
                                                 item,
                                                 form,
                                                 setForm,
                                                 classOptions,
                                                 existingAttachments,
                                                 resourceFiles,
                                                 rubricFiles,
                                                 templateFiles,
                                                 saving,
                                                 onClose,
                                                 onSave,
                                                 onPickResourceFiles,
                                                 onPickRubricFiles,
                                                 onPickTemplateFiles,
                                                 onRemoveExistingAttachment,
                                                 onRemoveResourceFile,
                                                 onRemoveRubricFile,
                                                 onRemoveTemplateFile,
                                             }: AssignmentEditDialogProps) {
    return (
        <Dialog
            open={Boolean(item)}
            title="Sửa bài tập"
            onClose={onClose}
            maxWidth="max-w-3xl"
        >
            {item ? (
                <div className="space-y-5">
                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Tên bài tập
                        </label>
                        <input
                            value={form.title}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    title: e.target.value,
                                }))
                            }
                            className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Lớp học
                        </label>

                        <select
                            value={form.classroomId}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    classroomId: e.target.value,
                                }))
                            }
                            className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        >
                            <option value="">Chọn lớp học</option>
                            {classOptions.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {item.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Mô tả
                        </label>
                        <textarea
                            value={form.description}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                }))
                            }
                            className="min-h-[130px] w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Rubric
                        </label>
                        <textarea
                            value={form.rubricText}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    rubricText: e.target.value,
                                }))
                            }
                            className="min-h-[120px] w-full rounded-2xl border border-slate-200 p-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-mono text-xs"
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Ngày bắt đầu
                            </label>
                            <input
                                type="datetime-local"
                                value={form.startAt}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        startAt: e.target.value,
                                    }))
                                }
                                className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Hạn nộp
                            </label>
                            <input
                                type="datetime-local"
                                value={form.dueAt}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        dueAt: e.target.value,
                                    }))
                                }
                                className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Điểm tối đa
                            </label>
                            <input
                                type="number"
                                value={form.maxScore}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        maxScore: e.target.value,
                                    }))
                                }
                                className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Ngôn ngữ
                            </label>
                            <input
                                value={form.language}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        language: e.target.value,
                                    }))
                                }
                                className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Phạt nộp trễ (%)
                            </label>
                            <input
                                type="number"
                                value={form.latePenaltyPercent}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        latePenaltyPercent: e.target.value,
                                    }))
                                }
                                disabled={!form.allowLateSubmit}
                                className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Trạng thái
                            </label>
                            <select
                                value={form.status}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        status: e.target.value as EditFormState["status"],
                                    }))
                                }
                                className="h-12 w-full rounded-2xl border border-slate-200 px-4 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                <option value="draft">Bản nháp</option>
                                <option value="published">Đang mở</option>
                                <option value="closed">Đã đóng</option>
                            </select>
                        </div>
                    </div>

                    <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                        <input
                            type="checkbox"
                            checked={form.allowLateSubmit}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    allowLateSubmit: e.target.checked,
                                }))
                            }
                        />
                        <span className="text-sm text-slate-700">
                                Cho phép nộp trễ
                            </span>
                    </label>

                    <label className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                        <input
                            type="checkbox"
                            checked={form.allowResubmit}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    allowResubmit: e.target.checked,
                                }))
                            }
                        />
                        <span className="text-sm text-slate-700">
                                Cho phép nộp lại
                            </span>
                    </label>

                    <div className="space-y-4">
                        <EditAttachmentSection
                            title="File đính kèm đề bài"
                            existingFiles={existingAttachments.filter(
                                (item) => item.kind === "resource"
                            )}
                            newFiles={resourceFiles}
                            onPickFiles={onPickResourceFiles}
                            onRemoveExisting={onRemoveExistingAttachment}
                            onRemoveNew={onRemoveResourceFile}
                        />

                        <EditAttachmentSection
                            title="File rubric / thang điểm"
                            existingFiles={existingAttachments.filter(
                                (item) => item.kind === "rubric"
                            )}
                            newFiles={rubricFiles}
                            onPickFiles={onPickRubricFiles}
                            onRemoveExisting={onRemoveExistingAttachment}
                            onRemoveNew={onRemoveRubricFile}
                        />

                        <EditAttachmentSection
                            title="Template / test case / starter code"
                            existingFiles={existingAttachments.filter(
                                (item) => item.kind === "template"
                            )}
                            newFiles={templateFiles}
                            onPickFiles={onPickTemplateFiles}
                            onRemoveExisting={onRemoveExistingAttachment}
                            onRemoveNew={onRemoveTemplateFile}
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-2xl border border-slate-200 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Hủy
                        </button>

                        <button
                            type="button"
                            onClick={onSave}
                            disabled={saving}
                            className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition active:scale-95 disabled:opacity-70"
                        >
                            {saving ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </div>
                </div>
            ) : null}
        </Dialog>
    );
}
