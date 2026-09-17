// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { createServerClient } from "@supabase/ssr";
import type { CookieMethodsServer, CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import type { RuntimeDatabase } from "@/types/database-runtime.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

function createClient(cookieMethods: CookieMethodsServer) {
  return createServerClient<RuntimeDatabase>(supabaseUrl, supabaseAnonKey, {
    cookies: cookieMethods,
  });
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createClient({
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) =>
          cookieStore.set(name, value, options)
        );
      } catch {
        // Can happen in Server Components (read-only cookie store)
      }
    },
  });
}

type PendingCookie = { name: string; value: string; options: CookieOptions };

/**
 * Route Handlers return their own Response object. Keep Supabase cookie writes
 * in memory and explicitly attach them to that exact response so an exchanged
 * PKCE session cannot be lost between the callback and its redirect target.
 */
export async function createSupabaseRouteClient() {
  const cookieStore = await cookies();
  const currentCookies = new Map(
    cookieStore.getAll().map(({ name, value }) => [name, value])
  );
  const pendingCookies = new Map<string, PendingCookie>();
  const pendingHeaders = new Headers();

  const supabase = createClient({
    getAll() {
      return Array.from(currentCookies, ([name, value]) => ({ name, value }));
    },
    setAll(cookiesToSet, headers) {
      cookiesToSet.forEach(cookie => {
        currentCookies.set(cookie.name, cookie.value);
        pendingCookies.set(cookie.name, cookie);
      });
      Object.entries(headers).forEach(([name, value]) =>
        pendingHeaders.set(name, value)
      );
    },
  });

  function applyCookies<T extends NextResponse>(response: T): T {
    pendingCookies.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options)
    );
    pendingHeaders.forEach((value, name) => response.headers.set(name, value));
    return response;
  }

  return { supabase, applyCookies };
}
