/**
 * lib/app-url.ts
 *
 * Resolves the canonical application base URL (origin) for server-side
 * redirect construction.
 *
 * WHY THIS EXISTS
 * ───────────────
 * When `next dev` is started with `-H 0.0.0.0` (bind to all interfaces),
 * Next.js Route Handlers receive `request.url` with the bind address as the
 * host, e.g. `http://0.0.0.0:3000/auth/callback`.
 *
 * `0.0.0.0` is a valid server *listen* address but is NOT a valid browser
 * URL — browsers reject it with ERR_ADDRESS_INVALID.
 *
 * Using `new URL(request.url).origin` for redirect targets therefore breaks
 * the Google → Supabase → /auth/callback → /auth/select-role flow locally.
 *
 * RESOLUTION PRIORITY
 * ────────────────────
 * 1. `NEXT_PUBLIC_APP_URL` env var (explicit, trusted config — preferred)
 *    Local:      http://localhost:3000
 *    Production: https://your-app.vercel.app
 *
 * 2. `x-forwarded-proto` + `x-forwarded-host` headers
 *    Set by Vercel / nginx / other reverse proxies in production.
 *    Only used when both headers are present.
 *
 * 3. `VERCEL_URL` env var (auto-injected by Vercel runtime — no manual config)
 *    Vercel automatically sets this to the deployment's canonical hostname
 *    (without protocol) for every production and preview deployment.
 *    Format: `your-app-git-main-org.vercel.app` (no https:// prefix).
 *    Always uses https:// because Vercel deployments are always HTTPS.
 *    This is a reliable safety net when NEXT_PUBLIC_APP_URL is not explicitly
 *    configured on the Vercel dashboard.
 *
 * 4. `request.url` origin — last resort, only when the host is not a
 *    server bind address (0.0.0.0, ::, [::]).
 *
 * SECURITY
 * ────────
 * Base URL always comes from trusted configuration or trusted headers, never
 * from arbitrary user-controlled query parameters or request bodies.
 * This function does NOT create open-redirect vulnerabilities.
 */

/** Hosts that are valid server bind addresses but invalid browser URLs. */
const INVALID_BROWSER_HOSTS = new Set(["0.0.0.0", "::", "[::]"]);

function isValidBrowserHost(host: string): boolean {
    // Strip port before checking
    const hostname = host.split(":")[0].replace(/^\[|\]$/g, "");
    return !INVALID_BROWSER_HOSTS.has(hostname);
}

/**
 * Returns the canonical application origin (scheme + host + optional port)
 * that is safe to use in browser redirect URLs.
 *
 * Examples:
 *   Local dev (-H 0.0.0.0): "http://localhost:3000"
 *   Vercel production:       "https://your-app.vercel.app"
 */
export function getCanonicalOrigin(request: Request): string {
    // 1. Explicit env var — most reliable, always correct.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) {
        try {
            const parsed = new URL(appUrl);
            // Return origin (strips any path/query that might have been set by mistake)
            return parsed.origin;
        } catch {
            // Malformed env var — fall through to next strategy
        }
    }

    // 2. Reverse-proxy forwarded headers (Vercel, nginx, Cloudflare, etc.)
    const reqHeaders = request.headers instanceof Headers
        ? request.headers
        : new Headers(request.headers as HeadersInit);

    const fwdProto = reqHeaders.get("x-forwarded-proto");
    const fwdHost = reqHeaders.get("x-forwarded-host");
    if (fwdProto && fwdHost) {
        // x-forwarded-proto may be a comma-separated list; take the first value.
        const proto = fwdProto.split(",")[0].trim();
        if (proto === "https" || proto === "http") {
            try {
                return new URL(`${proto}://${fwdHost}`).origin;
            } catch {
                // Malformed header — fall through
            }
        }
    }

    // 3. VERCEL_URL — auto-injected by Vercel runtime for every deployment.
    //    No manual configuration required; always set on Vercel production and
    //    preview environments. Value is a hostname only (no protocol), so we
    //    always prepend https:// because Vercel deployments are HTTPS-only.
    //    This is the safety net when NEXT_PUBLIC_APP_URL was not explicitly set
    //    on the Vercel dashboard, preventing fallback to localhost on production.
    const vercelUrl = process.env.VERCEL_URL;
    if (vercelUrl) {
        try {
            return new URL(`https://${vercelUrl}`).origin;
        } catch {
            // Malformed VERCEL_URL — fall through
        }
    }

    // 4. request.url origin — only when the host is a real browser-accessible address.
    try {
        const parsed = new URL(request.url);
        if (isValidBrowserHost(parsed.host)) {
            return parsed.origin;
        }
    } catch {
        // Malformed request.url — fall through to hard fallback
    }

    // 5. Hard fallback — should never be reached in a correctly configured
    //    environment, but prevents a crash if all strategies fail.
    return "http://localhost:3000";
}
