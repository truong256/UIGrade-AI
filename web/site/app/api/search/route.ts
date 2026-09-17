// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { NextRequest } from "next/server";
import { successResponse } from "@/lib/api-response";
import { requireActiveRequestActor } from "@/lib/current-user";
import { webMvpErrorResponse } from "@/lib/web-mvp-route";
import {
    SupabaseWebClassService,
    SupabaseWebAssignmentService,
} from "@/services/supabase/web-mvp.supabase";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SearchEntityResult = {
    id: string;
    type: "class" | "assignment" | "student";
    title: string;
    subtitle: string;
    href: string;
    icon: string;
};

export async function GET(req: NextRequest) {
    try {
        const actor = await requireActiveRequestActor(req);
        const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();

        if (!q) {
            return successResponse(
                { results: [], total: 0 },
                "Vui lòng nhập từ khóa tìm kiếm"
            );
        }

        const [classes, assignments] = await Promise.all([
            SupabaseWebClassService.list(actor).catch(() => []),
            SupabaseWebAssignmentService.list(actor).catch(() => []),
        ]);

        const results: SearchEntityResult[] = [];

        // 1. Search classes
        for (const cls of classes as any[]) {
            const name = (cls.name || "").toLowerCase();
            const code = (cls.code || "").toLowerCase();
            const desc = (cls.description || "").toLowerCase();

            if (name.includes(q) || code.includes(q) || desc.includes(q)) {
                results.push({
                    id: cls.id || cls._id,
                    type: "class",
                    title: cls.name,
                    subtitle: `${cls.code} • ${cls.semester || ""} ${cls.academicYear || ""}`.trim(),
                    href: `/ui/classes/${cls.id || cls._id}`,
                    icon: "school",
                });
            }
        }

        // 2. Search assignments
        for (const asg of assignments as any[]) {
            const title = (asg.title || "").toLowerCase();
            const desc = (asg.description || "").toLowerCase();

            if (title.includes(q) || desc.includes(q)) {
                results.push({
                    id: asg.id || asg._id,
                    type: "assignment",
                    title: asg.title,
                    subtitle: asg.classroom?.name || "Bài tập",
                    href: `/ui/assignment_list`,
                    icon: "assignment",
                });
            }
        }

        // 3. Search students in lecturer's classes
        if (actor.role === "lecturer" && classes.length > 0) {
            try {
                const db = await createSupabaseServerClient();
                const classIds = classes.map((c: any) => c.id || c._id).filter(Boolean);
                
                if (classIds.length > 0) {
                    const { data: members } = await db
                        .from("class_members")
                        .select("student_id, class_id, profiles:student_id(id, full_name, email, student_code)")
                        .in("class_id", classIds)
                        .eq("status", "active")
                        .limit(50);

                    if (members) {
                        const seenStudents = new Set<string>();
                        for (const m of members as any[]) {
                            const p = m.profiles;
                            if (!p || seenStudents.has(p.id)) continue;

                            const fullName = (p.full_name || "").toLowerCase();
                            const email = (p.email || "").toLowerCase();
                            const studentCode = (p.student_code || "").toLowerCase();

                            if (fullName.includes(q) || email.includes(q) || studentCode.includes(q)) {
                                seenStudents.add(p.id);
                                results.push({
                                    id: p.id,
                                    type: "student",
                                    title: p.full_name || "Sinh viên",
                                    subtitle: `${p.student_code || p.email || ""}`.trim(),
                                    href: `/ui/classes/${m.class_id}`,
                                    icon: "person",
                                });
                            }
                        }
                    }
                }
            } catch {
                // If member query fails, still return classes and assignments
            }
        }

        return successResponse(
            { results, total: results.length },
            "Tìm kiếm thành công"
        );
    } catch (error) {
        return webMvpErrorResponse(error);
    }
}
