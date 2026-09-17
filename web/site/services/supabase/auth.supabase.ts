// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapSupabaseErrorToVietnamese } from "@/lib/supabase/errors";
import { UserRole } from "@/types/database.types";
import { authenticatedProfileRole } from "@/lib/auth-routing";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string | null;
  role: UserRole;
  status: string;
  phone?: string | null;
  student_code?: string | null;
  department?: string | null;
  created_at: string;
}

export class AuthProfileUnavailableError extends Error {
  constructor() {
    super("Không thể tải hồ sơ. Vui lòng thử lại sau.");
    this.name = "AuthProfileUnavailableError";
  }
}

export class SupabaseAuthService {
  /**
   * Đăng nhập với email và password
   */
  static async login(params: { email: string; password: string }) {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });

    if (error || !data.user) {
      throw new Error(mapSupabaseErrorToVietnamese(error));
    }

    // Lấy thông tin profile
    const { data: profile, error: profileError } = await (supabase as any)
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError) throw new AuthProfileUnavailableError();

    if (!profile) {
      // Never invent a default student role. Missing profiles must complete onboarding.
      return { session: data.session, user: null };
    }

    return { session: data.session, user: {
      ...profile, role: authenticatedProfileRole(profile.role) ?? profile.role,
    } as UserProfile };
  }

  /**
   * Lấy thông tin user hiện tại từ session
   */
  static async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) return null;

      const { data: profile } = await (supabase as any)
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      return profile && profile.status === "active" ? ({
        ...profile, role: authenticatedProfileRole(profile.role) ?? profile.role,
      } as UserProfile) : null;
    } catch {
      return null;
    }
  }

  /**
   * Đăng xuất
   */
  static async logout() {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signOut({ scope: "global" });
    if (error) throw new Error(mapSupabaseErrorToVietnamese(error));
  }

  /**
   * Cập nhật thông tin cá nhân
   */
  static async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const supabase = await createSupabaseServerClient();

    // Không cho phép user tự thay đổi role qua hàm này
    const safeUpdates = { ...updates };
    delete safeUpdates.role;
    delete safeUpdates.id;
    delete safeUpdates.status;

    const { data, error } = await (supabase as any)
      .from("profiles")
      .update(safeUpdates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(mapSupabaseErrorToVietnamese(error));
    }

    return data;
  }
}
