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

type PageProps = {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
    const params = searchParams ? await searchParams : {};
    const errorCode = typeof params.error === "string" ? params.error : undefined;
    const errorMessage = typeof params.message === "string" ? params.message : undefined;

    return (
        <div className="flex min-h-screen flex-col bg-blue-50/40 text-slate-900">
            <LoginTopBar data={topBarData} />

            <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
                <div className="w-full max-w-md space-y-5">
                    <LoginHero data={loginHeroData} />
                    <LoginFormCard
                        data={loginFormData}
                        initialErrorCode={errorCode}
                        initialErrorMessage={errorMessage}
                    />
                </div>
            </main>

            <LoginFooter links={footerLinks} />
        </div>
    );
}
