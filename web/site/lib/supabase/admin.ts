/**
 * lib/supabase/admin.ts
 *
 * Supabase client with service role (admin) privileges.
 *
 * SECURITY:
 *  - SUPABASE_SERVICE_ROLE_KEY must be set — no fallback to anon key.
 *    Falling back to anon key would silently downgrade authorization behavior,
 *    causing RLS policies to behave incorrectly without any visible error.
 *  - This client is ONLY for server-side use (API routes, server actions).
 *  - SUPABASE_SERVICE_ROLE_KEY must NEVER be exposed to the browser.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Create a Supabase admin client using the service role key.
 *
 * Throws a clear configuration error if the required environment
 * variables are missing — never silently degrades to anon access.
 */
export function createSupabaseAdminClient() {
    if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
        throw new Error(
            "[Supabase Admin] NEXT_PUBLIC_SUPABASE_URL is not configured. " +
            "Please set it in .env.local."
        );
    }

    if (!supabaseServiceKey || supabaseServiceKey.includes("placeholder")) {
        throw new Error(
            "[Supabase Admin] SUPABASE_SERVICE_ROLE_KEY is not configured. " +
            "This key is required for admin operations and must never be exposed to the browser. " +
            "Please set it in .env.local."
        );
    }

    return createClient<Database>(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
}
