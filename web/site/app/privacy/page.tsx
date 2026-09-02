import { LoginTopBar } from "@/components/auth/LoginTopBar";
import { LoginFooter } from "@/components/auth/LoginFooter";
import { topBarData, footerLinks } from "@/lib/login-data";

export default function PrivacyPage() {
    return (
        <div className="flex min-h-screen flex-col bg-sky-50/40 text-slate-900">
            <LoginTopBar data={topBarData} />

            <main className="flex-1 px-4 py-10 sm:px-6">
                <div className="mx-auto max-w-3xl space-y-6">
                    <div className="text-center space-y-1">
                        <div className="inline-block rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-700">
                            BẢO VỆ DỮ LIỆU
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">
                            Chính sách Bảo mật
                        </h1>
                        <p className="text-xs text-slate-500">Cập nhật lần cuối: Tháng 8/2026</p>
                    </div>

                    <div className="rounded-3xl border border-sky-100 bg-white p-6 sm:p-8 shadow-xs text-xs sm:text-sm text-slate-600 leading-relaxed space-y-5">
                        <section className="space-y-2">
                            <h2 className="text-base font-bold text-slate-900">1. Thông tin thu thập</h2>
                            <p>
                                Chúng tôi thu thập các thông tin cần thiết để quản lý học tập bao gồm: Họ tên, địa chỉ email, mã sinh viên (MSSV), ảnh đại diện (nếu có), các tệp bài tập nộp (.apk, .zip), và nhật ký chấm điểm giao diện.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-base font-bold text-slate-900">2. Mục đích sử dụng thông tin</h2>
                            <p>
                                Thông tin thu thập chỉ được sử dụng cho việc:
                            </p>
                            <ul className="list-disc pl-5 space-y-1">
                                <li>Xác thực danh tính và phân quyền truy cập (Sinh viên, Giảng viên, Quản trị viên).</li>
                                <li>Chấm điểm tự động và gửi phản hồi, nhận xét kết quả học tập.</li>
                                <li>Cung cấp báo cáo phân tích tiến độ học tập cho giảng viên.</li>
                                <li>Nâng cao độ chính xác của các mô hình chấm điểm AI.</li>
                            </ul>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-base font-bold text-slate-900">3. Bảo vệ dữ liệu với Supabase & Row Level Security (RLS)</h2>
                            <p>
                                Mọi dữ liệu người dùng và kết quả chấm điểm được lưu trữ an toàn trong cơ sở dữ liệu Supabase PostgreSQL với chính sách Row Level Security nghiêm ngặt. Sinh viên chỉ có thể xem dữ liệu và kết quả của chính mình; Giảng viên chỉ quản lý các lớp học do mình phụ trách.
                            </p>
                        </section>

                        <section className="space-y-2">
                            <h2 className="text-base font-bold text-slate-900">4. Không chia sẻ với bên thứ ba</h2>
                            <p>
                                Chúng tôi cam kết không bán, trao đổi hoặc chuyển giao thông tin cá nhân của bạn cho bất kỳ bên thứ ba thương mại nào ngoài mục đích vận hành kỹ thuật của nhà trường.
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            <LoginFooter links={footerLinks} />
        </div>
    );
}
