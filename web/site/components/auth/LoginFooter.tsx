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
        <footer className="relative z-10 py-5 text-center text-xs text-[#59677F]">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 sm:flex-row">
                <p>
                    © 2026 <span className="font-semibold text-slate-700">UIGrade AI</span>. All rights reserved.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-6">
                    {links.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="rounded-md font-medium transition-colors hover:text-blue-700"
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
