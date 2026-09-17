// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/classes/users/search/route";

describe("direct student search is deferred", () => {
    it("returns 410 without opening a Mongo-backed identity search", async () => {
        const response = await GET();
        expect(response.status).toBe(410);
        expect(await response.json()).toMatchObject({
            success: false,
            message: expect.stringContaining("mã lớp"),
        });
    });
});
