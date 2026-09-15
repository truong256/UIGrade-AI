import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getNavItemsForRole, adminNavItems, lecturerNavItems, studentNavItems } from "@/lib/navigation";

describe("Layout & Navigation Regression Tests", () => {
    describe("Navigation items uniqueness & role awareness", () => {
        const roles = ["admin", "lecturer", "teacher", "student", "User", null, undefined];

        it.each(roles)("should not have duplicate hrefs or labels for role: %s", (role) => {
            const items = getNavItemsForRole(role as never);
            expect(items.length).toBeGreaterThan(0);

            const hrefs = items.map((i) => i.href);
            const labels = items.map((i) => i.label);

            const uniqueHrefs = new Set(hrefs);
            const uniqueLabels = new Set(labels);

            expect(uniqueHrefs.size).toBe(hrefs.length);
            expect(uniqueLabels.size).toBe(labels.length);
        });

        it("should contain exactly one account link in all nav lists", () => {
            for (const list of [adminNavItems, lecturerNavItems, studentNavItems]) {
                const accountItems = list.filter((i) => i.href === "/ui/account" || i.label === "Tài khoản");
                expect(accountItems.length).toBe(1);
            }
        });

        it("should expose the guarded admin configuration entry only to admins", () => {
            const adminItems = getNavItemsForRole("admin");
            const hrefs = adminItems.map((i) => i.href);
            expect(hrefs).toContain("/ui/server_config");
            expect(hrefs).not.toContain("/ui/server_config/users");
            expect(hrefs).toContain("/ui/account");
        });

        it("should NOT expose admin config to lecturer or student roles", () => {
            const lecturerHrefs = getNavItemsForRole("lecturer").map((i) => i.href);
            const studentHrefs = getNavItemsForRole("student").map((i) => i.href);

            expect(lecturerHrefs).not.toContain("/ui/server_config");
            expect(lecturerHrefs).not.toContain("/ui/server_config/users");

            expect(studentHrefs).not.toContain("/ui/server_config");
            expect(studentHrefs).not.toContain("/ui/server_config/users");
        });

        it("does not grant lecturer navigation to an unnormalized legacy role", () => {
            expect(getNavItemsForRole("teacher" as never)).toEqual(studentNavItems);
        });
    });

    describe("Footer duplicate link prevention algorithm", () => {
        it("should strictly deduplicate links if any duplicates are passed", () => {
            const sampleItems = [
                { label: "Tổng quan", href: "/ui/dashboard", icon: "dashboard" },
                { label: "Lớp học", href: "/ui/my_classes", icon: "groups" },
                { label: "Bài tập", href: "/ui/assignment_list", icon: "assignment" },
                { label: "Tài khoản", href: "/ui/account", icon: "person" },
                { label: "Tài khoản", href: "/ui/account", icon: "person" }, // duplicate
            ];

            const seenHrefs = new Set<string>();
            const seenLabels = new Set<string>();
            const result = [];

            for (const item of sampleItems) {
                if (!seenHrefs.has(item.href) && !seenLabels.has(item.label)) {
                    seenHrefs.add(item.href);
                    seenLabels.add(item.label);
                    result.push(item);
                }
            }

            expect(result.length).toBe(4);
            expect(result.filter((r) => r.href === "/ui/account").length).toBe(1);
            expect(result.filter((r) => r.label === "Tài khoản").length).toBe(1);
        });
    });

    describe("Select-role page icons regression", () => {
        it("uses valid Material Symbols icons and does not use unsupported glyphs like person_chalkboard", () => {
            const pageContent = readFileSync(resolve(process.cwd(), "app/auth/select-role/page.tsx"), "utf8");
            expect(pageContent).not.toContain("person_chalkboard");
            expect(pageContent).toContain("co_present");
            expect(pageContent).toContain("school");
            expect(pageContent).toContain("manage_accounts");
            expect(pageContent).toContain("check_circle");
            expect(pageContent).toContain("progress_activity");
        });
    });
});
