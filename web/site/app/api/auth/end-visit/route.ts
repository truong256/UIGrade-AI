// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// Best-effort browser-close revocation. Entry protection does not depend on this
// request arriving: browsers may terminate without delivering pagehide/beacons.
export async function POST(request: NextRequest) {
    if (request.headers.get("origin") !== request.nextUrl.origin) {
        return new NextResponse(null, { status: 403 });
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return new NextResponse(null, { status: 503 });
    try {
        const supabase = createServerClient(url, key, {
            cookies: {
                getAll: () => request.cookies.getAll(),
                // Never write response cookies: a late beacon response must not
                // erase a newer login in another document. Clear on next entry.
                setAll: values => values.forEach(({ name, value }) => request.cookies.set(name, value)),
            },
        });
        const { error } = await supabase.auth.signOut({ scope: "local" });
        return new NextResponse(null, { status: error ? 503 : 204, headers: { "Cache-Control": "no-store" } });
    } catch {
        return new NextResponse(null, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
}
