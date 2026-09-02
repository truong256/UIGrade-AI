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
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sky-600 text-[28px]">school</span>
                    Danh sách Lớp học
                </h1>
                <p className="mt-1 text-xs text-slate-500">
                    Quản lý các khóa học, danh sách sinh viên và bài tập kiểm thử UI.
                    {typeof total === "number" ? ` (Tổng cộng: ${total} lớp)` : ""}
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
                {handleJoin && (
                    <button
                        type="button"
                        onClick={handleJoin}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-bold text-sky-700 transition-all hover:bg-sky-100 active:scale-95 shadow-xs"
                    >
                        <span className="material-symbols-outlined text-[16px]">
                            login
                        </span>
                        Tham gia bằng mã
                    </button>
                )}

                {onOpenAddModal && (role === "teacher" || role === "lecturer" || role === "admin") && (
                    <button
                        type="button"
                        onClick={onOpenAddModal}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-sky-600/20 transition-all hover:bg-sky-700 active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[16px]">
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