import type { SidebarStudent } from "@/app/ui/grading_detail/type/grading_detail.type";

type Props = {
    student: SidebarStudent;
    active: boolean;
    onSelect: () => void;
};

export function StudentListItem({ student, active, onSelect }: Props) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className={`flex items-center gap-3 rounded-2xl border p-2.5 text-left transition-all duration-150 ${
                active
                    ? "border-blue-300 bg-blue-50 shadow-xs"
                    : "border-transparent hover:bg-blue-50/50"
            }`}
        >
            <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
                    active
                        ? "bg-blue-600 text-white font-bold shadow-xs"
                        : "bg-blue-100/70 text-blue-700 font-semibold"
                }`}
            >
                <span className="text-xs">{student.name.slice(0, 2).toUpperCase()}</span>
            </div>

            <div className="min-w-0 flex-1">
                <p className={`truncate text-xs ${active ? "font-bold text-blue-950" : "font-semibold text-slate-800"}`}>
                    {student.name}
                </p>
                <p
                    className={`mt-0.5 truncate text-[11px] ${
                        student.missing ? "text-rose-500 font-medium" : active ? "text-blue-700 font-medium" : "text-slate-500"
                    }`}
                >
                    {student.studentCode ? `${student.studentCode} • ` : ""}
                    {student.statusText}
                </p>
            </div>

            <div
                className={`text-sm font-bold ${
                    active ? "text-blue-700" : student.missing ? "text-slate-300" : "text-slate-700"
                }`}
            >
                {student.scoreText}
            </div>
        </button>
    );
}
