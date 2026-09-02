import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapSupabaseErrorToVietnamese } from "@/lib/supabase/errors";

export interface ClassItem {
  id: string;
  name: string;
  description?: string | null;
  class_code: string;
  lecturer_id: string;
  lecturer_name?: string;
  semester?: string | null;
  academic_year?: string | null;
  subject_code?: string | null;
  status: string;
  cover_color?: string | null;
  students_count?: number;
  assignments_count?: number;
  created_at: string;
  updated_at: string;
}

export class SupabaseClassroomService {
  /**
   * Lấy danh sách lớp học theo vai trò người dùng
   */
  static async getClasses(userId: string, userRole: string): Promise<ClassItem[]> {
    const supabase = await createSupabaseServerClient();

    let query = (supabase as any).from("classes").select(`
      *,
      lecturer:profiles!classes_lecturer_id_fkey(full_name, email),
      class_members(count),
      assignments(count)
    `);

    if (userRole === "lecturer" || userRole === "teacher") {
      query = query.eq("lecturer_id", userId);
    } else if (userRole === "student") {
      // Tìm các lớp mà sinh viên đã tham gia
      const { data: memberships } = await (supabase as any)
        .from("class_members")
        .select("class_id")
        .eq("student_id", userId);

      const classIds = (memberships || []).map((m: any) => m.class_id);
      if (classIds.length === 0) return [];
      query = query.in("id", classIds);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      throw new Error(mapSupabaseErrorToVietnamese(error));
    }

    return (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      class_code: c.class_code,
      lecturer_id: c.lecturer_id,
      lecturer_name: c.lecturer?.full_name || "Giảng viên",
      semester: c.semester,
      academic_year: c.academic_year,
      subject_code: c.subject_code,
      status: c.status,
      cover_color: c.cover_color,
      students_count: c.class_members?.[0]?.count || 0,
      assignments_count: c.assignments?.[0]?.count || 0,
      created_at: c.created_at,
      updated_at: c.updated_at,
    }));
  }

  /**
   * Lấy chi tiết một lớp học
   */
  static async getClassById(classId: string) {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await (supabase as any)
      .from("classes")
      .select(`
        *,
        lecturer:profiles!classes_lecturer_id_fkey(full_name, email),
        class_members(
          id,
          joined_at,
          status,
          student:profiles!class_members_student_id_fkey(id, full_name, email, student_code, avatar_url)
        ),
        assignments(
          id,
          title,
          description,
          due_at,
          max_score,
          status,
          created_at
        )
      `)
      .eq("id", classId)
      .single();

    if (error || !data) {
      throw new Error(mapSupabaseErrorToVietnamese(error || "Không tìm thấy lớp học"));
    }

    return data;
  }

  /**
   * Tạo lớp học mới
   */
  static async createClass(params: {
    name: string;
    description?: string;
    class_code: string;
    lecturer_id: string;
    semester?: string;
    academic_year?: string;
    subject_code?: string;
    cover_color?: string;
  }) {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await (supabase as any)
      .from("classes")
      .insert({
        name: params.name,
        description: params.description || null,
        class_code: params.class_code.toUpperCase().trim(),
        lecturer_id: params.lecturer_id,
        semester: params.semester || "HK1",
        academic_year: params.academic_year || "2025-2026",
        subject_code: params.subject_code || null,
        cover_color: params.cover_color || "#0284C7",
        status: "active",
      })
      .select()
      .single();

    if (error) {
      throw new Error(mapSupabaseErrorToVietnamese(error));
    }

    return data;
  }

  /**
   * Tham gia lớp học bằng mã lớp
   */
  static async joinClassByCode(classCode: string, studentId: string) {
    const supabase = await createSupabaseServerClient();

    // 1. Tìm lớp theo mã
    const { data: cls, error: clsError } = await (supabase as any)
      .from("classes")
      .select("id, name, status")
      .eq("class_code", classCode.toUpperCase().trim())
      .single();

    if (clsError || !cls) {
      throw new Error("Mã lớp không tồn tại hoặc đã bị đóng.");
    }

    if ((cls as any).status !== "active") {
      throw new Error("Lớp học này hiện không nhận thêm sinh viên.");
    }

    // 2. Thêm vào class_members
    const { data, error } = await (supabase as any)
      .from("class_members")
      .insert({
        class_id: (cls as any).id,
        student_id: studentId,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      throw new Error(mapSupabaseErrorToVietnamese(error));
    }

    return { class: cls, member: data };
  }

  /**
   * Cập nhật lớp học
   */
  static async updateClass(classId: string, updates: Partial<ClassItem>) {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await (supabase as any)
      .from("classes")
      .update(updates)
      .eq("id", classId)
      .select()
      .single();

    if (error) {
      throw new Error(mapSupabaseErrorToVietnamese(error));
    }

    return data;
  }

  /**
   * Xóa lớp học
   */
  static async deleteClass(classId: string) {
    const supabase = await createSupabaseServerClient();

    const { error } = await (supabase as any).from("classes").delete().eq("id", classId);

    if (error) {
      throw new Error(mapSupabaseErrorToVietnamese(error));
    }

    return { success: true };
  }
}
