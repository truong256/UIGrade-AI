import type { AnyObj } from "@/app/ui/grading_detail/type/grading_detail.type";
import { toText } from "@/app/ui/grading_detail/type/grading_detail.unit";

type Props = {
    detail: AnyObj | null;
};

export function AiFeedbackPanel({ detail }: Props) {
    return (
        <section className="rounded-3xl border border-sky-100 bg-white p-5 xl:col-span-2 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-600 text-[20px]">smart_toy</span>
                Nhận xét phân tích từ AI
            </h3>

            {!detail?.autoGrade ? (
                <div className="mt-4 rounded-2xl border border-dashed border-sky-100 bg-sky-50/30 px-4 py-8 text-center text-xs text-slate-400">
                    Bài tập này chưa được chấm bằng AI. Nhấn nút &ldquo;Chấm AI&rdquo; phía trên để tiến hành chấm.
                </div>
            ) : (
                <div className="mt-4 space-y-3.5">
                    {toText(detail?.autoGrade?.aiFeedback?.summary) && (
                        <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4 text-xs leading-relaxed text-slate-700">
                            {toText(detail?.autoGrade?.aiFeedback?.summary)}
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <FeedbackList
                            title="Điểm mạnh đạt được"
                            icon="task_alt"
                            emptyText="Chưa có nhận xét."
                            items={detail?.autoGrade?.aiFeedback?.strengths || []}
                            className="border-emerald-200 bg-emerald-50/60 text-emerald-950"
                            titleClassName="text-emerald-800"
                        />

                        <FeedbackList
                            title="Gợi ý cải thiện tiếp theo"
                            icon="lightbulb"
                            emptyText="Chưa có gợi ý."
                            items={detail?.autoGrade?.aiFeedback?.nextSteps || []}
                            className="border-sky-200 bg-sky-50/60 text-sky-950"
                            titleClassName="text-sky-800"
                        />
                    </div>
                </div>
            )}
        </section>
    );
}

type FeedbackListProps = {
    title: string;
    icon: string;
    emptyText: string;
    items: string[];
    className: string;
    titleClassName: string;
};

function FeedbackList({ title, icon, emptyText, items, className, titleClassName }: FeedbackListProps) {
    return (
        <div className={`rounded-2xl border p-3.5 ${className}`}>
            <p className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${titleClassName}`}>
                <span className="material-symbols-outlined text-[16px]">{icon}</span>
                {title}
            </p>
            <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed">
                {items.length ? items.map((item) => <li key={item}>• {item}</li>) : <li className="text-slate-400">{emptyText}</li>}
            </ul>
        </div>
    );
}
