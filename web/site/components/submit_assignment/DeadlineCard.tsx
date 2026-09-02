import type { AssignmentItem } from "@/app/ui/submit_assignment/type/submit_assignment.type";
import { formatDateTime, formatTimeRemaining } from "@/app/ui/submit_assignment/type/submit_assignment.utils";

export function DeadlineCard({ assignment }: { assignment: AssignmentItem | null }) {
    return (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-slate-900">Deadline</h3>
            <div className="space-y-2 text-sm text-slate-600">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-slate-500">Còn lại</p>
                    <p className="text-xl font-bold text-slate-900">
                        {formatTimeRemaining(assignment?.dueAt)}
                    </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-slate-500">Hạn nộp</p>
                    <p className="font-semibold text-slate-900">
                        {formatDateTime(assignment?.dueAt)}
                    </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-slate-500">Nộp trễ</p>
                    <p className="font-semibold text-slate-900">
                        {assignment?.allowLateSubmit
                            ? `Có, trừ ${assignment.latePenaltyPercent}%`
                            : "Không cho phép"}
                    </p>
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                    <p className="text-slate-500">Nộp lại</p>
                    <p className="font-semibold text-slate-900">
                        {assignment?.allowResubmit ? "Có" : "Không"}
                    </p>
                </div>
            </div>
        </section>
    );
}
