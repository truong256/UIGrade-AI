import Link from "next/link";
import type { AssignmentDetail, AssignmentOption } from "@/app/ui/grading_detail/type/grading_detail.type";
import { formatDate, formatDateTime } from "@/app/ui/grading_detail/type/grading_detail.unit";
import { AlertMessages } from "./AlertMessages";

type Props = {
    assignment: AssignmentDetail | null;
    assignmentId: string;
    assignmentOptions: AssignmentOption[];
    selectedSubmissionId: string | null;
    grading: boolean;
    detailLoading: boolean;
    error: string;
    notice: string;
    onChangeAssignment: (assignmentId: string) => void;
    onGrade: (mode: "grade" | "regrade") => void;
};

export function GradingHeader({
                                  assignment,
                                  assignmentId,
                                  assignmentOptions,
                                  selectedSubmissionId,
                                  grading,
                                  detailLoading,
                                  error,
                                  notice,
                                  onChangeAssignment,
                                  onGrade,
                              }: Props) {
    return (
        <section className="rounded-3xl border border-sky-100 bg-white px-6 py-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                        <Link href="/ui/assignment_list" className="hover:text-sky-600 font-medium">
                            Bài tập
                        </Link>
                        <span>/</span>
                        <span className="font-semibold text-sky-800">Chấm bài Android UI</span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sky-600 text-[26px]">grading</span>
                        {assignment?.title || "Chi tiết chấm bài"}
                    </h1>

                    <p className="mt-1.5 text-xs text-slate-500">
                        Lớp: <span className="font-semibold text-sky-950">{assignment?.classroom?.name || "--"}</span> • Hạn nộp: {formatDateTime(assignment?.dueAt)}
                    </p>

                    <div className="mt-4 flex flex-col gap-1.5 sm:max-w-md">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                            Chọn bài tập để chấm
                        </label>

                        <select
                            value={assignmentId}
                            onChange={(e) => onChangeAssignment(e.target.value)}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                        >
                            {assignmentOptions.map((item) => (
                                <option key={item._id} value={item._id}>
                                    {item.title}
                                    {item.classroomName ? ` • ${item.classroomName}` : ""}
                                    {item.dueAt ? ` • ${formatDate(item.dueAt)}` : ""}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                    <button
                        type="button"
                        onClick={() => onGrade("grade")}
                        disabled={!selectedSubmissionId || grading || detailLoading}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-600/20 hover:bg-sky-700 active:scale-95 transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                        {grading ? "AI đang chấm..." : "Chấm AI tự động"}
                    </button>

                    <button
                        type="button"
                        onClick={() => onGrade("regrade")}
                        disabled={!selectedSubmissionId || grading || detailLoading}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2.5 text-xs font-bold text-sky-700 hover:bg-sky-100 transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <span className="material-symbols-outlined text-[16px]">refresh</span>
                        {grading ? "Đang chấm lại..." : "Chấm lại bài"}
                    </button>
                </div>
            </div>

            <AlertMessages error={error} notice={notice} />
        </section>
    );
}
