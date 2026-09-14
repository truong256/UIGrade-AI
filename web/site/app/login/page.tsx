import { LoginTopBar } from "@/components/auth/LoginTopBar";
import { LoginFormCard } from "@/components/auth/LoginFormCard";
import { LoginFooter } from "@/components/auth/LoginFooter";

import {
    footerLinks,
    loginFormData,
    topBarData,
} from "@/lib/login-data";

type PageProps = {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
    const params = searchParams ? await searchParams : {};
    const errorCode = typeof params.error === "string" ? params.error : undefined;
    const errorMessage = typeof params.message === "string" ? params.message : undefined;

    return (
        <div className="auth-page flex min-h-[100dvh] flex-col text-slate-900">
            <LoginTopBar data={topBarData} />

            <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-8 sm:px-6 sm:py-10">
                <LoginFormCard
                    data={loginFormData}
                    initialErrorCode={errorCode}
                    initialErrorMessage={errorMessage}
                />
            </main>

            <LoginFooter links={footerLinks} />
        </div>
    );
}
