/**
 * app/ui/server_config/layout.tsx
 *
 * Server-side guard for all /ui/server_config/* pages.
 *
 * SECURITY:
 *  - Verifies admin role at the server component level (defense in depth).
 *  - This runs independently of middleware — even if middleware fails,
 *    this guard will redirect non-admin users.
 *  - Role check uses getCurrentUserFromCookie() which reads from verified JWT
 *    or Supabase session — never from client-controllable sources.
 */

import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { SettingsSidebar } from "@/components/settings/SettingsSidebar";
import { sidebarGroups, versionInfo } from "@/lib/server-config-data";
import { getCurrentUserFromCookie } from "@/lib/current-user";
import { ROLES } from "@/lib/authorization";

export default async function ServerConfigSectionLayout({
    children,
}: {
    children: ReactNode;
}) {
    // Server-side authorization check — cannot be bypassed by URL manipulation
    const currentUser = await getCurrentUserFromCookie();

    if (!currentUser?.userId) {
        redirect("/login");
    }

    if (currentUser.role !== ROLES.ADMIN) {
        // Lecturer/Student trying to access Admin config — redirect with error
        redirect("/ui/dashboard?error=forbidden");
    }

    return (
        <div className="flex flex-col lg:flex-row gap-6">
            <SettingsSidebar
                groups={sidebarGroups}
                versionInfo={versionInfo}
            />
            <div className="min-w-0 flex-1">{children}</div>
        </div>
    );
}