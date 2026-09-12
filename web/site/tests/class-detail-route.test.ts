import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { AuthorizationError } from "@/lib/authorization";

const mocks = vi.hoisted(() => ({
    requireActor: vi.fn(),
    detail: vi.fn(),
}));

vi.mock("@/lib/current-user", () => ({
    requireActiveRequestActor: mocks.requireActor,
}));

vi.mock("@/services/supabase/web-mvp.supabase", () => ({
    SupabaseWebClassService: {
        detail: mocks.detail,
        update: vi.fn(),
        remove: vi.fn(),
    },
}));

import { GET } from "@/app/api/classes/[id]/route";

const request = new NextRequest("http://localhost/api/classes/11111111-1111-4111-8111-111111111111");
const context = { params: Promise.resolve({ id: "11111111-1111-4111-8111-111111111111" }) };

describe("class detail route authentication", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.detail.mockResolvedValue({
            id: "11111111-1111-4111-8111-111111111111",
            name: "Class A",
        });
    });

    it("denies an anonymous request before reading class data", async () => {
        mocks.requireActor.mockRejectedValue(new AuthorizationError("Bạn chưa đăng nhập", 401));
        const response = await GET(request, context);
        expect(response.status).toBe(401);
        expect(mocks.detail).not.toHaveBeenCalled();
    });

    it("denies pending, inactive, and banned profiles", async () => {
        mocks.requireActor.mockRejectedValue(new AuthorizationError("Tài khoản bị khóa", 403));
        const response = await GET(request, context);
        expect(response.status).toBe(403);
        expect(mocks.detail).not.toHaveBeenCalled();
    });

    it("passes the server-verified actor to the Supabase service", async () => {
        const actor = {
            userId: "22222222-2222-4222-8222-222222222222",
            email: "student@school.edu.vn",
            role: "student" as const,
        };
        mocks.requireActor.mockResolvedValue(actor);
        const response = await GET(request, context);
        expect(response.status).toBe(200);
        expect(mocks.detail).toHaveBeenCalledWith(
            actor,
            "11111111-1111-4111-8111-111111111111"
        );
    });
});
