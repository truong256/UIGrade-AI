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

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col bg-sky-50/40 text-slate-900">
            <LoginTopBar data={topBarData} />

            <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
                <div className="w-full max-w-md space-y-5">
                    <LoginHero data={loginHeroData} />
                    <LoginFormCard data={loginFormData} />
                </div>
            </main>

            <LoginFooter links={footerLinks} />
        </div>
    );
}