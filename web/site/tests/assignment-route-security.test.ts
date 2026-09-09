import path from "node:path";
import { describe, expect, it } from "vitest";
import {
    assertOwningLecturer,
    escapeRegexLiteral,
    resolveAssignmentAssetPath,
} from "@/lib/assignment-route-security";
import { AuthorizationError, type AuthenticatedActor } from "@/lib/authorization";

const owner: AuthenticatedActor = {
    userId: "lecturer-owner",
    email: "owner@example.com",
    role: "lecturer",
};

describe("assignment mutation authorization", () => {
    it("allows only the owning lecturer", () => {
        expect(() => assertOwningLecturer(owner, owner.userId)).not.toThrow();
        expect(() => assertOwningLecturer({ ...owner, userId: "other" }, owner.userId))
            .toThrowError(AuthorizationError);
        expect(() => assertOwningLecturer({ ...owner, role: "student" }, owner.userId))
            .toThrowError(AuthorizationError);
        expect(() => assertOwningLecturer({ ...owner, role: "admin" }, owner.userId))
            .toThrowError(AuthorizationError);
    });
});

describe("assignment asset path containment", () => {
    const publicRoot = path.resolve("/tmp/uigrade-public");

    it("accepts only assignment upload URLs", () => {
        expect(
            resolveAssignmentAssetPath(
                publicRoot,
                "/uploads/assignments/abc/reference.png"
            )
        ).toBe(path.resolve(publicRoot, "uploads/assignments/abc/reference.png"));
    });

    it.each([
        "/uploads/assignments/../../secrets.env",
        "/uploads/assignments/%2e%2e/%2e%2e/secrets.env",
        "/uploads/assignments/%252e%252e/%252e%252e/secrets.env",
        "C:\\Windows\\system.ini",
        "\\\\server\\share\\secret.png",
        "/etc/passwd",
        "https://example.com/image.png",
    ])("rejects traversal or absolute source %s", (value) => {
        expect(() => resolveAssignmentAssetPath(publicRoot, value)).toThrowError(
            AuthorizationError
        );
    });
});

describe("regex literal escaping", () => {
    it("turns user input into a literal search expression", () => {
        const regex = new RegExp(escapeRegexLiteral("(a+)+$"), "i");
        expect(regex.test("student (a+)+$ record")).toBe(true);
        expect(regex.test("aaaaaaaaaaaaaaaa")).toBe(false);
    });
});
