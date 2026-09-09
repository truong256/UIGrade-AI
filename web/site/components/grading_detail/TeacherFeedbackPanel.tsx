import { useState } from "react";
import type { AnyObj } from "@/app/ui/grading_detail/type/grading_detail.type";
import { toText } from "@/app/ui/grading_detail/type/grading_detail.unit";

type Props = {
    detail: AnyObj | null;
    teacherComment: string;
    saving: boolean;
    publishing: boolean;
    detailLoading: boolean;
    selectedSubmissionId: string | null;
    canGrade: boolean;
    onTeacherCommentChange: (comment: string) => void;
    onSaveDraft: () => void;
    onPublish: () => void;
};

export function TeacherFeedbackPanel({
                                         detail,
                                         teacherComment,
                                         saving,
                                         publishing,
                                         detailLoading,
                                         selectedSubmissionId,
                                         canGrade,
                                         onTeacherCommentChange,
                                         onSaveDraft,
                                         onPublish,
                                     }: Props) {
    const [confirmingPublish, setConfirmingPublish] = useState(false);
    const busy = saving || publishing || detailLoading;

    return (
        <section className="rounded-3xl border border-blue-100 bg-white p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">rate_review</span>
                Phản hồi & Nhận xét của Giảng viên
            </h3>

            <div className="mt-3 rounded-2xl bg-blue-50/40 border border-blue-100 p-3.5 text-xs text-slate-600 space-y-2">
                <p>
                    <span className="font-semibold text-slate-900">Mã nguồn / Link file:</span>{" "}
                    {detail?.repositoryUrl || detail?.fileUrl ? (
                        <a href={detail.repositoryUrl || detail.fileUrl} target="_blank" rel="noreferrer" className="text-blue-700 font-medium hover:underline">
                            {detail.repositoryUrl || detail.fileUrl}
                        </a>
                    ) : (
                        "Không có"
                    )}
                </p>

                <p className="whitespace-pre-wrap">
                    <span className="font-semibold text-slate-900">Ghi chú của sinh viên:</span>{" "}
                    {toText(detail?.note || detail?.content, "Không có ghi chú")}
                </p>
            </div>

            <textarea
                value={teacherComment}
                onChange={(e) => onTeacherCommentChange(e.target.value)}
                disabled={!canGrade || busy}
                maxLength={5000}
                className="mt-3 min-h-[140px] w-full rounded-2xl border border-slate-200 p-3.5 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Nhập nhận xét chi tiết, khen ngợi hoặc hướng dẫn sinh viên cải thiện giao diện..."
            />

            <div className="mt-4 flex flex-wrap justify-end gap-2.5">
                <button
                    type="button"
                    onClick={onSaveDraft}
                    disabled={!canGrade || !selectedSubmissionId || busy}
                    className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-50 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    {saving ? "Đang lưu..." : "Lưu nháp"}
                </button>
                <button
                    type="button"
                    onClick={() => setConfirmingPublish(true)}
                    disabled={!canGrade || !selectedSubmissionId || busy}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <span className="material-symbols-outlined text-[16px]">publish</span>
                    {publishing ? "Đang công bố..." : "Công bố điểm"}
                </button>
            </div>

            {confirmingPublish && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation">
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" role="alertdialog" aria-modal="true" aria-labelledby="publish-title">
                        <h4 id="publish-title" className="text-lg font-bold text-slate-900">Xác nhận công bố điểm</h4>
                        <p className="mt-2 text-sm leading-6 text-slate-600">
                            Sinh viên sẽ thấy điểm, phản hồi theo tiêu chí và nhận xét của giảng viên ngay sau khi công bố.
                        </p>
                        <div className="mt-6 flex justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={() => setConfirmingPublish(false)}
                                disabled={publishing}
                                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (publishing) return;
                                    setConfirmingPublish(false);
                                    onPublish();
                                }}
                                disabled={publishing}
                                className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
                            >
                                Xác nhận công bố
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
