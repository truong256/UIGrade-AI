import Link from "next/link";

type FooterLink = {
    label: string;
    href: string;
};

type Props = {
    links?: FooterLink[];
};

const defaultLinks: FooterLink[] = [
    { label: "Trợ giúp", href: "/help" },
    { label: "Điều khoản", href: "/terms" },
    { label: "Bảo mật", href: "/privacy" },
    { label: "Liên hệ", href: "/contact" },
];

export function LoginFooter({ links = defaultLinks }: Props) {
    return (
        <footer className="border-t border-sky-100 py-6 text-center text-xs text-slate-500">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 sm:flex-row">
                <p className="text-slate-500">
                    © 2026 <span className="font-semibold text-slate-700">UIGrade AI</span>. All rights reserved.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-6">
                    {links.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="font-medium text-slate-500 transition-colors hover:text-sky-600"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </footer>
    );
}

export default LoginFooter;