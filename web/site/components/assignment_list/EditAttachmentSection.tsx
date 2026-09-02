"use client";

import type { AttachmentItem } from "@/app/ui/assignment_list/type/assignment_list.type";

export default function EditAttachmentSection({
                                                  title,
                                                  existingFiles,
                                                  newFiles,
                                                  onPickFiles,
                                                  onRemoveExisting,
                                                  onRemoveNew,
                                              }: {
    title: string;
    existingFiles: AttachmentItem[];
    newFiles: File[];
    onPickFiles: (files: File[]) => void;
    onRemoveExisting: (url: string) => void;
    onRemoveNew: (index: number) => void;
}) {
    return (
        <div className="rounded-2xl border border-blue-100 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-slate-900">{title}</p>

                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-xs">
                    <span className="material-symbols-outlined text-[16px]">
                        upload_file
                    </span>
                    Chọn file
                    <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(event) => {
                            const nextFiles = Array.from(event.target.files || []);
                            onPickFiles(nextFiles);
                            event.currentTarget.value = "";
                        }}
                    />
                </label>
            </div>

            {!existingFiles.length && !newFiles.length ? (
                <div className="rounded-xl border-2 border-dashed border-blue-100 bg-blue-50/30 px-4 py-6 text-center text-xs text-slate-400">
                    Chưa có file đính kèm nào.
                </div>
            ) : (
                <div className="space-y-2">
                    {existingFiles.map((file) => (
                        <div
                            key={file.url}
                            className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-2.5"
                        >
                            <div>
                                <p className="text-xs font-medium text-slate-800">
                                    {file.originalName}
                                </p>
                                <p className="text-[10px] text-slate-400">File đã lưu</p>
                            </div>

                            <button
                                type="button"
                                onClick={() => onRemoveExisting(file.url)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                                title="Xóa file"
                            >
                                <span className="material-symbols-outlined text-[16px]">
                                    delete
                                </span>
                            </button>
                        </div>
                    ))}

                    {newFiles.map((file, index) => (
                        <div
                            key={`${file.name}-${file.size}-${index}`}
                            className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5"
                        >
                            <div>
                                <p className="text-xs font-medium text-slate-800">{file.name}</p>
                                <p className="text-[10px] text-blue-600 font-semibold">File mới chọn</p>
                            </div>

                            <button
                                type="button"
                                onClick={() => onRemoveNew(index)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-red-600 hover:bg-red-100"
                                title="Xóa file mới"
                            >
                                <span className="material-symbols-outlined text-[16px]">
                                    delete
                                </span>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
