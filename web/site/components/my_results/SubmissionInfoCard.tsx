import type { ResultItem } from "@/app/ui/my_results/type/my_results.type";
import { formatDateTime } from "@/app/ui/my_results/type/my_results.utils";

type SubmissionInfoCardProps = { item: ResultItem };

export function SubmissionInfoCard({ item }: SubmissionInfoCardProps) {
    return (
        <div className="rounded-2xl border border-blue-100 bg-white p-3.5 shadow-2xs">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Thông tin bài nộp</p>
            <div className="mt-2 space-y-1.5 text-xs text-slate-600">
                <p>
                    <span className="font-semibold text-slate-800">Thời gian nộp:</span> {formatDateTime(item.submittedAt)}
                </p>
                <p>
                    <span className="font-semibold text-slate-800">Ghi chú của bạn:</span> {item.studentNote || "Không có ghi chú"}
                </p>
                <p className="break-all">
                    <span className="font-semibold text-slate-800">Repository / File:</span>{" "}
                    {item.repositoryUrl ? (
                        <a href={item.repositoryUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                            {item.repositoryUrl}
                        </a>
                    ) : (
                        "Không có"
                    )}
                </p>
            </div>
        </div>
    );
}
