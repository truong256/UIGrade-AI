// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import type { AssignmentRubricCriterion } from "@/lib/grading-workflow";

type Props = {
    rubric: AssignmentRubricCriterion[];
    scores: Record<string, string>;
    comments: Record<string, string>;
    disabled: boolean;
    onScoreChange: (code: string, score: string) => void;
    onCommentChange: (code: string, comment: string) => void;
};

export function CriterionBreakdownPanel({
    rubric,
    scores,
    comments,
    disabled,
    onScoreChange,
    onCommentChange,
}: Props) {
    return (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">fact_check</span>
                Chi tiết theo tiêu chí (Rubric)
            </h3>

            <div className="mt-4 space-y-3">
                {rubric.length ? (
                    rubric.map((criterion) => (
                        <div key={criterion.code} className="rounded-xl border border-slate-200/80 p-4 transition hover:bg-slate-50/50">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-xs sm:text-sm text-[#172033]">{criterion.title}</p>
                                    {criterion.description && (
                                        <p className="mt-1 text-xs leading-relaxed text-slate-500">{criterion.description}</p>
                                    )}
                                </div>

                                <div className="flex shrink-0 items-center gap-1.5">
                                    <input
                                        value={scores[criterion.code] ?? ""}
                                        onChange={(event) => onScoreChange(criterion.code, event.target.value)}
                                        type="number"
                                        min={0}
                                        max={criterion.maxPoints}
                                        step="0.1"
                                        disabled={disabled}
                                        aria-label={`Điểm ${criterion.title}`}
                                        className="h-9 w-20 rounded-lg border border-blue-200 px-2 text-right text-sm font-bold text-blue-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                                    />
                                    <span className="text-xs font-bold text-slate-500">/ {criterion.maxPoints}</span>
                                </div>
                            </div>

                            <textarea
                                value={comments[criterion.code] ?? ""}
                                onChange={(event) => onCommentChange(criterion.code, event.target.value)}
                                disabled={disabled}
                                maxLength={2000}
                                aria-label={`Nhận xét ${criterion.title}`}
                                placeholder="Nhận xét riêng cho tiêu chí này (không bắt buộc)"
                                className="mt-3 min-h-20 w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                            />
                        </div>
                    ))
                ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-xs text-slate-400">
                        Bài tập không có rubric. Hãy nhập điểm tổng thủ công ở phía trên.
                    </div>
                )}
            </div>
        </section>
    );
}
