const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: unknown): string {
    return String(value ?? "").trim().toLowerCase();
}

export function isValidEmail(value: unknown): boolean {
    return EMAIL_PATTERN.test(normalizeEmail(value));
}

/** Registration-only rule. Existing accounts are intentionally not revalidated. */
export function isEducationEmail(value: unknown): boolean {
    const email = normalizeEmail(value);
    if (!EMAIL_PATTERN.test(email)) return false;

    const domain = email.slice(email.lastIndexOf("@") + 1);
    return domain === "edu.vn" || domain.endsWith(".edu.vn");
}
