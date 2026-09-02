import type { AnyObj } from "@/app/ui/grading_detail/type/grading_detail.type";
import { formatDateTime, isPdf, toNum, toText } from "@/app/ui/grading_detail/type/grading_detail.unit";

type Props = {
    detail: AnyObj | null;
    selectedFile: AnyObj | null;
};

export function SubmissionPreview({ detail, selectedFile }: Props) {
    return (
        <div className="overflow-hidden rounded-3xl border border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-4">
                <div>
                    <p className="text-sm font-semibold text-slate-900">
                        Bài làm: {toText(selectedFile?.originalName, "Không có file đính kèm")}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                        Lần nộp #{toNum(detail?.attemptNo, 1)} • {formatDateTime(detail?.submittedAt)}
                    </p>
                </div>

                {selectedFile?.url && (
                    <a
                        href={selectedFile.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
                    >
                        <span className="material-symbols-outlined">download</span>
                    </a>
                )}
            </div>

            <div className="bg-slate-50 p-4">
                {selectedFile?.url && isPdf(selectedFile.url, selectedFile.mimeType) ? (
                    <iframe
                        src={selectedFile.url}
                        title={toText(selectedFile.originalName)}
                        className="h-[720px] w-full rounded-2xl bg-white"
                    />
                ) : selectedFile?.url ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
                        File này không preview trực tiếp được. Hãy bấm nút tải xuống để mở.
                    </div>
                ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
                        Bài nộp này không có file nguồn.
                    </div>
                )}
            </div>
        </div>
    );
}
