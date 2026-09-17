// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import path from "node:path";
import { AuthorizationError, ROLES, type AuthenticatedActor } from "@/lib/authorization";

export function assertOwningLecturer(
    actor: AuthenticatedActor,
    assignmentLecturerId: unknown
): void {
    if (actor.role !== ROLES.LECTURER) {
        throw new AuthorizationError("Chỉ giảng viên sở hữu bài tập mới được phép thao tác");
    }

    if (String(assignmentLecturerId ?? "") !== actor.userId) {
        throw new AuthorizationError("Bạn không sở hữu bài tập này");
    }
}

function decodePublicUrl(value: string): string {
    let decoded = value;

    for (let index = 0; index < 3; index += 1) {
        const next = decodeURIComponent(decoded);
        if (next === decoded) return decoded;
        decoded = next;
    }

    return decoded;
}

/**
 * Resolve an assignment upload URL beneath public/uploads/assignments.
 * Backslashes, drive-letter paths and encoded traversal are rejected before
 * path.resolve performs the final containment check.
 */
export function resolveAssignmentAssetPath(
    publicRoot: string,
    sourceImageUrl: string
): string {
    let decoded: string;

    try {
        decoded = decodePublicUrl(sourceImageUrl.trim());
    } catch {
        throw new AuthorizationError("Đường dẫn ảnh không hợp lệ", 403);
    }

    if (
        !decoded ||
        decoded.includes("\0") ||
        decoded.includes("\\") ||
        decoded.includes("?") ||
        decoded.includes("#") ||
        decoded.startsWith("//") ||
        /^[a-zA-Z]:/.test(decoded) ||
        /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(decoded)
    ) {
        throw new AuthorizationError("Đường dẫn ảnh không được phép", 403);
    }

    const relativePath = decoded.replace(/^\/+/, "");
    const allowedRoot = path.resolve(publicRoot, "uploads", "assignments");
    const resolvedPath = path.resolve(publicRoot, relativePath);
    const allowedPrefix = `${allowedRoot}${path.sep}`;

    if (!resolvedPath.startsWith(allowedPrefix)) {
        throw new AuthorizationError("Đường dẫn ảnh nằm ngoài thư mục bài tập", 403);
    }

    return resolvedPath;
}

export function escapeRegexLiteral(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
