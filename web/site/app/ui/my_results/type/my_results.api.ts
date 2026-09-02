import type { CurrentUser, ResultItem } from "./my_results.type";
import { normalizeResult, pickLatestByAssignment } from "./my_results.utils";

async function readJson(response: Response) {
    return response.json().catch(() => ({}));
}

export async function fetchCurrentUser(): Promise<CurrentUser | null> {
    const response = await fetch("/api/auth/me", { cache: "no-store" });
    const json = await readJson(response);

    if (!response.ok) {
        throw new Error(json.message || "Bạn chưa đăng nhập");
    }

    return (json.user || null) as CurrentUser | null;
}

export async function fetchMyResults(): Promise<ResultItem[]> {
    const response = await fetch("/api/submissions", { cache: "no-store" });
    const json = await readJson(response);

    if (!response.ok) {
        throw new Error(json.message || "Không tải được kết quả bài tập");
    }

    const normalized = Array.isArray(json.data)
        ? json.data.map((entry: unknown) => normalizeResult(entry))
        : [];

    return pickLatestByAssignment(normalized);
}
