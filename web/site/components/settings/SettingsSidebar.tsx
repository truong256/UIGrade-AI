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
        <aside className="w-64 shrink-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs h-fit self-start">
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
                                    ? "bg-blue-50 text-blue-600 font-semibold shadow-xs"
                                    : "text-slate-600 hover:bg-slate-50 hover:text-[#172033]"
                            }`;

                            if (item.href && item.href !== "#") {
                                return (
                                    <Link key={item.label} href={item.href} className={className}>
                                        <span className={`material-symbols-outlined text-[20px] ${active ? "text-blue-600" : "text-slate-400"}`}>
                                            {item.icon}
                                        </span>
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            }

                            return (
                                <span key={item.label} className={className}>
                                    <span className="material-symbols-outlined text-[20px] text-slate-400">
                                        {item.icon}
                                    </span>
                                    <span>{item.label}</span>
                                </span>
                            );
                        })}
                    </nav>
                </div>
            ))}

            <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                <p className="mb-0.5 text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-blue-600 text-[16px]">verified</span>
                    UIGrade AI v{versionInfo.version}
                </p>
                <p className="text-[10px] text-slate-500">Cập nhật: {versionInfo.updatedAt}</p>
            </div>
        </aside>
    );
}
