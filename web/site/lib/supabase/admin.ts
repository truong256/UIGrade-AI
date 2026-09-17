// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { createClient } from "@supabase/supabase-js";
import type { RuntimeDatabase } from "@/types/database-runtime.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";

export function createSupabaseAdminClient() {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
        throw new Error("Supabase Admin chưa được cấu hình trên server");
    }

    return createClient<RuntimeDatabase>(supabaseUrl, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    });
}
