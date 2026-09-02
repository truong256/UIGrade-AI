import type { AnyObj } from "@/app/ui/grading_detail/type/grading_detail.type";
import { formatScore, toNum, toText } from "@/app/ui/grading_detail/type/grading_detail.unit";

type Props = {
    detail: AnyObj | null;
};

export function CriterionBreakdownPanel({ detail }: Props) {
    const items = detail?.autoGrade?.criterionBreakdown || [];

    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold text-slate-900">Chi tiết theo tiêu chí</h3>

            <div className="mt-4 space-y-3">
                {items.length ? (
                    items.map((item: AnyObj, index: number) => (
                        <div key={`${toText(item.criterionCode)}-${index}`} className="rounded-2xl border border-slate-200 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="font-semibold text-slate-900">{toText(item.title, "Tiêu chí")}</p>
                                    <p className="mt-1 text-xs uppercase text-slate-400">
                                        {toText(item.gradingSource, "manual")}
                                    </p>
                                </div>

                                <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-800">
                                    {formatScore(toNum(item.awardedPoints, 0))} / {formatScore(toNum(item.maxPoints, 0))}
                                </div>
                            </div>

                            {toText(item.note) && <p className="mt-3 text-sm leading-6 text-slate-600">{toText(item.note)}</p>}
                        </div>
                    ))
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                        Chưa có breakdown chấm điểm.
                    </div>
                )}
            </div>
        </section>
    );
}
