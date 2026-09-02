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
        <section className="rounded-2xl border border-slate-200/80 bg-white px-6 py-5 shadow-xs">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
                        <Link href="/ui/assignment_list" className="hover:text-blue-600 font-medium">
                            Bài tập
                        </Link>
                        <span>/</span>
                        <span className="font-semibold text-blue-700">Chấm bài Android UI</span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#172033] flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-blue-600 text-[24px]">grading</span>
                        {assignment?.title || "Chi tiết chấm bài"}
                    </h1>

                    <p className="mt-1 text-xs sm:text-sm text-[#4A5568]">
                        Lớp: <span className="font-semibold text-[#172033]">{assignment?.classroom?.name || "--"}</span> • Hạn nộp: {formatDateTime(assignment?.dueAt)}
                    </p>

                    <div className="mt-3.5 flex flex-col gap-1.5 sm:max-w-md">
                        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                            Chọn bài tập để chấm
                        </label>

                        <select
                            value={assignmentId}
                            onChange={(e) => onChangeAssignment(e.target.value)}
                            className="h-10 rounded-xl border border-slate-200 bg-white px-3.5 text-xs sm:text-sm font-medium text-[#172033] outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-blue-600 px-5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-blue-700 active:scale-98 transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                        {grading ? "AI đang chấm..." : "Chấm AI tự động"}
                    </button>

                    <button
                        type="button"
                        onClick={() => onGrade("regrade")}
                        disabled={!selectedSubmissionId || grading || detailLoading}
                        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 px-4 text-xs sm:text-sm font-semibold text-blue-700 hover:bg-blue-100 transition active:scale-98 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <span className="material-symbols-outlined text-[18px]">refresh</span>
                        {grading ? "Đang chấm lại..." : "Chấm lại bài"}
                    </button>
                </div>
            </div>

            <AlertMessages error={error} notice={notice} />
        </section>
    );
}
