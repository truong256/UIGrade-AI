import type { ResultItem } from "@/app/ui/my_results/type/my_results.type";
import { formatDate, formatDateTime, formatScore, gradeStatusClass, gradeStatusLabel } from "@/app/ui/my_results/type/my_results.utils";

type ResultCardProps = {
    item: ResultItem;
    active: boolean;
    isTeacherView: boolean;
    onSelect: (id: string) => void;
};

export function ResultCard({ item, active, isTeacherView, onSelect }: ResultCardProps) {
    return (
        <button
            type="button"
            onClick={() => onSelect(item._id)}
            className={`w-full rounded-3xl border p-5 text-left shadow-xs transition-all duration-150 ${
                active
                    ? "border-sky-300 bg-sky-50/60 shadow-md shadow-sky-600/5 ring-2 ring-sky-500/20"
                    : "border-sky-100 bg-white hover:border-sky-300 hover:bg-sky-50/30"
            }`}
        >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        {item.classroomCode ? (
                            <span className="rounded-md bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-[11px] font-mono font-bold text-sky-800">
                                {item.classroomCode}
                            </span>
                        ) : null}

                        <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${gradeStatusClass(item.gradeStatus)}`}>
                            {gradeStatusLabel(item.gradeStatus)}
                        </span>
                    </div>

                    <h2 className="mt-2.5 text-base font-bold text-slate-900">{item.assignmentTitle}</h2>

                    <p className="mt-1 text-xs text-slate-500">
                        {item.classroomName} • Hạn nộp: {formatDate(item.dueAt)} • Lần nộp #{item.attemptNo}
                    </p>

                    {isTeacherView ? (
                        <p className="mt-1 text-xs font-semibold text-slate-700">
                            Sinh viên: {item.studentName}{item.studentCode ? ` (${item.studentCode})` : ""}
                        </p>
                    ) : null}

                    <div className="mt-3.5 grid grid-cols-1 gap-2.5 md:grid-cols-2">
                        <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-sky-800 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                                Nhận xét AI
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-sky-950">
                                {item.aiSummary || "Chưa có nhận xét AI cho bài tập này."}
                            </p>
                        </div>

                        <div className="rounded-xl border border-sky-100 bg-white p-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">rate_review</span>
                                Nhận xét giảng viên
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-700">
                                {item.teacherComment || "Giảng viên chưa để lại nhận xét cuối cùng."}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex min-w-[150px] flex-row items-center justify-between gap-4 border-t border-sky-100 pt-3 lg:flex-col lg:items-end lg:justify-start lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                    <div className="text-left lg:text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Điểm tổng kết</p>
                        <p className="mt-1 text-2xl sm:text-3xl font-black text-sky-950">
                            {formatScore(item.finalScore)}
                            <span className="text-xs font-bold text-slate-400"> / {item.maxScore}đ</span>
                        </p>
                    </div>

                    <div className="text-[11px] text-slate-400 lg:text-right">
                        <p>Nộp: {formatDateTime(item.submittedAt)}</p>
                    </div>
                </div>
            </div>
        </button>
    );
}
