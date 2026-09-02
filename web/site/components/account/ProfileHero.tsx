import type { CurrentUser } from "@/app/ui/account/type/account.types";

type Props = {
    user: CurrentUser;
    onEditProfile: () => void;
    onChangePassword: () => void;
};

function getRoleLabel(role?: CurrentUser["role"]) {
    if (role === "teacher") return "Giảng viên";
    if (role === "admin") return "Quản trị viên";
    return "Sinh viên";
}

function getAvatarFallback(name?: string) {
    const trimmed = String(name || "BM").trim();
    const words = trimmed.split(/\s+/).filter(Boolean);

    if (words.length >= 2) {
        return `${words[0][0] || ""}${words[words.length - 1][0] || ""}`.toUpperCase();
    }

    return trimmed.slice(0, 2).toUpperCase();
}

export function ProfileHero({ user, onEditProfile, onChangePassword }: Props) {
    const avatarFallback = getAvatarFallback(user.name);

    return (
        <section className="rounded-3xl border border-sky-100 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col items-center gap-5 text-center">
                <div className="relative">
                    <div className="h-28 w-28 rounded-full border-4 border-sky-200 bg-sky-50 p-1 shadow-md">
                        {user.avatar ? (
                            <img
                                src={user.avatar}
                                alt={user.name}
                                className="h-full w-full rounded-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-sky-600 to-sky-400 text-2xl font-black text-white">
                                {avatarFallback}
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onEditProfile}
                        className="absolute bottom-0 right-0 inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-sky-600 text-white shadow-md transition hover:scale-105"
                        aria-label="Chỉnh sửa hồ sơ"
                    >
                        <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                    </button>
                </div>

                <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">{user.name}</h1>
                    <p className="mt-0.5 text-xs text-slate-500">{user.email}</p>

                    <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2">
                        <span className="rounded-full bg-sky-100 border border-sky-200 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-sky-800">
                            {getRoleLabel(user.role)}
                        </span>

                        {!!user.cohort && (
                            <span className="rounded-full bg-slate-100 px-3 py-0.5 text-[11px] font-semibold text-slate-600">
                                {user.cohort}
                            </span>
                        )}

                        {!!user.studentCode && (
                            <span className="rounded-full bg-sky-50 border border-sky-200 px-3 py-0.5 text-[11px] font-mono font-bold text-sky-700">
                                MSSV: {user.studentCode}
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid w-full gap-3 sm:max-w-3xl sm:grid-cols-3">
                    <div className="rounded-2xl bg-sky-50/50 border border-sky-100 px-4 py-3 text-left">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Số điện thoại</p>
                        <p className="mt-0.5 text-xs font-bold text-slate-800">{user.phone || "Chưa cập nhật"}</p>
                    </div>

                    <div className="rounded-2xl bg-sky-50/50 border border-sky-100 px-4 py-3 text-left">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Khoa / Bộ môn</p>
                        <p className="mt-0.5 text-xs font-bold text-slate-800">{user.department || "Chưa cập nhật"}</p>
                    </div>

                    <div className="rounded-2xl bg-sky-50/50 border border-sky-100 px-4 py-3 text-left">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Giới thiệu</p>
                        <p className="mt-0.5 line-clamp-2 text-xs font-medium text-slate-700">{user.bio || "Chưa cập nhật"}</p>
                    </div>
                </div>

                <div className="flex w-full flex-col gap-2.5 sm:max-w-sm sm:flex-row pt-2">
                    <button
                        type="button"
                        onClick={onEditProfile}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-600/20 transition hover:bg-sky-700 active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[16px]">edit</span>
                        Chỉnh sửa hồ sơ
                    </button>

                    <button
                        type="button"
                        onClick={onChangePassword}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[16px]">lock</span>
                        Đổi mật khẩu
                    </button>
                </div>
            </div>
        </section>
    );
}
