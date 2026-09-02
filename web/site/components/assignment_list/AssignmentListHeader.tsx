import Link from "next/link";
import type { FC } from "react";

type Role = "admin" | "teacher" | "student" | "lecturer" | "User";

type AssignmentListHeaderProps = {
    role?: Role;
    canManage?: boolean;
    isStudent?: boolean;
    onOpenCreateModal?: () => void;
};

export const AssignmentListHeader: FC<AssignmentListHeaderProps> = ({
    role,
    canManage,
    onOpenCreateModal,
}) => {
    const showCreate = canManage || (role === "teacher" || role === "lecturer" || role === "admin");

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sky-600 text-[28px]">assignment</span>
                    Danh sách Bài tập
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                    Theo dõi các bài tập lập trình Android, hạn nộp và tiêu chí chấm điểm theo Rubric.
                </p>
            </div>

            {showCreate && (
                onOpenCreateModal ? (
                    <button
                        type="button"
                        onClick={onOpenCreateModal}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-600/20 transition hover:bg-sky-700 active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Tạo bài tập mới
                    </button>
                ) : (
                    <Link
                        href="/ui/create_assignment"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-600/20 transition hover:bg-sky-700 active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Tạo bài tập mới
                    </Link>
                )
            )}
        </div>
    );
};

export default AssignmentListHeader;
