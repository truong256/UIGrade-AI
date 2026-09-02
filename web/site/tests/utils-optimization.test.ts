import { describe, it, expect, vi, beforeEach } from "vitest";
import {
    formatDateVi,
    formatDateTimeVi,
    formatScoreVi,
    formatPercentVi,
    formatFileSizeVi,
} from "@/lib/formatters";
import { fetchCurrentUserClient, clearCurrentUserCache } from "@/lib/auth-client";

describe("Formatters Utility Tests", () => {
    describe("formatDateVi", () => {
        it("formats date correctly", () => {
            const date = new Date(2026, 8, 2); // 02/09/2026
            expect(formatDateVi(date)).toBe("02/09/2026");
        });

        it("handles null or undefined with fallback", () => {
            expect(formatDateVi(null)).toBe("--");
            expect(formatDateVi(undefined, "N/A")).toBe("N/A");
        });
    });

    describe("formatDateTimeVi", () => {
        it("formats datetime correctly", () => {
            const date = new Date(2026, 8, 2, 14, 30);
            expect(formatDateTimeVi(date)).toBe("14:30 02/09/2026");
        });
    });

    describe("formatScoreVi", () => {
        it("formats integer and decimal scores", () => {
            expect(formatScoreVi(10)).toBe("10");
            expect(formatScoreVi(8.5)).toBe("8.5");
            expect(formatScoreVi(8.556, "--", 2)).toBe("8.56");
            expect(formatScoreVi(null)).toBe("--");
        });
    });

    describe("formatPercentVi", () => {
        it("formats percentage", () => {
            expect(formatPercentVi(85.4)).toBe("85.4%");
            expect(formatPercentVi(100)).toBe("100%");
            expect(formatPercentVi(null)).toBe("0%");
        });
    });

    describe("formatFileSizeVi", () => {
        it("formats byte sizes to human-readable strings", () => {
            expect(formatFileSizeVi(500)).toBe("500 B");
            expect(formatFileSizeVi(1024 * 50)).toBe("50.0 KB");
            expect(formatFileSizeVi(1024 * 1024 * 5)).toBe("5.0 MB");
            expect(formatFileSizeVi(0)).toBe("0 KB");
        });
    });
});

describe("Auth Client Cache Tests", () => {
    beforeEach(() => {
        clearCurrentUserCache();
        vi.restoreAllMocks();
    });

    it("deduplicates concurrent fetchCurrentUserClient calls into 1 network request", async () => {
        const mockUser = { id: "u-1", name: "Nguyen Van A", role: "student" as const };
        const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
            ok: true,
            json: async () => ({ user: mockUser }),
        } as Response);

        const [res1, res2, res3] = await Promise.all([
            fetchCurrentUserClient(),
            fetchCurrentUserClient(),
            fetchCurrentUserClient(),
        ]);

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(res1).toEqual(mockUser);
        expect(res2).toEqual(mockUser);
        expect(res3).toEqual(mockUser);
    });

    it("clears cached user properly", async () => {
        const mockUser = { id: "u-1", name: "Nguyen Van A", role: "student" as const };
        const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
            ok: true,
            json: async () => ({ user: mockUser }),
        } as Response);

        await fetchCurrentUserClient();
        expect(fetchSpy).toHaveBeenCalledTimes(1);

        clearCurrentUserCache();

        await fetchCurrentUserClient();
        expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
});
