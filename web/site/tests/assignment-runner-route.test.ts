import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { AuthorizationError, type AuthenticatedActor } from "@/lib/authorization";
import { WebMvpError } from "@/services/supabase/web-mvp.supabase";

const mocks = vi.hoisted(() => ({ requireActor: vi.fn(), updateRunner: vi.fn() }));

vi.mock("@/lib/current-user", () => ({ requireActiveRequestActor: mocks.requireActor }));
vi.mock("@/services/supabase/web-mvp.supabase", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@/services/supabase/web-mvp.supabase")>();
    return { ...actual, SupabaseWebAssignmentService: { updateRunner: mocks.updateRunner } };
});

import { PUT } from "@/app/api/assignments/[id]/runner-config/route";

const assignmentId = "786b49e6-8929-46a7-81f2-0c26b8b30a3a";
const lecturer = (userId: string): AuthenticatedActor => ({ userId, email: `${userId}@example.com`, role: "lecturer" });

function invoke() {
    const request = new NextRequest(`http://localhost/api/assignments/${assignmentId}/runner-config`, {
        method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ runnerConfig: {} }),
    });
    return PUT(request, { params: Promise.resolve({ id: assignmentId }) });
}

describe("runner-config Supabase authorization", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.updateRunner.mockResolvedValue({ _id: assignmentId, runnerConfig: {} });
    });

    it("returns 401 for an anonymous request", async () => {
        mocks.requireActor.mockRejectedValue(new AuthorizationError("Bạn chưa đăng nhập", 401));
        expect((await invoke()).status).toBe(401);
    });

    it("returns 403 for pending, inactive, or banned accounts", async () => {
        mocks.requireActor.mockRejectedValue(new AuthorizationError("Tài khoản bị khóa", 403));
        expect((await invoke()).status).toBe(403);
    });

    it.each(["student", "admin"] as const)("returns 403 for %s", async (role) => {
        mocks.requireActor.mockResolvedValue({ userId: role, email: `${role}@example.com`, role });
        mocks.updateRunner.mockRejectedValue(new WebMvpError("Chỉ giảng viên", 403));
        expect((await invoke()).status).toBe(403);
    });

    it("returns 403 for another lecturer", async () => {
        mocks.requireActor.mockResolvedValue(lecturer("other"));
        mocks.updateRunner.mockRejectedValue(new WebMvpError("Bạn không phải chủ bài tập", 403));
        expect((await invoke()).status).toBe(403);
    });

    it("delegates the UUID and verified lecturer to Supabase", async () => {
        const actor = lecturer("owner");
        mocks.requireActor.mockResolvedValue(actor);
        expect((await invoke()).status).toBe(200);
        expect(mocks.updateRunner).toHaveBeenCalledWith(actor, assignmentId, expect.anything());
    });
});
