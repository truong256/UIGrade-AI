import { LoginTopBar } from "@/components/auth/LoginTopBar";
import { LoginHero } from "@/components/auth/LoginHero";
import { LoginFormCard } from "@/components/auth/LoginFormCard";
import { LoginFooter } from "@/components/auth/LoginFooter";

import {
    footerLinks,
    loginFormData,
    loginHeroData,
    topBarData,
} from "@/lib/login-data";

const LOGIN_ERRORS: Record<string, string> = {
    account_inactive: "Tài khoản hiện không hoạt động.",
    education_email_required: "Tài khoản mới phải sử dụng email giáo dục có tên miền .edu.vn.",
    oauth_failed: "Không thể đăng nhập bằng Google. Vui lòng thử lại.",
    profile_creation_failed: "Không thể hoàn tất hồ sơ tài khoản. Vui lòng thử lại.",
    profile_unavailable: "Tạm thời không thể tải hồ sơ tài khoản. Vui lòng thử lại sau.",
    recovery_failed: "Liên kết khôi phục không hợp lệ hoặc đã hết hạn.",
};

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string }>;
}) {
    const { error } = await searchParams;
    const initialError = error ? LOGIN_ERRORS[error] ?? "Đăng nhập không thành công. Vui lòng thử lại." : "";

    return (
        <div className="flex min-h-screen flex-col bg-blue-50/40 text-slate-900">
            <LoginTopBar data={topBarData} />

            <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
                <div className="w-full max-w-md space-y-5">
                    <LoginHero data={loginHeroData} />
                    <LoginFormCard data={loginFormData} initialError={initialError} />
                </div>
            </main>

            <LoginFooter links={footerLinks} />
        </div>
    );
}
