"use client";

import { useState } from "react";
import Link from "next/link";
import { LoginTopBar } from "@/components/auth/LoginTopBar";
import { LoginFooter } from "@/components/auth/LoginFooter";
import { topBarData, footerLinks } from "@/lib/login-data";

const faqs = [
    {
        q: "Làm thế nào để sinh viên nộp bài kiểm thử UI Android?",
        a: "Sinh viên đăng nhập vào hệ thống, truy cập mục 'Lớp học' hoặc 'Bài tập', chọn bài tập cần nộp và tải lên file .apk hoặc file nén mã nguồn .zip của ứng dụng Android. Hệ thống sẽ tự động chạy kiểm thử giao diện và trả về kết quả theo tiêu chí Rubric.",
    },
    {
        q: "Tôi có thể đăng nhập bằng tài khoản Google trường không?",
        a: "Có. UIGrade AI hỗ trợ đăng nhập nhanh bằng tài khoản Google (bao gồm email sinh viên/giảng viên của các trường đại học). Chỉ cần chọn 'Tiếp tục với Google' ở màn hình đăng nhập.",
    },
    {
        q: "Làm sao để giảng viên tạo bài tập và thiết lập Rubric chấm điểm?",
        a: "Giảng viên truy cập mục 'Tạo bài tập', tải lên ảnh thiết kế mẫu (Baseline UI) và cấu hình các tiêu chí chấm điểm trực quan (Rubric) bao gồm tỷ lệ màu sắc, vị trí component, kích thước và phản hồi tương tác.",
    },
    {
        q: "Nếu quên mật khẩu tôi cần làm gì?",
        a: "Bạn có thể truy cập trang 'Quên mật khẩu' bằng cách bấm vào liên kết ở màn hình đăng nhập, sau đó nhập email để nhận liên kết đặt lại mật khẩu bảo mật.",
    },
];

export default function HelpPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <div className="flex min-h-screen flex-col bg-blue-50/40 text-slate-900">
            <LoginTopBar data={topBarData} />

            <main className="flex-1 px-4 py-10 sm:px-6">
                <div className="mx-auto max-w-4xl space-y-8">
                    {/* Header Banner */}
                    <div className="text-center space-y-2">
                        <div className="inline-block rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
                            TRUNG TÂM TRỢ GIÚP
                        </div>
                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                            Chúng tôi có thể giúp gì cho bạn?
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
                            Hướng dẫn sử dụng, giải đáp thắc mắc thường gặp và hỗ trợ kỹ thuật về hệ thống chấm điểm UIGrade AI.
                        </p>
                    </div>

                    {/* Quick Action Cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-blue-200">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200 mb-3">
                                <span className="material-symbols-outlined text-[22px]">school</span>
                            </div>
                            <h2 className="text-sm font-bold text-slate-900">Dành cho Sinh viên</h2>
                            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                                Hướng dẫn cách tham gia lớp bằng mã, build file APK và theo dõi kết quả chấm điểm.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-blue-200">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200 mb-3">
                                <span className="material-symbols-outlined text-[22px]">assignment</span>
                            </div>
                            <h2 className="text-sm font-bold text-slate-900">Dành cho Giảng viên</h2>
                            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                                Hướng dẫn tạo lớp, tải lên giao diện Baseline UI, thiết lập tiêu chí Rubric và xuất báo cáo.
                            </p>
                        </div>

                        <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-blue-200">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-200 mb-3">
                                <span className="material-symbols-outlined text-[22px]">contact_support</span>
                            </div>
                            <h2 className="text-sm font-bold text-slate-900">Hỗ trợ kỹ thuật</h2>
                            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                                Gửi yêu cầu hỗ trợ trực tiếp đến ban quản trị hoặc xem hướng dẫn xử lý sự cố.
                            </p>
                            <Link href="/contact" className="mt-2 inline-block text-xs font-bold text-blue-600 hover:text-blue-800">
                                Liên hệ ngay →
                            </Link>
                        </div>
                    </div>

                    {/* FAQ Accordion */}
                    <div className="rounded-3xl border border-blue-100 bg-white p-6 sm:p-8 shadow-xs space-y-4">
                        <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-600">help</span>
                            Câu hỏi thường gặp (FAQ)
                        </h2>

                        <div className="space-y-3">
                            {faqs.map((item, idx) => {
                                const isOpen = openIndex === idx;
                                return (
                                    <div
                                        key={item.q}
                                        className="rounded-2xl border border-slate-100 bg-slate-50/50 transition overflow-hidden"
                                    >
                                        <button
                                            type="button"
                                            onClick={() => setOpenIndex(isOpen ? null : idx)}
                                            className="flex w-full items-center justify-between p-4 text-left font-bold text-xs sm:text-sm text-slate-800 hover:text-blue-700 transition"
                                        >
                                            <span>{item.q}</span>
                                            <span className="material-symbols-outlined text-slate-400 text-[20px] shrink-0">
                                                {isOpen ? "expand_less" : "expand_more"}
                                            </span>
                                        </button>
                                        {isOpen && (
                                            <div className="border-t border-slate-100 bg-white px-4 py-3.5 text-xs text-slate-600 leading-relaxed">
                                                {item.a}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>

            <LoginFooter links={footerLinks} />
        </div>
    );
}
