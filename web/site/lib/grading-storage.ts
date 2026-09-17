// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

const STORAGE_OBJECT_MARKER = "/storage/v1/object/";

function validateObjectPath(path: string): string {
    const normalized = path.replace(/^\/+/, "").replace(/^submissions\//, "");
    const segments = normalized.split("/");
    if (!normalized || segments.some((segment) => !segment || segment === "." || segment === "..")) {
        throw new Error("Đường dẫn tệp bài nộp không hợp lệ.");
    }
    return normalized;
}

export function resolvePrivateSubmissionObjectPath(rawValue: unknown, supabaseUrl: string): string {
    const raw = String(rawValue ?? "").trim();
    if (!raw) throw new Error("Không tìm thấy tệp bài nộp.");

    if (!/^https?:\/\//i.test(raw)) return validateObjectPath(raw);

    const target = new URL(raw);
    const project = new URL(supabaseUrl);
    if (target.origin !== project.origin) {
        throw new Error("Tệp bài nộp phải nằm trong Supabase Storage của dự án.");
    }

    const markerIndex = target.pathname.indexOf(STORAGE_OBJECT_MARKER);
    if (markerIndex < 0) {
        throw new Error("Liên kết Supabase Storage không hợp lệ.");
    }

    const encodedPath = target.pathname
        .slice(markerIndex + STORAGE_OBJECT_MARKER.length)
        .replace(/^(sign|public|authenticated)\//, "");
    return validateObjectPath(decodeURIComponent(encodedPath));
}

export function assertSubmissionObjectOwnership(
    objectPath: string,
    studentId: unknown,
    assignmentId: unknown
): void {
    const expectedPrefix = `${String(studentId ?? "")}/${String(assignmentId ?? "")}/`;
    if (!String(studentId ?? "") || !String(assignmentId ?? "") || !objectPath.startsWith(expectedPrefix)) {
        throw new Error("Tệp không thuộc bài nộp hiện tại.");
    }
}
