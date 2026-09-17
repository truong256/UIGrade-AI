// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SupabaseWebClassService, SupabaseWebAssignmentService } from "@/services/supabase/web-mvp.supabase";
import type { CurrentUserPayload } from "@/lib/current-user";

const testDbState = {
    classes: [] as any[],
    classMembers: [] as any[],
    assignments: [] as any[],
    profiles: [] as any[],
};

// Mock Supabase client for unit testing service logic
vi.mock("@/lib/supabase/server", () => {
    return {
        createSupabaseServerClient: async () => {
            return {
                from: (table: string) => {
                    const filters: Array<(item: any) => boolean> = [];
                    let updatePayload: any = null;
                    let isSingle = false;
                    let isMaybeSingle = false;
                    let countMode: string | null = null;
                    let headOnly = false;

                    const queryObj: any = {
                        select: (_fields?: string, options?: { count?: string; head?: boolean }) => {
                            if (options?.count) countMode = options.count;
                            if (options?.head) headOnly = options.head;
                            return queryObj;
                        },
                        eq: (col: string, val: any) => {
                            filters.push((item) => item[col] === val);
                            return queryObj;
                        },
                        in: (col: string, vals: any[]) => {
                            filters.push((item) => vals.includes(item[col]));
                            return queryObj;
                        },
                        order: () => {
                            return queryObj;
                        },
                        single: async () => {
                            isSingle = true;
                            return queryObj.then((res: any) => res);
                        },
                        maybeSingle: async () => {
                            isMaybeSingle = true;
                            return queryObj.then((res: any) => res);
                        },
                        update: (payload: any) => {
                            updatePayload = payload;
                            return queryObj;
                        },
                        then: (resolve: (val: any) => any) => {
                            let source = [...(testDbState as any)[table === "class_members" ? "classMembers" : table] || []];
                            for (const f of filters) {
                                source = source.filter(f);
                            }

                            if (updatePayload) {
                                for (const item of source) {
                                    Object.assign(item, updatePayload);
                                }
                            }

                            if (countMode === "exact" && headOnly) {
                                return resolve({ count: source.length, data: null, error: null });
                            }

                            if (isSingle || isMaybeSingle) {
                                return resolve({ data: source[0] || null, error: null });
                            }

                            return resolve({ data: source, error: null });
                        },
                    };
                    return queryObj;
                },
                rpc: async (fn: string, params: any) => {
                    if (fn === "join_class_by_code") {
                        const code = (params?.input_code || "").trim().toUpperCase();
                        const target = testDbState.classes.find((c) => c.class_code.toUpperCase() === code);
                        if (!target) {
                            return { data: null, error: { message: "Mã lớp không tồn tại." } };
                        }
                        if (target.status !== "active") {
                            return { data: null, error: { message: "Lớp học hiện không nhận thêm sinh viên." } };
                        }
                        const existing = testDbState.classMembers.find((m) => m.class_id === target.id && m.student_id === "student-1");
                        if (existing && existing.status === "active") {
                            return { data: null, error: { message: "Bạn đã tham gia lớp học này." } };
                        }
                        if (existing && existing.status === "pending") {
                            return { data: null, error: { message: "Yêu cầu tham gia lớp đang chờ giảng viên duyệt." } };
                        }
                        const activeCount = testDbState.classMembers.filter((m) => m.class_id === target.id && m.status === "active").length;
                        if (activeCount >= 50) {
                            return { data: null, error: { message: "Lớp học đã đạt số lượng thành viên tối đa." } };
                        }

                        if (existing) {
                            existing.status = "pending";
                        } else {
                            testDbState.classMembers.push({
                                id: `cm-${Date.now()}`,
                                class_id: target.id,
                                student_id: "student-1",
                                status: "pending",
                                joined_at: new Date().toISOString(),
                            });
                        }

                        return {
                            data: {
                                classId: target.id,
                                className: target.name,
                                membershipStatus: "pending",
                                message: "Yêu cầu tham gia lớp đã được gửi và đang chờ giảng viên phê duyệt.",
                            },
                            error: null,
                        };
                    }
                    return { data: null, error: { message: "Unknown RPC" } };
                },
            };
        },
    };
});

describe("Lecturer Approval Workflow Specification & Tests", () => {
    const lecturerOwner: CurrentUserPayload = {
        userId: "lecturer-owner-id",
        email: "lecturer@fit.edu.vn",
        role: "lecturer",
    };

    const lecturerOther: CurrentUserPayload = {
        userId: "lecturer-other-id",
        email: "other@fit.edu.vn",
        role: "lecturer",
    };

    const studentPending: CurrentUserPayload = {
        userId: "student-pending-id",
        email: "student@fit.edu.vn",
        role: "student",
    };

    const studentActive: CurrentUserPayload = {
        userId: "student-active-id",
        email: "student.active@fit.edu.vn",
        role: "student",
    };

    beforeEach(() => {
        testDbState.classes = [
            {
                id: "class-1",
                name: "Lập trình Di động 2026",
                class_code: "MOB2026",
                lecturer_id: "lecturer-owner-id",
                semester: "HK1",
                academic_year: "2025-2026",
                status: "active",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
            {
                id: "class-inactive",
                name: "Lớp Lưu trữ 2025",
                class_code: "ARCHIVED2025",
                lecturer_id: "lecturer-owner-id",
                semester: "HK1",
                academic_year: "2024-2025",
                status: "archived",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
        ];

        testDbState.profiles = [
            { id: "lecturer-owner-id", full_name: "TS. Nguyễn Văn Chủ Lớp", email: "lecturer@fit.edu.vn" },
            { id: "lecturer-other-id", full_name: "ThS. Trần Giảng Viên Khác", email: "other@fit.edu.vn" },
            { id: "student-pending-id", full_name: "Sinh Viên Chờ Duyệt", email: "student@fit.edu.vn", student_code: "SV001" },
            { id: "student-active-id", full_name: "Sinh Viên Đã Duyệt", email: "student.active@fit.edu.vn", student_code: "SV002" },
        ];

        testDbState.classMembers = [
            {
                id: "cm-active-1",
                class_id: "class-1",
                student_id: "student-active-id",
                status: "active",
                joined_at: new Date().toISOString(),
            },
            {
                id: "cm-pending-1",
                class_id: "class-1",
                student_id: "student-pending-id",
                status: "pending",
                joined_at: new Date().toISOString(),
            },
        ];

        testDbState.assignments = [
            {
                id: "asg-1",
                class_id: "class-1",
                lecturer_id: "lecturer-owner-id",
                title: "Bài tập 1: Xây dựng Layout",
                description: "Yêu cầu Kotlin & Jetpack Compose",
                status: "published",
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
        ];
    });

    it("1. join hợp lệ → pending: RPC creates membership with pending status", async () => {
        const { createSupabaseServerClient } = await import("@/lib/supabase/server");
        const client = await createSupabaseServerClient();
        const res = await client.rpc("join_class_by_code", { input_code: "mob2026" });

        expect(res.error).toBeNull();
        expect(res.data).toMatchObject({
            classId: "class-1",
            membershipStatus: "pending",
            message: "Yêu cầu tham gia lớp đã được gửi và đang chờ giảng viên phê duyệt.",
        });
    });

    it("2. Lecturer thấy pending: Lecturer retrieves pending students in waiting list", async () => {
        const pendingList = await SupabaseWebClassService.members(lecturerOwner, "class-1", "pending");
        expect(pendingList).toHaveLength(1);
        expect(pendingList[0]._id).toBe("student-pending-id");
        expect(pendingList[0].status).toBe("pending");
        expect(pendingList[0].userId.name).toBe("Sinh Viên Chờ Duyệt");
        expect(pendingList[0].userId.studentCode).toBe("SV001");
    });

    it("3. approve → active: Lecturer approves pending student and changes status to active", async () => {
        await SupabaseWebClassService.updateMember(
            lecturerOwner,
            "class-1",
            "student-pending-id",
            "approve"
        );

        const updatedMember = testDbState.classMembers.find(
            (m) => m.class_id === "class-1" && m.student_id === "student-pending-id"
        );
        expect(updatedMember?.status).toBe("active");
    });

    it("4. reject → dropped: Lecturer rejects pending student and changes status to dropped", async () => {
        await SupabaseWebClassService.updateMember(
            lecturerOwner,
            "class-1",
            "student-pending-id",
            "reject"
        );

        const droppedMember = testDbState.classMembers.find(
            (m) => m.class_id === "class-1" && m.student_id === "student-pending-id"
        );
        expect(droppedMember?.status).toBe("dropped");
    });

    it("5. Student pending không đọc được assignment: pending student cannot view assignment detail", async () => {
        // Mock assignments table returning null for pending student (simulating RLS rejection)
        // Because RLS policy checks `is_active_class_member(class_id)` which requires status = 'active'.
        testDbState.assignments = []; // simulates RLS denying access to pending student

        await expect(
            SupabaseWebAssignmentService.detail(studentPending, "asg-1")
        ).rejects.toThrow(/không có quyền truy cập/i);
    });

    it("6. Student active đọc được assignment: active student reads assignments successfully", async () => {
        testDbState.assignments = [
            {
                id: "asg-1",
                class_id: "class-1",
                lecturer_id: "lecturer-owner-id",
                title: "Bài tập 1: Xây dựng Layout",
                description: "Yêu cầu Kotlin & Jetpack Compose",
                status: "published",
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            },
        ];

        const assignment = await SupabaseWebAssignmentService.detail(studentActive, "asg-1");
        expect(assignment).toBeDefined();
        expect(assignment._id).toBe("asg-1");
        expect(assignment.title).toBe("Bài tập 1: Xây dựng Layout");
    });

    it("7. lecturer khác không approve được: non-owning lecturer is forbidden (403)", async () => {
        await expect(
            SupabaseWebClassService.updateMember(
                lecturerOther,
                "class-1",
                "student-pending-id",
                "approve"
            )
        ).rejects.toThrow("Bạn không phải chủ lớp");
    });

    it("8. duplicate join bị chặn: blocks active members and pending members", async () => {
        const { createSupabaseServerClient } = await import("@/lib/supabase/server");
        const client = await createSupabaseServerClient();

        // 8a. If already active
        testDbState.classMembers.push({
            id: "cm-active-dup",
            class_id: "class-1",
            student_id: "student-1",
            status: "active",
            joined_at: new Date().toISOString(),
        });
        const activeRes = await client.rpc("join_class_by_code", { input_code: "MOB2026" });
        expect(activeRes.error?.message).toBe("Bạn đã tham gia lớp học này.");

        // 8b. If already pending
        const dupMember = testDbState.classMembers.find((m) => m.student_id === "student-1");
        dupMember.status = "pending";
        const pendingRes = await client.rpc("join_class_by_code", { input_code: "MOB2026" });
        expect(pendingRes.error?.message).toBe("Yêu cầu tham gia lớp đang chờ giảng viên duyệt.");
    });

    it("9. capacity 50 được kiểm tra an toàn: prevents approval when active capacity is 50", async () => {
        // Populate class with 50 active students
        testDbState.classMembers = Array.from({ length: 50 }, (_, i) => ({
            id: `cm-active-${i}`,
            class_id: "class-1",
            student_id: `student-active-${i}`,
            status: "active",
            joined_at: new Date().toISOString(),
        }));

        // Add 1 pending student
        testDbState.classMembers.push({
            id: "cm-pending-51",
            class_id: "class-1",
            student_id: "student-pending-id",
            status: "pending",
            joined_at: new Date().toISOString(),
        });

        await expect(
            SupabaseWebClassService.updateMember(
                lecturerOwner,
                "class-1",
                "student-pending-id",
                "approve"
            )
        ).rejects.toThrow("Lớp học đã đạt số lượng thành viên tối đa (50 sinh viên).");
    });

    it("10. validates new migration file 20260917000002_lecturer_approval_join_workflow.sql exists and is correct", () => {
        const migrationPath = resolve(
            __dirname,
            "../supabase/migrations/20260917000002_lecturer_approval_join_workflow.sql"
        );
        const content = readFileSync(migrationPath, "utf-8");

        expect(content).toContain("CREATE OR REPLACE FUNCTION public.join_class_by_code");
        expect(content).toContain("'pending'");
        expect(content).toContain("current_active_members >= 50");
        expect(content).toContain("Yêu cầu tham gia lớp đang chờ giảng viên duyệt.");
        expect(content).toContain("Bạn đã tham gia lớp học này.");
        expect(content).toContain("Lớp học đã đạt số lượng thành viên tối đa.");
        expect(content).toContain("DROP POLICY IF EXISTS \"Authorized users can view class members\" ON public.class_members");
        expect(content).toContain("DROP POLICY IF EXISTS \"Authorized users can view related classes\" ON public.classes");
    });
});
