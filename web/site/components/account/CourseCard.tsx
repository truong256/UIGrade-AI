import type { AccountCourseItem } from "@/app/ui/account/type/account.types";

type Props = {
    course: AccountCourseItem;
};

function getCourseBadge(seed: string) {
    const chars = seed.trim().slice(0, 2).toUpperCase() || "CL";
    return chars;
}

export function CourseCard({ course }: Props) {
    return (
        <article className="flex gap-4 rounded-3xl border border-blue-100 bg-white p-4 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 text-lg font-black text-white shadow-xs">
                {getCourseBadge(course.code || course.title)}
            </div>

            <div className="min-w-0 flex-1">
                <h3 className="line-clamp-1 text-sm font-bold text-slate-900">{course.title}</h3>

                <p className="mt-0.5 text-xs text-slate-500 truncate">{course.subtitle}</p>

                <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] font-medium">
                    <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 font-mono font-bold text-blue-700">{course.code || "Chưa có mã lớp"}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600">GV: {course.teacherName || "Chưa cập nhật"}</span>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-600">SV: {course.studentCount}</span>
                </div>
            </div>
        </article>
    );
}
