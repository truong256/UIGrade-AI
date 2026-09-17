// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { describe, expect, it } from "vitest";
import { isEducationEmail, isValidEmail, normalizeEmail } from "@/lib/education-email";

describe("education email boundary", () => {
    it("normalizes email without changing login eligibility", () => {
        expect(normalizeEmail(" Legacy.Admin@Example.COM ")).toBe("legacy.admin@example.com");
        expect(isValidEmail("legacy.admin@example.com")).toBe(true);
    });

    it.each([
        "student@university.edu.vn",
        "lecturer@faculty.school.edu.vn",
        "admin@edu.vn",
    ])("accepts education registration email %s", email => {
        expect(isEducationEmail(email)).toBe(true);
    });

    it.each([
        "admin@example.com",
        "student@edu.vn.attacker.com",
        "student@notedu.vn",
        "not-an-email",
    ])("rejects non-education registration email %s", email => {
        expect(isEducationEmail(email)).toBe(false);
    });
});
