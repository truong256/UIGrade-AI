import { CourseCard } from "./CourseCard";
import type { AccountCourseItem } from "@/app/ui/account/type/account.types";

type Props = {
    items: AccountCourseItem[];
};

export function CurrentCoursesSection({ items }: Props) {
    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between gap-3 px-1">
                <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <span className="material-symbols-outlined text-sky-600 text-[20px]">school</span>
                        Lớp học đang tham gia
                    </h2>
                    <p className="text-xs text-slate-500">Danh sách các lớp học hiện tại của bạn.</p>
                </div>

                <span className="rounded-full bg-sky-50 border border-sky-200 px-3 py-0.5 text-xs font-bold text-sky-700 shadow-2xs">
                    {items.length} lớp
                </span>
            </div>

            {!items.length ? (
                <div className="rounded-3xl border border-dashed border-sky-200 bg-white px-6 py-12 text-center text-xs text-slate-400">
                    Tài khoản này chưa tham gia lớp học nào.
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {items.map((course) => (
                        <CourseCard key={course._id} course={course} />
                    ))}
                </div>
            )}
        </section>
    );
}
