import type { AssignmentItem } from "@/app/ui/submit_assignment/type/submit_assignment.type";
import { formatDateTime, getSubmissionLabel } from "@/app/ui/submit_assignment/type/submit_assignment.utils";

export function LatestSubmissionCard({ assignment }: { assignment: AssignmentItem | null }) {
    const latestSubmission = assignment?.latestSubmission;

    return (
        <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-sky-600 text-[20px]">history</span>
                Lần nộp gần nhất
            </h3>
            {latestSubmission ? (
                <div className="max-h-[320px] space-y-2.5 overflow-y-auto pr-1 text-xs text-slate-600">
                    <div className="rounded-xl bg-sky-50/50 border border-sky-100 px-3.5 py-2.5 flex items-center justify-between">
                        <span className="text-slate-500">Lần nộp:</span>
                        <span className="font-bold text-sky-950">
                            #{latestSubmission.attemptNo}
                        </span>
                    </div>
                    <div className="rounded-xl bg-sky-50/50 border border-sky-100 px-3.5 py-2.5 flex items-center justify-between">
                        <span className="text-slate-500">Thời gian:</span>
                        <span className="font-medium text-slate-900">
                            {formatDateTime(latestSubmission.submittedAt)}
                        </span>
                    </div>
                    <div className="rounded-xl bg-sky-50/50 border border-sky-100 px-3.5 py-2.5 flex items-center justify-between">
                        <span className="text-slate-500">Trạng thái:</span>
                        <span className="font-bold text-sky-700">
                            {getSubmissionLabel(latestSubmission.status)}
                        </span>
                    </div>
                    {latestSubmission.repositoryUrl ? (
                        <a
                            href={latestSubmission.repositoryUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="block break-words rounded-xl bg-sky-50 px-3.5 py-2 text-sky-600 hover:underline"
                        >
                            {latestSubmission.repositoryUrl}
                        </a>
                    ) : null}
                    {latestSubmission.files.length ? (
                        <div className="space-y-1.5 pt-1">
                            <p className="text-[11px] font-semibold text-slate-500">File đã nộp:</p>
                            {latestSubmission.files.map((file) => (
                                <a
                                    key={file.url}
                                    href={file.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block break-words rounded-xl border border-sky-100 bg-sky-50/50 px-3 py-2 text-sky-700 hover:underline"
                                >
                                    {file.originalName}
                                </a>
                            ))}
                        </div>
                    ) : null}
                </div>
            ) : (
                <p className="text-xs text-slate-400">Bạn chưa có lần nộp nào cho bài tập này.</p>
            )}
        </section>
    );
}
