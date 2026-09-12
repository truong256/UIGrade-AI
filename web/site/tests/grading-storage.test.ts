import { describe, expect, it } from "vitest";
import {
    assertSubmissionObjectOwnership,
    resolvePrivateSubmissionObjectPath,
} from "@/lib/grading-storage";

const projectUrl = "https://plcrwxcwgfcqtfuidloz.supabase.co";

describe("private grading file paths", () => {
    it.each([
        "student-1/assignment-1/source.zip",
        "submissions/student-1/assignment-1/source.zip",
        `${projectUrl}/storage/v1/object/sign/submissions/student-1/assignment-1/source.zip?token=temporary`,
        `${projectUrl}/storage/v1/object/public/submissions/student-1/assignment-1/source.zip`,
    ])("normalizes a project storage path: %s", raw => {
        const path = resolvePrivateSubmissionObjectPath(raw, projectUrl);
        expect(path).toBe("student-1/assignment-1/source.zip");
        expect(() => assertSubmissionObjectOwnership(path, "student-1", "assignment-1")).not.toThrow();
    });

    it("rejects external HTTPS files instead of returning a public URL", () => {
        expect(() => resolvePrivateSubmissionObjectPath(
            "https://files.example.com/submission.zip",
            projectUrl
        )).toThrow("Supabase Storage của dự án");
    });

    it.each([
        "student-1/assignment-1/../secret.zip",
        "student-2/assignment-1/source.zip",
        "student-1/assignment-2/source.zip",
    ])("rejects traversal or another submission path: %s", raw => {
        if (raw.includes("..")) {
            expect(() => resolvePrivateSubmissionObjectPath(raw, projectUrl)).toThrow("không hợp lệ");
            return;
        }
        expect(() => assertSubmissionObjectOwnership(raw, "student-1", "assignment-1"))
            .toThrow("không thuộc bài nộp");
    });
});
