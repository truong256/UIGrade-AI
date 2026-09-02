/**
 * lib/formatters.ts
 *
 * Centralized formatting helpers for Date, Time, Scores, Percentages, and File Sizes.
 */

/**
 * Format date string to Vietnamese display format (DD/MM/YYYY)
 */
export function formatDateVi(value?: string | Date | null, fallback = "--"): string {
    if (!value) return fallback;
    const date = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return fallback;

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

/**
 * Format datetime string to Vietnamese display format (HH:mm DD/MM/YYYY)
 */
export function formatDateTimeVi(value?: string | Date | null, fallback = "--"): string {
    if (!value) return fallback;
    const date = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return fallback;

    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${hours}:${minutes} ${day}/${month}/${year}`;
}

/**
 * Format numeric score with custom precision
 */
export function formatScoreVi(value?: number | string | null, fallback = "--", precision = 1): string {
    if (value === null || value === undefined || value === "") return fallback;
    const num = Number(value);
    if (Number.isNaN(num)) return fallback;
    return num % 1 === 0 ? String(num) : num.toFixed(precision);
}

/**
 * Format percentage (e.g. 85.5 -> "85.5%")
 */
export function formatPercentVi(value?: number | string | null, fallback = "0%"): string {
    if (value === null || value === undefined) return fallback;
    const num = Number(value);
    if (Number.isNaN(num)) return fallback;
    return `${Math.round(num * 10) / 10}%`;
}

/**
 * Format byte count to human-readable string (KB, MB, GB)
 */
export function formatFileSizeVi(bytes?: number | null, fallback = "0 KB"): string {
    if (!bytes || bytes <= 0) return fallback;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
