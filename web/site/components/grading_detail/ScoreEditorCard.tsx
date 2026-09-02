import type { AnyObj } from "@/app/ui/grading_detail/type/grading_detail.type";
import { formatDateTime, formatScore, toNum } from "@/app/ui/grading_detail/type/grading_detail.unit";

type Props = {
    detail: AnyObj | null;
    maxScore: number;
    manualScore: string;
    onManualScoreChange: (score: string) => void;
};

export function ScoreEditorCard({ detail, maxScore, manualScore, onManualScoreChange }: Props) {
    return (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 xl:col-span-1 shadow-xs">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Điểm số hiện tại</p>

            <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl sm:text-5xl font-bold tracking-tight text-[#172033]">
                    {formatScore(detail?.finalScore ?? detail?.autoGrade?.score ?? null)}
                </span>
                <span className="pb-1 text-sm font-semibold text-slate-400">/ {maxScore}đ</span>
            </div>

            <label className="mt-5 block text-xs font-semibold text-slate-700">Điểm giáo viên duyệt</label>
            <input
                value={manualScore}
                onChange={(e) => onManualScoreChange(e.target.value)}
                type="number"
                min={0}
                max={maxScore}
                step="0.1"
                placeholder={`0 - ${maxScore}`}
                className="mt-1.5 h-10 w-full rounded-xl border border-slate-200 px-3.5 text-sm font-bold text-[#172033] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-xs text-[#4A5568] space-y-2">
                <div className="flex items-center justify-between">
                    <span>AI đề xuất:</span>
                    <span className="font-bold text-blue-900">
                        {formatScore(detail?.autoGrade?.score)} / {toNum(detail?.autoGrade?.maxScore, maxScore)}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span>Chuẩn hóa:</span>
                    <span className="font-semibold text-[#172033]">
                        {formatScore(detail?.autoGrade?.normalizedScore)}%
                    </span>
                </div>

                <div className="flex items-center justify-between border-t border-blue-100 pt-1.5">
                    <span>Chấm lúc:</span>
                    <span className="text-[11px] text-slate-500">
                        {formatDateTime(detail?.autoGrade?.gradedAt)}
                    </span>
                </div>
            </div>
        </section>
    );
}
