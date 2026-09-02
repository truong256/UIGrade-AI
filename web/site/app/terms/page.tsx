import { LoginTopBar } from "@/components/auth/LoginTopBar";
import { LoginFooter } from "@/components/auth/LoginFooter";
import { topBarData, footerLinks } from "@/lib/login-data";

export default function TermsPage() {
    return (
        <div className="flex min-h-screen flex-col bg-sky-50/40 text-slate-900">
            <LoginTopBar data={topBarData} />

            <main className="flex-1 px-4 py-10 sm:px-6">
                <div className="mx-auto max-w-3xl space-y-6">
                    <div className="text-center space-y-1">
                        <div className="inline-block rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-700">
                            QUY ĐỊNH VẬN HÀNH
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                            Điều khoản Dịch vụ
                        </h1>
                        <p className="text-xs text-slate-500">Cập nhật lần cuối: Tháng 8/2026</p>
                    </div>

                    <div className="rounded-3xl border border-sky-100 bg-white p-6 sm:p-8 shadow-xs text-xs sm:text-sm text-slate-600 leading-relaxed space-y-5">
                        <section className="space-y-2">
                            <h2 className="text-base font-bold text-slate-900">1. Chấp thuận các điều khoản</h2>
                            <p>
                                Khi truy cập hoặc sử dụng hệ thống UIGrade AI, bạn đồng ý tuân thủ và chịu sự ràng buộc bởi các điều khoản, điều kiện và quy định bảo mật được nêu tại đây. Nếu không đồng ý với bất kỳ điều khoản nào, vui lòng ngưng sử dụng dịch vụ.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-base font-bold text-slate-900">2. Mục đích sử dụng</h2>
                            <p>
                                UIGrade AI được xây dựng nhằm phục vụ mục đích học tập, giảng dạy và nghiên cứu trong lĩnh vực phát triển ứng dụng di động Android. Người dùng cam kết chỉ sử dụng hệ thống cho các mục đích học thuật hợp pháp và trung thực.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-base font-bold text-slate-900">3. Quyền sở hữu trí tuệ và Mã nguồn</h2>
                            <p>
                                Sinh viên giữ quyền tác giả đối với mã nguồn và sản phẩm APK do mình tạo ra. Khi nộp bài lên hệ thống, bạn cấp quyền cho hệ thống và giảng viên chạy kiểm thử tự động, phân tích giao diện và lưu trữ phục vụ mục đích đánh giá kết quả học tập.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-base font-bold text-slate-900">4. Bảo mật tài khoản</h2>
                            <p>
                                Bạn có trách nhiệm bảo mật thông tin tài khoản và mật khẩu của mình. Mọi hành vi thực hiện dưới tài khoản của bạn sẽ do bạn chịu trách nhiệm trước quy chế đào tạo của nhà trường.
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <LoginFooter links={footerLinks} />
        </div>
    );
}
