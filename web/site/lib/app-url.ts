// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

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
 * In production, NEXT_PUBLIC_APP_URL might be set to `http://localhost:3000`
 * (the .env.local default) if it was accidentally propagated to Vercel env vars.
 * That value must never be used as a production redirect origin.
 *
 * RESOLUTION PRIORITY
 * ────────────────────
 * 1. Browser-facing `request.url` origin
 *    OAuth PKCE cookies are host-scoped, so the post-callback redirect must stay on
 *    the same alias that received the callback. Vercel can serve one project from
 *    several aliases; its project production URL is not necessarily the active one.
 *
 * 2. `VERCEL_PROJECT_PRODUCTION_URL` (auto-injected by Vercel — no manual config)
 *    Stable fallback when the request contains only a server bind address.
 *
 * 3. `NEXT_PUBLIC_APP_URL` (explicit manual config — preferred when set correctly)
 *    Local:      http://localhost:3000
 *    Production: https://your-app.vercel.app
 *    Skipped on production Vercel (VERCEL_ENV=production) when it resolves to a
 *    localhost/loopback/bind address — prevents accidental localhost redirect chains.
 *
 * 4. `x-forwarded-proto` + `x-forwarded-host` outside Vercel production
 *    Development/self-hosted proxies can use these only when request.url contains
 *    a bind address. Vercel production never trusts them as redirect input.
 *
 * 5. `VERCEL_URL` (auto-injected by Vercel — deployment-specific URL)
 *    Set on every Vercel deployment (production and preview). Value is a hostname
 *    only (no protocol). For preview deployments this is the unique preview URL.
 *    Always https since Vercel deployments are HTTPS-only.
 *
 * SECURITY
 * ────────
 * Base URL always comes from trusted configuration or trusted headers, never
 * from arbitrary user-controlled query parameters or request bodies.
 * This function does NOT create open-redirect vulnerabilities.
 */

/** Hosts that are valid server bind addresses but invalid browser URLs. */
const INVALID_BROWSER_HOSTS = new Set(["0.0.0.0", "::", "::1"]);

/** Loopback / bind-address hostnames that are invalid as production origins. */
const LOCALHOST_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::", "::1"]);

function isValidBrowserUrl(url: URL): boolean {
    const hostname = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
    return (url.protocol === "https:" || url.protocol === "http:")
        && !INVALID_BROWSER_HOSTS.has(hostname);
}

/**
 * Returns true when the parsed URL resolves to a loopback / development host
 * that must never be used as a canonical redirect origin in production.
 */
export function isLocalhostOrigin(origin: string): boolean {
    try {
        const parsed = new URL(origin);
        const hostname = parsed.hostname.replace(/^\[|\]$/g, "");
        return LOCALHOST_HOSTS.has(hostname);
    } catch {
        return false;
    }
}

/**
 * Safely parse a raw value that may be:
 *   - A bare hostname:       "your-app.vercel.app"          → "https://your-app.vercel.app"
 *   - A valid URL with path: "https://your-app.vercel.app/" → "https://your-app.vercel.app"
 *   - Already an origin:     "https://your-app.vercel.app"  → "https://your-app.vercel.app"
 * Always strips trailing slashes and path/query components.
 * Returns null if the input is empty or cannot be parsed.
 */
export function normalizeOrigin(raw: string | undefined, defaultProtocol = "https"): string | null {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;

    try {
        // If it already has a protocol, parse directly.
        if (/^https?:\/\//i.test(trimmed)) {
            return new URL(trimmed).origin;
        }
        // Bare hostname — prepend default protocol.
        return new URL(`${defaultProtocol}://${trimmed}`).origin;
    } catch {
        return null;
    }
}

/**
 * Returns true when running inside a Vercel production deployment.
 * Vercel auto-sets VERCEL_ENV to "production" | "preview" | "development".
 */
function isVercelProduction(): boolean {
    return process.env.VERCEL_ENV === "production";
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
    const isProduction = isVercelProduction();

    // 1. Preserve the browser-facing host that received this request. Supabase's
    //    PKCE/session cookies are host-scoped; switching to another Vercel alias in
    //    the redirect makes the freshly authenticated browser appear signed out.
    //    In Vercel production, reject HTTP and all local/bind origins before they
    //    can preempt the platform-provided HTTPS fallbacks.
    try {
        const requestOrigin = new URL(request.url);
        const productionSafe = !isProduction
            || (requestOrigin.protocol === "https:" && !isLocalhostOrigin(requestOrigin.origin));
        if (isValidBrowserUrl(requestOrigin) && productionSafe) {
            return requestOrigin.origin;
        }
    } catch {
        // Malformed request.url — fall through to configured fallbacks.
    }

    // 2. VERCEL_PROJECT_PRODUCTION_URL — stable production fallback.
    //    Only trust it in a verified production environment to avoid leaking
    //    the production URL from preview or local runs.
    if (isProduction) {
        const projectProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
        const origin = normalizeOrigin(projectProductionUrl, "https");
        if (origin && !isLocalhostOrigin(origin)) {
            return origin;
        }
    }

    // 3. NEXT_PUBLIC_APP_URL — explicit manual config.
    //    On production Vercel, skip it if it resolves to localhost to prevent
    //    .env.local defaults from being accidentally configured in the dashboard.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const appOrigin = normalizeOrigin(appUrl, "https");
    if (appOrigin) {
        if (isProduction && (isLocalhostOrigin(appOrigin) || new URL(appOrigin).protocol !== "https:")) {
            // Production APP_URL is local or HTTP — skip.
        } else {
            return appOrigin;
        }
    }

    // 4. Reverse-proxy headers are useful for local/self-hosted setups whose
    //    request.url contains a bind address. Never trust them in Vercel production:
    //    an untrusted forwarded host must not become an external redirect.
    if (!isProduction) {
        const reqHeaders = request.headers instanceof Headers
            ? request.headers
            : new Headers(request.headers as HeadersInit);
        const fwdProto = reqHeaders.get("x-forwarded-proto");
        const fwdHost = reqHeaders.get("x-forwarded-host");
        if (fwdProto && fwdHost) {
            const proto = fwdProto.split(",")[0].trim();
            const host = fwdHost.split(",")[0].trim();
            if (proto === "https" || proto === "http") {
                const fwdOrigin = normalizeOrigin(`${proto}://${host}`, proto);
                if (fwdOrigin && isValidBrowserUrl(new URL(fwdOrigin))) return fwdOrigin;
            }
        }
    }

    // 5. VERCEL_URL — auto-injected, deployment-specific (production or preview).
    //    Useful as a fallback when NEXT_PUBLIC_APP_URL is not set and forwarded
    //    headers are unavailable.
    const vercelUrl = process.env.VERCEL_URL;
    const vercelOrigin = normalizeOrigin(vercelUrl, "https");
    if (vercelOrigin) return vercelOrigin;

    // 6. Hard fallback — should never be reached in a correctly configured
    //    environment, but prevents a crash if all strategies fail.
    return "http://localhost:3000";
}
