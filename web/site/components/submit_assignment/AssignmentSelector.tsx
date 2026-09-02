import type { AssignmentItem } from "@/app/ui/submit_assignment/type/submit_assignment.type";
import { getSubmissionBadge, getSubmissionLabel } from "@/app/ui/submit_assignment/type/submit_assignment.utils";

export function AssignmentSelector({
                                       assignments,
                                       selectedId,
                                       selectedAssignment,
                                       loading,
                                       onSelect,
                                   }: {
    assignments: AssignmentItem[];
    selectedId: string;
    selectedAssignment: AssignmentItem | null;
    loading: boolean;
    onSelect: (id: string) => void;
}) {
    return (
        <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Chọn bài tập cần nộp
                </label>
                <select
                    value={selectedId}
                    onChange={(event) => onSelect(event.target.value)}
                    disabled={loading || !assignments.length}
                    className="h-11 w-full rounded-xl border border-slate-200 px-4 text-xs font-medium text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 bg-white"
                >
                    {assignments.length ? (
                        assignments.map((item) => (
                            <option key={item._id} value={item._id}>
                                {item.title} {item.classroom ? `(${item.classroom.code})` : ""}
                            </option>
                        ))
                    ) : (
                        <option value="">Không có bài tập khả dụng</option>
                    )}
                </select>
            </div>

            <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Trạng thái nộp bài của bạn
                </label>
                <div className="flex h-11 items-center rounded-xl border border-blue-100 bg-blue-50/40 px-4">
                    <span
                        className={`inline-flex rounded-full border px-3 py-0.5 text-xs font-bold ${getSubmissionBadge(
                            selectedAssignment?.latestSubmission?.status
                        )}`}
                    >
                        {getSubmissionLabel(selectedAssignment?.latestSubmission?.status)}
                    </span>
                </div>
            </div>
        </div>
    );
}
