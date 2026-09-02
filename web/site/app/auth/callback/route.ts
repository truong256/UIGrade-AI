import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/ui/dashboard";

  if (code) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (!error && data.user) {
        // Đảm bảo user có bản ghi trong public.profiles
        const adminSupabase = createSupabaseAdminClient();
        const user = data.user;

        const { data: existingProfile } = await (adminSupabase as any)
          .from("profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        if (!existingProfile) {
          const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "Người dùng";
          const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

          await (adminSupabase as any).from("profiles").upsert({
            id: user.id,
            email: user.email || "",
            full_name: fullName,
            avatar_url: avatarUrl,
            role: "student",
            status: "active",
          });
        }

        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch {
      // Ignore exchange errors and redirect to login with error parameter
    }
  }

  // Nếu không có code hoặc có lỗi
  return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
}
