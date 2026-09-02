import type { AssignmentItem } from "@/app/ui/submit_assignment/type/submit_assignment.type";
import { MarkdownBlock } from "./MarkdownBlock";

export function AssignmentDetails({ assignment }: { assignment: AssignmentItem }) {
    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sky-600">task</span>
                    {assignment.title}
                </h2>
                <p className="mt-1 text-xs font-medium text-slate-500">
                    Lớp:{" "}
                    <span className="text-sky-700 font-semibold">
                        {assignment.classroom
                            ? `${assignment.classroom.name} (${assignment.classroom.code})`
                            : "Chưa có thông tin lớp học"}
                    </span>
                </p>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-xs">
                <p className="mb-2 text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-sky-600">description</span>
                    Mô tả bài tập & Yêu cầu
                </p>
                <MarkdownBlock content={assignment.description} />
            </div>

            {assignment.rubricText ? (
                <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4">
                    <p className="mb-2 text-xs font-bold text-sky-900 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-sky-600">rubric</span>
                        Rubric / Thang điểm đánh giá
                    </p>
                    <MarkdownBlock content={assignment.rubricText} variant="rubric" />
                </div>
            ) : null}
        </div>
    );
}
