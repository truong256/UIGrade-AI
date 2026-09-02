import type { AnyObj, SidebarStudent } from "@/app/ui/grading_detail/type/grading_detail.type";
import { badgeClass, statusLabel } from "@/app/ui/grading_detail/type/grading_detail.unit";
import { AiFeedbackPanel } from "./AiFeedbackPanel";
import { CriterionBreakdownPanel } from "./CriterionBreakdownPanel";
import { GradingHistoryPanel } from "./GradingHistoryPanel";
import { ScoreEditorCard } from "./ScoreEditorCard";
import { SubmissionPreview } from "./SubmissionPreview";
import { TeacherFeedbackPanel } from "./TeacherFeedbackPanel";
import { RuntimeRunnerPanel } from "./RuntimeRunnerPanel";
type Props = {
    selectedSidebar: SidebarStudent | null;
    selectedSubmissionId: string | null;
    detail: AnyObj | null;
    history: AnyObj[];
    selectedFile: AnyObj | null;
    loading: boolean;
    detailLoading: boolean;
    maxScore: number;
    manualScore: string;
    teacherComment: string;
    saving: boolean;
    onManualScoreChange: (score: string) => void;
    onTeacherCommentChange: (comment: string) => void;
    onSave: () => void;
};

export function StudentDetailPanel({
                                       selectedSidebar,
                                       selectedSubmissionId,
                                       detail,
                                       history,
                                       selectedFile,
                                       loading,
                                       detailLoading,
                                       maxScore,
                                       manualScore,
                                       teacherComment,
                                       saving,
                                       onManualScoreChange,
                                       onTeacherCommentChange,
                                       onSave,
                                   }: Props) {
    return (
        <section className="flex flex-col gap-6 lg:col-span-8">
            <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-4">
                    <div>
                        <p className="text-sm text-slate-500">Sinh viên đang chọn</p>
                        <h3 className="text-lg font-bold text-slate-900">{selectedSidebar?.name || "Chưa chọn"}</h3>
                        {selectedSidebar?.studentCode && <p className="text-sm text-slate-500">{selectedSidebar.studentCode}</p>}
                    </div>

                    {selectedSidebar && (
                        <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass(detail?.gradeStatus || selectedSidebar.gradeStatus)}`}>
                            {statusLabel(detail?.gradeStatus || selectedSidebar.gradeStatus)}
                        </span>
                    )}
                </div>

                {loading || detailLoading ? (
                    <div className="px-5 py-20 text-center text-sm text-slate-500">Đang tải bài nộp...</div>
                ) : !selectedSidebar ? (
                    <div className="px-5 py-20 text-center text-sm text-slate-500">Không có sinh viên để hiển thị.</div>
                ) : !selectedSubmissionId ? (
                    <div className="px-5 py-16 text-center">
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-sm text-slate-500">
                            Sinh viên này chưa nộp bài.
                        </div>
                    </div>
                ) : (
                    <div className="space-y-5 p-4 sm:p-5">
                        <SubmissionPreview detail={detail} selectedFile={selectedFile} />
                        <RuntimeRunnerPanel detail={detail} />

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                            <ScoreEditorCard
                                detail={detail}
                                maxScore={maxScore}
                                manualScore={manualScore}
                                onManualScoreChange={onManualScoreChange}
                            />
                            <AiFeedbackPanel detail={detail} />
                        </div>

                        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                            <CriterionBreakdownPanel detail={detail} />
                            <TeacherFeedbackPanel
                                detail={detail}
                                teacherComment={teacherComment}
                                saving={saving}
                                detailLoading={detailLoading}
                                selectedSubmissionId={selectedSubmissionId}
                                onTeacherCommentChange={onTeacherCommentChange}
                                onSave={onSave}
                            />
                        </div>

                        <GradingHistoryPanel history={history} />
                    </div>
                )}
            </section>
        </section>
    );
}
