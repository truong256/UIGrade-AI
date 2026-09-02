import type { AnyObj, AssignmentDetail, GradingTab, SidebarStudent } from "@/app/ui/grading_detail/type/grading_detail.type";
import { formatDateTime } from "@/app/ui/grading_detail/type/grading_detail.unit";
import { SidebarConfig } from "./SidebarConfig";
import { StudentListItem } from "./StudentListItem";

type Props = {
    assignment: AssignmentDetail | null;
    students: SidebarStudent[];
    visibleStudents: SidebarStudent[];
    selectedStudentId: string;
    keyword: string;
    tab: GradingTab;
    rubric: AnyObj[];
    loading: boolean;
    onKeywordChange: (keyword: string) => void;
    onTabChange: (tab: GradingTab) => void;
    onSelectStudent: (student: SidebarStudent) => void;
};

export function GradingSidebar({
                                   assignment,
                                   students,
                                   visibleStudents,
                                   selectedStudentId,
                                   keyword,
                                   tab,
                                   rubric,
                                   loading,
                                   onKeywordChange,
                                   onTabChange,
                                   onSelectStudent,
                               }: Props) {
    return (
        <aside className="lg:sticky lg:top-20 lg:col-span-4 lg:self-start">
            <section className="rounded-3xl border border-blue-100 bg-white p-4 shadow-sm">
                <h2 className="text-base font-bold text-slate-900 truncate">{assignment?.title || "Danh sách sinh viên"}</h2>
                <p className="mt-0.5 text-xs text-blue-700 font-medium">Hạn nộp: {formatDateTime(assignment?.dueAt)}</p>

                <div className="mt-4 flex border-b border-blue-100">
                    <button
                        type="button"
                        onClick={() => onTabChange("list")}
                        className={`flex-1 border-b-2 pb-2 text-xs font-bold uppercase tracking-wider transition ${
                            tab === "list" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-400 hover:text-slate-600"
                        }`}
                    >
                        Danh sách ({students.length})
                    </button>

                    <button
                        type="button"
                        onClick={() => onTabChange("config")}
                        className={`flex-1 border-b-2 pb-2 text-xs font-bold uppercase tracking-wider transition ${
                            tab === "config" ? "border-blue-600 text-blue-700" : "border-transparent text-slate-400 hover:text-slate-600"
                        }`}
                    >
                        Cấu hình
                    </button>
                </div>

                {tab === "list" ? (
                    <>
                        <div className="relative mt-3">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                                search
                            </span>
                            <input
                                value={keyword}
                                onChange={(e) => onKeywordChange(e.target.value)}
                                placeholder="Tìm kiếm sinh viên..."
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <div className="mt-3 flex max-h-[760px] flex-col gap-1.5 overflow-y-auto pr-1">
                            {loading ? (
                                <div className="rounded-2xl border border-dashed border-blue-100 bg-blue-50/30 px-4 py-8 text-center text-xs text-slate-500">
                                    Đang tải danh sách sinh viên...
                                </div>
                            ) : visibleStudents.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-blue-100 bg-blue-50/30 px-4 py-8 text-center text-xs text-slate-400">
                                    Không có sinh viên phù hợp.
                                </div>
                            ) : (
                                visibleStudents.map((student) => (
                                    <StudentListItem
                                        key={student.studentId}
                                        student={student}
                                        active={student.studentId === selectedStudentId}
                                        onSelect={() => onSelectStudent(student)}
                                    />
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    <div className="mt-4 max-h-[calc(100vh-180px)] overflow-y-auto pr-1">
                        <SidebarConfig assignment={assignment} rubric={rubric} />
                    </div>
                )}
            </section>
        </aside>
    );
}
