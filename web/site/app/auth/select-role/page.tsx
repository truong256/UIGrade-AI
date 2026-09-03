"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type Role = "student" | "lecturer";

const ROLES: { value: Role; label: string; description: string; icon: string }[] = [
    {
        value: "student",
        label: "Sinh viên",
        description: "Tham gia lớp học, nộp bài tập và nhận đánh giá từ giảng viên",
        icon: "school",
    },
    {
        value: "lecturer",
        label: "Giảng viên",
        description: "Tạo lớp học, ra đề bài, cấu hình rubric và chấm điểm sinh viên",
        icon: "person_chalkboard",
    },
];

export default function SelectRolePage() {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleConfirm = async () => {
        if (!selectedRole) {
            setError("Vui lòng chọn vai trò trước khi tiếp tục.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const supabase = getSupabaseBrowserClient();
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                setError("Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.");
                router.replace("/login");
                return;
            }

            // Update profile role via API route (server-side enforces student/lecturer only)
            const res = await fetch("/api/auth/set-role", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: selectedRole }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.message || "Không thể lưu vai trò. Vui lòng thử lại.");
                setLoading(false);
                return;
            }

            // Role saved — redirect to dashboard
            router.replace("/ui/dashboard");
        } catch {
            setError("Đã xảy ra lỗi. Vui lòng thử lại sau.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-blue-50/40 px-4 py-12">
            <div className="w-full max-w-lg">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 mb-4">
                        <span className="material-symbols-outlined text-blue-600 text-[32px]">
                            manage_accounts
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">
                        Chào mừng đến UIGrade AI!
                    </h1>
                    <p className="text-sm text-slate-500">
                        Bạn sử dụng UIGrade AI với vai trò nào?
                        <br />
                        Chọn đúng để hệ thống cấu hình chức năng phù hợp cho bạn.
                    </p>
                </div>

                {/* Role cards */}
                <div className="space-y-3 mb-6">
                    {ROLES.map((role) => {
                        const isSelected = selectedRole === role.value;
                        return (
                            <button
                                key={role.value}
                                type="button"
                                onClick={() => {
                                    setSelectedRole(role.value);
                                    setError("");
                                }}
                                disabled={loading}
                                className={`w-full text-left rounded-2xl border-2 p-5 transition-all focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                                    isSelected
                                        ? "border-blue-500 bg-blue-50 shadow-sm"
                                        : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
                                } disabled:opacity-60 disabled:cursor-not-allowed`}
                            >
                                <div className="flex items-center gap-4">
                                    <div
                                        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                            isSelected ? "bg-blue-100" : "bg-slate-100"
                                        }`}
                                    >
                                        <span
                                            className={`material-symbols-outlined text-[24px] ${
                                                isSelected ? "text-blue-600" : "text-slate-500"
                                            }`}
                                        >
                                            {role.icon}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span
                                                className={`text-base font-semibold ${
                                                    isSelected ? "text-blue-700" : "text-slate-800"
                                                }`}
                                            >
                                                {role.label}
                                            </span>
                                            {isSelected && (
                                                <span className="material-symbols-outlined text-blue-500 text-[20px]">
                                                    check_circle
                                                </span>
                                            )}
                                        </div>
                                        <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                                            {role.description}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-700">
                        <span className="material-symbols-outlined text-[16px] shrink-0">error</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Confirm button */}
                <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!selectedRole || loading}
                    className="w-full h-12 rounded-xl bg-blue-600 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <>
                            <span className="material-symbols-outlined animate-spin text-[18px]">
                                progress_activity
                            </span>
                            <span>Đang lưu...</span>
                        </>
                    ) : (
                        <span>Xác nhận và tiếp tục</span>
                    )}
                </button>

                <p className="mt-4 text-center text-xs text-slate-400">
                    Bạn có thể thay đổi thông tin trong phần Tài khoản sau khi đăng nhập.
                </p>
            </div>
        </div>
    );
}
