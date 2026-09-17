// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import type { AnyObj } from "@/app/ui/grading_detail/type/grading_detail.type";
import { formatDateTime, formatScore } from "@/app/ui/grading_detail/type/grading_detail.unit";

type Props = {
    detail: AnyObj | null;
    maxScore: number;
    hasRubric: boolean;
    canGrade: boolean;
    totalScore: number;
    manualScore: string;
    onManualScoreChange: (score: string) => void;
};

export function ScoreEditorCard({ detail, maxScore, hasRubric, canGrade, totalScore, manualScore, onManualScoreChange }: Props) {
    return (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 xl:col-span-1 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Điểm số hiện tại</p>

            <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl sm:text-5xl font-bold tracking-tight text-[#172033]">
                    {formatScore(totalScore)}
                </span>
                <span className="pb-1 text-sm font-semibold text-slate-400">/ {maxScore}đ</span>
            </div>

            {hasRubric ? (
                <p className="mt-5 rounded-xl border border-blue-100 bg-blue-50/50 p-3 text-xs leading-relaxed text-slate-600">
                    Điểm tổng được tính tự động từ các tiêu chí rubric và không lấy từ gợi ý AI.
                </p>
            ) : (
                <>
                    <label htmlFor="manual-total-score" className="mt-5 block text-xs font-semibold text-slate-700">Điểm tổng thủ công</label>
                    <input
                        id="manual-total-score"
                        value={manualScore}
                        onChange={(e) => onManualScoreChange(e.target.value)}
                        type="number"
                        min={0}
                        max={maxScore}
                        step="0.1"
                        disabled={!canGrade}
                        placeholder={`0 - ${maxScore}`}
                        className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3.5 text-sm font-bold text-[#172033] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                </>
            )}

            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-xs text-[#4A5568] space-y-2">
                <div className="flex items-center justify-between">
                    <span>Bản lưu hiện tại:</span>
                    <span className="font-bold text-blue-900">{formatScore(detail?.grade?.score)} / {maxScore}</span>
                </div>

                <div className="flex items-center justify-between">
                    <span>Trạng thái:</span>
                    <span className="font-semibold text-[#172033]">
                        {detail?.grade?.status === "published" ? "Đã công bố" : detail?.grade ? "Bản nháp" : "Chưa lưu"}
                    </span>
                </div>

                <div className="flex items-center justify-between border-t border-blue-100 pt-1.5">
                    <span>Cập nhật:</span>
                    <span className="text-[11px] text-slate-500">
                        {formatDateTime(detail?.grade?.updatedAt)}
                    </span>
                </div>
            </div>
        </section>
    );
}
