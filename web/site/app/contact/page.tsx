"use client";

import { useState } from "react";
import { LoginTopBar } from "@/components/auth/LoginTopBar";
import { LoginFooter } from "@/components/auth/LoginFooter";
import { topBarData, footerLinks } from "@/lib/login-data";

export default function ContactPage() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        if (!name.trim() || !email.trim() || !message.trim()) {
            setError("Vui lòng điền đầy đủ họ tên, email và nội dung tin nhắn");
            return;
        }

        try {
            setLoading(true);
            // Giả lập gửi liên hệ thành công
            await new Promise((resolve) => setTimeout(resolve, 600));
            setSubmitted(true);
        } catch {
            setError("Không thể gửi tin nhắn lúc này. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-sky-50/40 text-slate-900">
            <LoginTopBar data={topBarData} />

            <main className="flex-1 px-4 py-10 sm:px-6">
                <div className="mx-auto max-w-4xl space-y-8">
                    <div className="text-center space-y-2">
                        <div className="inline-block rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-sky-700">
                            KẾT NỐI VỚI CHÚNG TÔI
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                            Liên hệ Ban Quản trị
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                            Có câu hỏi, góp ý hoặc cần hỗ trợ kỹ thuật về UIGrade AI? Hãy gửi tin nhắn cho chúng tôi.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
                        {/* Info cards */}
                        <div className="space-y-4 md:col-span-5">
                            <div className="rounded-3xl border border-sky-100 bg-white p-6 shadow-xs space-y-4">
                                <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                                    Thông tin liên hệ
                                </h2>

                                <div className="space-y-3.5 text-xs text-slate-600">
                                    <div className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-200">
                                            <span className="material-symbols-outlined text-[18px]">mail</span>
                                        </div>
                                        <div>
                                            <span className="block font-bold text-slate-800">Email hỗ trợ</span>
                                            <a href="mailto:support@uigrade.edu.vn" className="text-sky-600 hover:underline">
                                                support@uigrade.edu.vn
                                            </a>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-200">
                                            <span className="material-symbols-outlined text-[18px]">call</span>
                                        </div>
                                        <div>
                                            <span className="block font-bold text-slate-800">Hotline kỹ thuật</span>
                                            <span className="text-slate-600">(028) 3896 8641</span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600 border border-sky-200">
                                            <span className="material-symbols-outlined text-[18px]">location_on</span>
                                        </div>
                                        <div>
                                            <span className="block font-bold text-slate-800">Địa chỉ làm việc</span>
                                            <span className="text-slate-600">Phòng Lab Công nghệ Phần mềm, Tòa nhà Công nghệ thông tin</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form */}
                        <div className="md:col-span-7">
                            <div className="rounded-3xl border border-sky-100 bg-white p-6 sm:p-8 shadow-xs">
                                {submitted ? (
                                    <div className="py-8 text-center space-y-3">
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                                            <span className="material-symbols-outlined text-[28px]">check_circle</span>
                                        </div>
                                        <h2 className="text-base font-bold text-slate-900">Gửi tin nhắn thành công!</h2>
                                        <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                                            Cảm ơn bạn đã liên hệ. Ban quản trị hệ thống sẽ phản hồi qua email trong vòng 24 giờ làm việc.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSubmitted(false);
                                                setName("");
                                                setEmail("");
                                                setSubject("");
                                                setMessage("");
                                            }}
                                            className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-xs font-bold text-sky-700 hover:bg-sky-100 transition"
                                        >
                                            Gửi tin nhắn khác
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-3.5">
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                                    Họ và tên *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    placeholder="Nguyễn Văn A"
                                                    className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-xs outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                                    required
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                                    Email *
                                                </label>
                                                <input
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="example@university.edu.vn"
                                                    className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-xs outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                                Chủ đề
                                            </label>
                                            <input
                                                type="text"
                                                value={subject}
                                                onChange={(e) => setSubject(e.target.value)}
                                                placeholder="Ví dụ: Báo lỗi nộp bài APK, thắc mắc Rubric..."
                                                className="h-10 w-full rounded-xl border border-slate-200 px-3.5 text-xs outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                                                Nội dung tin nhắn *
                                            </label>
                                            <textarea
                                                value={message}
                                                onChange={(e) => setMessage(e.target.value)}
                                                rows={4}
                                                placeholder="Mô tả chi tiết vấn đề hoặc thắc mắc của bạn..."
                                                className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                                required
                                            />
                                        </div>

                                        {error && (
                                            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-600 font-medium">
                                                {error}
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-600/20 transition hover:bg-sky-700 active:scale-95 disabled:opacity-60"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">send</span>
                                            {loading ? "Đang gửi..." : "Gửi tin nhắn"}
                                        </button>
                                    </form>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <LoginFooter links={footerLinks} />
        </div>
    );
}
