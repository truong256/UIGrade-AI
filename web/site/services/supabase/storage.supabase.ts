import { createSupabaseServerClient } from "@/lib/supabase/server";

export class SupabaseStorageService {
  /**
   * Upload avatar cho người dùng
   */
  static async uploadAvatar(userId: string, file: Buffer, fileName: string, contentType: string) {
    const supabase = await createSupabaseServerClient();
    const safeName = `${userId}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const { data, error } = await supabase.storage
      .from("avatars")
      .upload(safeName, file, {
        contentType,
        upsert: true,
      });

    if (error) throw new Error(error.message);

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(data.path);
    return publicUrl;
  }

  /**
   * Upload file đính kèm bài tập
   */
  static async uploadAssignmentAttachment(file: Buffer, fileName: string, contentType: string) {
    const supabase = await createSupabaseServerClient();
    const safeName = `attachments/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const { data, error } = await supabase.storage
      .from("assignments")
      .upload(safeName, file, {
        contentType,
        upsert: true,
      });

    if (error) throw new Error(error.message);

    const { data: { publicUrl } } = supabase.storage.from("assignments").getPublicUrl(data.path);
    return publicUrl;
  }

  /**
   * Upload file bài nộp APK / ZIP của sinh viên
   */
  static async uploadSubmissionFile(userId: string, file: Buffer, fileName: string, contentType: string) {
    const supabase = await createSupabaseServerClient();
    const safeName = `${userId}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

    const { data, error } = await supabase.storage
      .from("submissions")
      .upload(safeName, file, {
        contentType,
        upsert: true,
      });

    if (error) throw new Error(error.message);

    // Persist the stable object path, never an expiring signed URL. Authorized
    // download routes create short-lived links only when the user opens a file.
    return data.path;
  }
}
