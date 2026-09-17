// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { LoginTopBar } from "@/components/auth/LoginTopBar";
import { RegisterFormCard } from "@/components/auth/RegisterFormCard";
import { LoginFooter } from "@/components/auth/LoginFooter";
import { registerFormData } from "@/lib/register-data";
import { topBarData, footerLinks } from "@/lib/login-data";

export default function RegisterPage() {
    return (
        <div className="auth-page flex min-h-[100dvh] flex-col text-slate-900">
            <LoginTopBar data={topBarData} />

            <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
                <RegisterFormCard data={registerFormData} />
            </main>

            <LoginFooter links={footerLinks} />
        </div>
    );
}
