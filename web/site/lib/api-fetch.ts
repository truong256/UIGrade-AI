/**
 * lib/api-fetch.ts
 *
 * Lightweight, type-safe fetch wrapper for client-side API requests.
 * Normalizes JSON parsing and error handling without hiding HTTP semantics.
 */

export type ApiResponse<T = unknown> = {
    success?: boolean;
    data?: T;
    message?: string;
    [key: string]: unknown;
};

export async function apiFetch<T = unknown>(
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<{ ok: boolean; status: number; data?: T; message?: string; raw: ApiResponse<T> }> {
    try {
        const res = await fetch(input, init);
        let raw: ApiResponse<T> = {};

        try {
            raw = (await res.json()) as ApiResponse<T>;
        } catch {
            raw = {};
        }

        const ok = res.ok && raw.success !== false;
        const message = raw.message || (ok ? "Thành công" : `Yêu cầu thất bại (${res.status})`);
        const data = (raw.data !== undefined ? raw.data : (raw as unknown as T)) as T;

        return {
            ok,
            status: res.status,
            data,
            message,
            raw,
        };
    } catch (err) {
        const message = err instanceof Error ? err.message : "Lỗi kết nối mạng";
        return {
            ok: false,
            status: 0,
            message,
            raw: { success: false, message },
        };
    }
}
