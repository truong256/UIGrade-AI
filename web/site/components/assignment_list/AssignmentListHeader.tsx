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
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172033] flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-blue-600 text-[26px]">assignment</span>
                    Danh sách Bài tập
                </h1>
                <p className="mt-1 text-sm text-[#4A5568]">
                    Theo dõi các bài tập lập trình Android, hạn nộp và tiêu chí chấm điểm theo Rubric.
                </p>
            </div>

            {showCreate && (
                onOpenCreateModal ? (
                    <button
                        type="button"
                        onClick={onOpenCreateModal}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 active:scale-98 shrink-0"
                    >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Tạo bài tập mới
                    </button>
                ) : (
                    <Link
                        href="/ui/create_assignment"
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 active:scale-98 shrink-0"
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
