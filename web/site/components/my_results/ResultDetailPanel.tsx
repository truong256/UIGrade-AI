import type { ResultItem } from "@/app/ui/my_results/type/my_results.type";
import { formatDate, formatScore, gradeStatusLabel } from "@/app/ui/my_results/type/my_results.utils";
import { CriterionBreakdown } from "./CriterionBreakdown";
import { FeedbackListCard } from "./FeedbackListCard";
import { SubmissionInfoCard } from "./SubmissionInfoCard";

type ResultDetailPanelProps = { item: ResultItem | null };

export function ResultDetailPanel({ item }: ResultDetailPanelProps) {
    return (
        <aside className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm xl:sticky xl:top-24">
            {!item ? (
                <div className="rounded-2xl border border-dashed border-sky-100 bg-sky-50/30 px-4 py-10 text-center text-xs text-slate-400">
                    Chọn một bài tập ở bên trái để xem chi tiết điểm số và nhận xét.
                </div>
            ) : (
                <div className="space-y-4">
                    <div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-0.5 rounded-full border border-sky-200">
                            Chi tiết kết quả
                        </span>
                        <h3 className="mt-2 text-lg font-bold text-slate-900">{item.assignmentTitle}</h3>
                        <p className="mt-1 text-xs text-slate-500">
                            {item.classroomName} • Hạn nộp {formatDate(item.dueAt)}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Điểm tổng kết</p>
                        <div className="mt-2 flex items-end gap-2">
                            <span className="text-4xl font-black text-sky-950">{formatScore(item.finalScore)}</span>
                            <span className="pb-1 text-xs font-bold text-slate-400">/ {item.maxScore}đ</span>
                        </div>
                        <p className="mt-2 text-xs font-semibold text-sky-700">Trạng thái: {gradeStatusLabel(item.gradeStatus)}</p>
                    </div>

                    <div className="rounded-2xl border border-sky-200 bg-white p-3.5 shadow-xs">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-sky-600">rate_review</span>
                            Nhận xét của giảng viên
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-800">
                            {item.teacherComment || "Giảng viên chưa để lại phản hồi cuối cùng."}
                        </p>
                    </div>

                    <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-3.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-sky-600">smart_toy</span>
                            Tóm tắt phân tích AI
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-sky-950">
                            {item.aiSummary || "Bài này chưa có phần tóm tắt AI."}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
                        <FeedbackListCard
                            title="Điểm mạnh đạt được"
                            items={item.strengths}
                            emptyText="Chưa có nhận xét."
                            className="border-emerald-200 bg-emerald-50/60 text-emerald-950 [&>p]:text-emerald-800"
                        />
                        <FeedbackListCard
                            title="Gợi ý cải thiện"
                            items={item.nextSteps}
                            emptyText="Chưa có gợi ý."
                            className="border-sky-200 bg-sky-50/60 text-sky-950 [&>p]:text-sky-800"
                        />
                    </div>

                    <SubmissionInfoCard item={item} />
                    <CriterionBreakdown items={item.criterionBreakdown} />
                </div>
            )}
        </aside>
    );
}
