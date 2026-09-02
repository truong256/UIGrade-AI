import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { mapSupabaseErrorToVietnamese } from "@/lib/supabase/errors";
import { UserRole } from "@/types/database.types";

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

export class SupabaseAuthService {
  /**
   * Đăng ký tài khoản với Supabase Auth và tự động tạo profile
   */
  static async register(params: {
    email: string;
    password: string;
    fullName: string;
    role?: UserRole;
    phone?: string;
    studentCode?: string;
  }) {
    const supabase = createSupabaseAdminClient();

    // 1. Tạo user trong auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true,
      user_metadata: {
        full_name: params.fullName,
        role: params.role || "student",
      },
    });

    if (authError || !authData.user) {
      throw new Error(mapSupabaseErrorToVietnamese(authError));
    }

    // 2. Tạo hoặc cập nhật record trong public.profiles
    const { data: profile, error: profileError } = await (supabase as any)
      .from("profiles")
      .upsert({
        id: authData.user.id,
        email: params.email,
        full_name: params.fullName,
        role: params.role || "student",
        status: "active",
        phone: params.phone || null,
        student_code: params.studentCode || null,
      })
      .select()
      .single();

    if (profileError) {
      throw new Error(mapSupabaseErrorToVietnamese(profileError));
    }

    return { user: profile };
  }

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
      .single();

    if (profileError || !profile) {
      return {
        session: data.session,
        user: {
          id: data.user.id,
          email: data.user.email || params.email,
          full_name: data.user.user_metadata?.full_name || params.email.split("@")[0],
          role: (data.user.user_metadata?.role as UserRole) || "student",
          status: "active",
          created_at: new Date().toISOString(),
        } as UserProfile,
      };
    }

    return { session: data.session, user: profile as UserProfile };
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

      if (profile) return profile as UserProfile;

      return {
        id: user.id,
        email: user.email || "",
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Người dùng",
        role: (user.user_metadata?.role as UserRole) || "student",
        status: "active",
        created_at: user.created_at,
      };
    } catch {
      return null;
    }
  }

  /**
   * Đăng xuất
   */
  static async logout() {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
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
