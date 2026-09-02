import type { AssignmentItem } from "@/app/ui/submit_assignment/type/submit_assignment.type";

export function AttachmentCard({ assignment }: { assignment: AssignmentItem | null }) {
    return (
        <section className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[20px]">attach_file</span>
                Tệp đính kèm bài tập
            </h3>
            {assignment?.attachments.length ? (
                <div className="max-h-[220px] space-y-2 overflow-y-auto pr-1 text-xs">
                    {assignment.attachments.map((file) => (
                        <a
                            key={`${file.kind}-${file.url}`}
                            href={file.url}
                            target="_blank"
                            rel="noreferrer"
                            className="block break-words rounded-xl border border-blue-100 bg-blue-50/50 px-3.5 py-2.5 text-blue-700 hover:bg-blue-100 hover:underline transition"
                        >
                            {file.originalName}
                            <span className="ml-2 text-[10px] font-semibold uppercase text-blue-500">
                                ({file.kind})
                            </span>
                        </a>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-slate-400">Bài tập này không có file đính kèm.</p>
            )}
        </section>
    );
}
