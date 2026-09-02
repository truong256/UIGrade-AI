import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

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

    // Submissions bucket is private; create signed URL or return path
    const { data: signedData, error: signError } = await supabase.storage
      .from("submissions")
      .createSignedUrl(data.path, 60 * 60 * 24 * 7); // 7 days

    if (signError || !signedData?.signedUrl) {
      const { data: { publicUrl } } = supabase.storage.from("submissions").getPublicUrl(data.path);
      return publicUrl;
    }

    return signedData.signedUrl;
  }
}
