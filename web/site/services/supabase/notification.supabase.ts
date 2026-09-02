import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapSupabaseErrorToVietnamese } from "@/lib/supabase/errors";

export class SupabaseNotificationService {
  /**
   * Lấy danh sách thông báo của người dùng
   */
  static async getNotifications(userId: string) {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await (supabase as any)
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      throw new Error(mapSupabaseErrorToVietnamese(error));
    }

    return data || [];
  }

  /**
   * Đánh dấu thông báo đã đọc
   */
  static async markAsRead(notificationId: string) {
    const supabase = await createSupabaseServerClient();

    const { error } = await (supabase as any)
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      throw new Error(mapSupabaseErrorToVietnamese(error));
    }

    return { success: true };
  }

  /**
   * Đánh dấu tất cả thông báo của người dùng đã đọc
   */
  static async markAllAsRead(userId: string) {
    const supabase = await createSupabaseServerClient();

    const { error } = await (supabase as any)
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId);

    if (error) {
      throw new Error(mapSupabaseErrorToVietnamese(error));
    }

    return { success: true };
  }
}
