import Link from "next/link";

export function RegisterMobileNav() {
    return (
        <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around border-t border-[#e2bfb0]/20 bg-white px-4 pb-6 pt-3 shadow-[0_-8px_32px_rgba(26,28,28,0.06)] md:hidden">
            <Link
                href="/login"
                className="flex flex-col items-center justify-center px-6 py-2 text-[#4c56af] transition-all duration-200"
            >
                <span className="material-symbols-outlined">login</span>
                <span className="mt-1 text-[10px] font-medium uppercase tracking-widest">
                    Login
                </span>
            </Link>

            <Link
                href="/register"
                className="flex flex-col items-center justify-center rounded-xl bg-[#ff6b00]/10 px-6 py-2 text-[#a04100] transition-all duration-200"
            >
                <span className="material-symbols-outlined">person_add</span>
                <span className="mt-1 text-[10px] font-medium uppercase tracking-widest">
                    Sign Up
                </span>
            </Link>
        </nav>
    );
}