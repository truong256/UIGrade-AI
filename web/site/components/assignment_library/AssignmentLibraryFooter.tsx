import Link from "next/link";

export function AssignmentLibraryFooter() {
    return (
        <footer className="mt-auto border-t border-sky-100 bg-white px-6 py-6">
            <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-3 md:flex-row">
                <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-sky-600 p-1 text-white shadow-xs">
                        <span className="material-symbols-outlined text-sm">school</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 tracking-tight">UIGrade AI</span>
                </div>

                <p className="text-[11px] text-slate-400">
                    © 2026 UIGrade AI. Nền tảng chấm điểm UI Android tự động.
                </p>

                <div className="flex gap-4">
                    <Link href="/ui/settings" className="text-[11px] text-slate-500 transition hover:text-sky-600">
                        Cài đặt
                    </Link>
                    <Link href="/ui/help" className="text-[11px] text-slate-500 transition hover:text-sky-600">
                        Trợ giúp
                    </Link>
                </div>
            </div>
        </footer>
    );
}