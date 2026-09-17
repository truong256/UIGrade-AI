// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
    requireActiveRequestActor: vi.fn(),
    listClasses: vi.fn(),
    listAssignments: vi.fn(),
    createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/lib/current-user", () => ({
    requireActiveRequestActor: mocks.requireActiveRequestActor,
}));

vi.mock("@/services/supabase/web-mvp.supabase", () => ({
    SupabaseWebClassService: {
        list: mocks.listClasses,
    },
    SupabaseWebAssignmentService: {
        list: mocks.listAssignments,
    },
}));

vi.mock("@/lib/supabase/server", () => ({
    createSupabaseServerClient: mocks.createSupabaseServerClient,
}));

import { GET } from "@/app/api/search/route";

describe("Domain Search API (/api/search)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns empty results when query is blank", async () => {
        mocks.requireActiveRequestActor.mockResolvedValue({
            userId: "user-1",
            role: "lecturer",
            email: "lecturer@example.com",
        });

        const req = new NextRequest("http://localhost:3000/api/search?q=");
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.data.results).toEqual([]);
        expect(mocks.listClasses).not.toHaveBeenCalled();
    });

    it("searches and returns only domain entities (classes, assignments), never navigation items", async () => {
        mocks.requireActiveRequestActor.mockResolvedValue({
            userId: "user-1",
            role: "lecturer",
            email: "lecturer@example.com",
        });

        mocks.listClasses.mockResolvedValue([
            { id: "class-1", name: "Lập trình Android Nâng cao", code: "AND-01", description: "Học Jetpack Compose" },
            { id: "class-2", name: "Cơ sở dữ liệu", code: "CSDL-01", description: "SQL và NoSQL" },
        ]);

        mocks.listAssignments.mockResolvedValue([
            { id: "asg-1", title: "Bài tập 1 - Android Layouts", description: "Tạo màn hình đăng nhập", classroom: { name: "Lập trình Android Nâng cao" } },
            { id: "asg-2", title: "Bài tập 2 - Retrofit Network", description: "Gọi API", classroom: { name: "Lập trình Android Nâng cao" } },
        ]);

        mocks.createSupabaseServerClient.mockResolvedValue({
            from: () => ({
                select: () => ({
                    in: () => ({
                        eq: () => ({
                            limit: () => Promise.resolve({ data: [] }),
                        }),
                    }),
                }),
            }),
        });

        const req = new NextRequest("http://localhost:3000/api/search?q=Android");
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.data.results).toHaveLength(2);

        // Verify class match
        expect(body.data.results[0]).toMatchObject({
            id: "class-1",
            type: "class",
            title: "Lập trình Android Nâng cao",
        });

        // Verify assignment match
        expect(body.data.results[1]).toMatchObject({
            id: "asg-1",
            type: "assignment",
            title: "Bài tập 1 - Android Layouts",
        });

        // Verify NO navigation items exist in results
        const titles = body.data.results.map((r: any) => r.title);
        expect(titles).not.toContain("Dashboard");
        expect(titles).not.toContain("Bảng điều khiển");
        expect(titles).not.toContain("Cài đặt");
        expect(titles).not.toContain("Đăng xuất");
    });
});
