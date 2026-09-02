import type { AnyObj } from "@/app/ui/grading_detail/type/grading_detail.type";
import { formatScore, toNum, toText } from "@/app/ui/grading_detail/type/grading_detail.unit";

type Props = {
    detail: AnyObj | null;
};

export function CriterionBreakdownPanel({ detail }: Props) {
    const items = detail?.autoGrade?.criterionBreakdown || [];

    return (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">fact_check</span>
                Chi tiết theo tiêu chí (Rubric)
            </h3>

            <div className="mt-4 space-y-3">
                {items.length ? (
                    items.map((item: AnyObj, index: number) => (
                        <div key={`${toText(item.criterionCode)}-${index}`} className="rounded-xl border border-slate-200/80 p-4 transition hover:bg-slate-50/50">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-semibold text-xs sm:text-sm text-[#172033]">{toText(item.title, "Tiêu chí")}</p>
                                    <p className="mt-0.5 text-[11px] uppercase tracking-wider text-slate-400">
                                        Nguồn: {toText(item.gradingSource, "manual")}
                                    </p>
                                </div>

                                <div className="rounded-lg bg-blue-50 border border-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700">
                                    {formatScore(toNum(item.awardedPoints, 0))} / {formatScore(toNum(item.maxPoints, 0))}
                                </div>
                            </div>

                            {toText(item.note) && <p className="mt-2.5 text-xs leading-relaxed text-[#4A5568]">{toText(item.note)}</p>}
                        </div>
                    ))
                ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-xs text-slate-400">
                        Chưa có breakdown chấm điểm chi tiết.
                    </div>
                )}
            </div>
        </section>
    );
}
