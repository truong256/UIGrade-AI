import { ReactNode } from "react";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { sidebarGroups, versionInfo } from "@/lib/server-config-data";

export default function ServerConfigSectionLayout({
                                                      children,
                                                  }: {
    children: ReactNode;
}) {
    return (
        <div className="flex min-h-screen gap-6">
            <SettingsSidebar
                groups={sidebarGroups}
                versionInfo={versionInfo}
            />
            <main className="min-w-0 flex-1">{children}</main>
        </div>
    );
}