import { LoginTopBar } from "@/components/auth/LoginTopBar";
import { RegisterFormCard } from "@/components/auth/RegisterFormCard";
import { LoginFooter } from "@/components/auth/LoginFooter";
import { registerFormData } from "@/lib/register-data";
import { topBarData, footerLinks } from "@/lib/login-data";

export default function RegisterPage() {
    return (
        <div className="flex min-h-screen flex-col bg-blue-50/40 text-slate-900">
            <LoginTopBar data={topBarData} />

            <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
                <RegisterFormCard data={registerFormData} />
            </main>

            <LoginFooter links={footerLinks} />
        </div>
    );
}