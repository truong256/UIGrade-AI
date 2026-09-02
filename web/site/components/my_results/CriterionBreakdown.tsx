import type { ScoreCriterion } from "@/app/ui/my_results/type/my_results.type";
import { formatScore } from "@/app/ui/my_results/type/my_results.utils";

type CriterionBreakdownProps = { items: ScoreCriterion[] };

export function CriterionBreakdown({ items }: CriterionBreakdownProps) {
    return (
        <div>
            <p className="text-sm font-bold text-slate-900">Chi tiết theo tiêu chí</p>
            <div className="mt-3 space-y-3">
                {items.length ? (
                    items.map((criterion, index) => (
                        <div key={`${criterion.title}-${index}`} className="rounded-2xl border border-slate-200 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-semibold text-slate-900">{criterion.title}</p>
                                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-400">{criterion.gradingSource}</p>
                                </div>

                                <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-800">
                                    {formatScore(criterion.awardedPoints)} / {formatScore(criterion.maxPoints)}
                                </div>
                            </div>

                            {criterion.note ? <p className="mt-3 text-sm leading-6 text-slate-600">{criterion.note}</p> : null}
                        </div>
                    ))
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                        Chưa có breakdown chi tiết theo tiêu chí.
                    </div>
                )}
            </div>
        </div>
    );
}
