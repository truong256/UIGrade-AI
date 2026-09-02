import type { AnyObj } from "@/app/ui/grading_detail/type/grading_detail.type";
import { toText } from "@/app/ui/grading_detail/type/grading_detail.unit";

type Props = {
    detail: AnyObj | null;
    teacherComment: string;
    saving: boolean;
    detailLoading: boolean;
    selectedSubmissionId: string | null;
    onTeacherCommentChange: (comment: string) => void;
    onSave: () => void;
};

export function TeacherFeedbackPanel({
                                         detail,
                                         teacherComment,
                                         saving,
                                         detailLoading,
                                         selectedSubmissionId,
                                         onTeacherCommentChange,
                                         onSave,
                                     }: Props) {
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
                className="mt-3 min-h-[140px] w-full rounded-2xl border border-slate-200 p-3.5 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                placeholder="Nhập nhận xét chi tiết, khen ngợi hoặc hướng dẫn sinh viên cải thiện giao diện..."
            />

            <div className="mt-4 flex justify-end">
                <button
                    type="button"
                    onClick={onSave}
                    disabled={!selectedSubmissionId || saving || detailLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <span className="material-symbols-outlined text-[16px]">save</span>
                    {saving ? "Đang lưu..." : "Lưu điểm & Gửi phản hồi"}
                </button>
            </div>
        </section>
    );
}
