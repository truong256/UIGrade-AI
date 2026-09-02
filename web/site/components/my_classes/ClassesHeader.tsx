import type { FC } from "react";

type Role = "admin" | "teacher" | "student" | "lecturer" | "User";

type ClassesHeaderProps = {
    role?: Role;
    total?: number;
    onOpenAddModal?: () => void;
    onOpenJoinModal?: () => void;
    onJoin?: () => void;
};

export const ClassesHeader: FC<ClassesHeaderProps> = ({
    role = "teacher",
    total,
    onOpenAddModal,
    onOpenJoinModal,
    onJoin,
}) => {
    const handleJoin = onOpenJoinModal || onJoin;

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172033] flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-blue-600 text-[26px]">school</span>
                    Danh sách Lớp học
                </h1>
                <p className="mt-1 text-sm text-[#4A5568]">
                    Quản lý các khóa học, danh sách sinh viên và bài tập kiểm thử UI.
                    {typeof total === "number" ? ` (Tổng cộng: ${total} lớp)` : ""}
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:shrink-0">
                {handleJoin && (
                    <button
                        type="button"
                        onClick={handleJoin}
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/70 px-4 text-xs sm:text-sm font-semibold text-blue-700 transition hover:bg-blue-100/80 active:scale-98 shadow-xs"
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            login
                        </span>
                        Tham gia bằng mã
                    </button>
                )}

                {onOpenAddModal && (role === "teacher" || role === "lecturer" || role === "admin") && (
                    <button
                        type="button"
                        onClick={onOpenAddModal}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs sm:text-sm font-semibold text-white shadow-xs transition hover:bg-blue-700 active:scale-98"
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            add
                        </span>
                        Tạo lớp mới
                    </button>
                )}
            </div>
        </div>
    );
};

export default ClassesHeader;