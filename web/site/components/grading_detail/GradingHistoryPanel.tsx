import type { AnyObj } from "@/app/ui/grading_detail/type/grading_detail.type";
import { formatDateTime, formatScore, toText } from "@/app/ui/grading_detail/type/grading_detail.unit";

type Props = {
    history: AnyObj[];
};

export function GradingHistoryPanel({ history }: Props) {
    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-bold text-slate-900">Lịch sử chấm</h3>

            <div className="mt-4 space-y-3">
                {history.length ? (
                    history
                        .slice()
                        .reverse()
                        .map((item: AnyObj, index: number) => (
                            <div key={`${toText(item.action)}-${toText(item.createdAt)}-${index}`} className="rounded-2xl border border-slate-200 p-4">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-slate-900">{toText(item.action)}</p>
                                        <p className="mt-1 text-sm text-slate-500">{formatDateTime(toText(item.createdAt))}</p>
                                    </div>

                                    <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">
                                        {formatScore(item.previousScore)} → {formatScore(item.nextScore)}
                                    </div>
                                </div>

                                {toText(item.note) && <p className="mt-3 text-sm leading-6 text-slate-600">{toText(item.note)}</p>}
                            </div>
                        ))
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                        Chưa có lịch sử chấm.
                    </div>
                )}
            </div>
        </section>
    );
}
