"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SettingsSidebarGroup } from "@/lib/server-config-data";

type VersionInfo = {
    version: string;
    updatedAt: string;
};

type Props = {
    groups: SettingsSidebarGroup[];
    versionInfo: VersionInfo;
};

function isItemActive(pathname: string, href?: string, matchMode: "exact" | "prefix" = "exact") {
    if (!href || href === "#") return false;
    if (matchMode === "prefix") {
        return pathname === href || pathname.startsWith(`${href}/`);
    }
    return pathname === href;
}

export function SettingsSidebar({ groups, versionInfo }: Props) {
    const pathname = usePathname();

    return (
        <aside className="rounded-3xl border border-sky-100 bg-white p-5 shadow-sm h-fit self-start">
            {groups.map((group) => (
                <div key={group.title} className="mb-4 last:mb-0">
                    <h3 className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {group.title}
                    </h3>

                    <nav className="flex flex-col gap-1">
                        {group.items.map((item) => {
                            const active = isItemActive(pathname, item.href, item.matchMode);
                            const className = `flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all text-xs font-semibold ${
                                active
                                    ? "bg-sky-600 text-white shadow-md shadow-sky-600/20"
                                    : "text-slate-600 hover:bg-sky-50 hover:text-sky-700"
                            }`;

                            if (item.href && item.href !== "#") {
                                return (
                                    <Link key={item.label} href={item.href} className={className}>
                                        <span className="material-symbols-outlined text-[20px]">
                                            {item.icon}
                                        </span>
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            }

                            return (
                                <span key={item.label} className={className}>
                                    <span className="material-symbols-outlined text-[20px]">
                                        {item.icon}
                                    </span>
                                    <span>{item.label}</span>
                                </span>
                            );
                        })}
                    </nav>
                </div>
            ))}

            <div className="mt-6 rounded-2xl border border-sky-100 bg-sky-50/50 p-3.5">
                <p className="mb-1 text-xs font-bold text-sky-800 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sky-600 text-[16px]">verified</span>
                    UIGrade AI v{versionInfo.version}
                </p>
                <p className="text-[10px] text-slate-500">Cập nhật: {versionInfo.updatedAt}</p>
            </div>
        </aside>
    );
}
