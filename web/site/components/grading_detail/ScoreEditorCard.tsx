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
        <section className="rounded-3xl border border-sky-100 bg-white p-5 xl:col-span-1 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Điểm số hiện tại</p>

            <div className="mt-3 flex items-end gap-2">
                <span className="text-4xl sm:text-5xl font-black text-sky-950">
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
                className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-4 text-sm font-bold text-sky-950 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />

            <div className="mt-5 rounded-2xl border border-sky-100 bg-sky-50/40 p-3.5 text-xs text-slate-600 space-y-2">
                <div className="flex items-center justify-between">
                    <span>AI đề xuất:</span>
                    <span className="font-bold text-sky-900">
                        {formatScore(detail?.autoGrade?.score)} / {toNum(detail?.autoGrade?.maxScore, maxScore)}
                    </span>
                </div>

                <div className="flex items-center justify-between">
                    <span>Chuẩn hóa:</span>
                    <span className="font-semibold text-slate-900">
                        {formatScore(detail?.autoGrade?.normalizedScore)}%
                    </span>
                </div>

                <div className="flex items-center justify-between border-t border-sky-100/70 pt-1.5">
                    <span>Chấm lúc:</span>
                    <span className="text-[11px] text-slate-500">
                        {formatDateTime(detail?.autoGrade?.gradedAt)}
                    </span>
                </div>
            </div>
        </section>
    );
}
