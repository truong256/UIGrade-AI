import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapSupabaseErrorToVietnamese } from "@/lib/supabase/errors";
import { Json } from "@/types/database.types";

export interface AssignmentItem {
  id: string;
  class_id: string;
  class_name?: string;
  lecturer_id: string;
  lecturer_name?: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  due_at: string;
  max_score: number;
  weight?: number | null;
  status: string;
  attachment_url?: string | null;
  target_apk_url?: string | null;
  baseline_ui_url?: string | null;
  test_scenarios?: Json;
  rubric?: Json;
  is_active: boolean;
  allow_late_submission: boolean;
  late_penalty_percent?: number | null;
  submissions_count?: number;
  graded_count?: number;
  my_submission?: any;
  created_at: string;
  updated_at: string;
}

export class SupabaseAssignmentService {
  /**
   * Lấy danh sách bài tập theo quyền người dùng
   */
  static async getAssignments(userId: string, userRole: string): Promise<AssignmentItem[]> {
    const supabase = await createSupabaseServerClient();

    let query = (supabase as any).from("assignments").select(`
      *,
      class:classes!assignments_class_id_fkey(id, name, class_code),
      lecturer:profiles!assignments_lecturer_id_fkey(full_name),
      submissions(id, status, score, student_id, submitted_at)
    `);

    if (userRole === "lecturer" || userRole === "teacher") {
      query = query.eq("lecturer_id", userId);
    } else if (userRole === "student") {
      // Lấy danh sách lớp sinh viên đã tham gia
      const { data: memberships } = await (supabase as any)
        .from("class_members")
        .select("class_id")
        .eq("student_id", userId);

      const classIds = (memberships || []).map((m: any) => m.class_id);
      if (classIds.length === 0) return [];
      query = query.in("class_id", classIds).eq("status", "published");
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      throw new Error(mapSupabaseErrorToVietnamese(error));
    }

    return (data || []).map((a: any) => {
      const submissions = a.submissions || [];
      const mySub = userRole === "student" ? submissions.find((s: any) => s.student_id === userId) : null;
      const graded = submissions.filter((s: any) => s.status === "graded").length;

      return {
        id: a.id,
        class_id: a.class_id,
        class_name: a.class?.name || "Lớp học",
        lecturer_id: a.lecturer_id,
        lecturer_name: a.lecturer?.full_name || "Giảng viên",
        title: a.title,
        description: a.description,
        instructions: a.instructions,
        due_at: a.due_at,
        max_score: Number(a.max_score),
        weight: a.weight ? Number(a.weight) : 1.0,
        status: a.status,
        attachment_url: a.attachment_url,
        target_apk_url: a.target_apk_url,
        baseline_ui_url: a.baseline_ui_url,
        test_scenarios: a.test_scenarios,
        rubric: a.rubric,
        is_active: a.is_active,
        allow_late_submission: a.allow_late_submission,
        late_penalty_percent: a.late_penalty_percent,
        submissions_count: submissions.length,
        graded_count: graded,
        my_submission: mySub,
        created_at: a.created_at,
        updated_at: a.updated_at,
      };
    });
  }

  /**
   * Lấy chi tiết một bài tập
   */
  static async getAssignmentById(assignmentId: string, _userId?: string) {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await (supabase as any)
      .from("assignments")
      .select(`
        *,
        class:classes!assignments_class_id_fkey(id, name, class_code),
        lecturer:profiles!assignments_lecturer_id_fkey(id, full_name, email),
        submissions(
          id,
          student_id,
          status,
          score,
          ai_suggested_score,
          ai_feedback,
          teacher_feedback,
          submitted_at,
          is_late,
          file_url,
          student:profiles!submissions_student_id_fkey(id, full_name, email, student_code)
        )
      `)
      .eq("id", assignmentId)
      .single();

    if (error || !data) {
      throw new Error(mapSupabaseErrorToVietnamese(error || "Không tìm thấy bài tập"));
    }

    return data;
  }

  /**
   * Tạo bài tập mới
   */
  static async createAssignment(params: {
    class_id: string;
    lecturer_id: string;
    title: string;
    description?: string;
    instructions?: string;
    due_at: string;
    max_score?: number;
    weight?: number;
    attachment_url?: string;
    target_apk_url?: string;
    baseline_ui_url?: string;
    test_scenarios?: Json;
    rubric?: Json;
  }) {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await (supabase as any)
      .from("assignments")
      .insert({
        class_id: params.class_id,
        lecturer_id: params.lecturer_id,
        title: params.title.trim(),
        description: params.description || null,
        instructions: params.instructions || null,
        due_at: params.due_at,
        max_score: params.max_score || 10.0,
        weight: params.weight || 1.0,
        status: "published",
        attachment_url: params.attachment_url || null,
        target_apk_url: params.target_apk_url || null,
        baseline_ui_url: params.baseline_ui_url || null,
        test_scenarios: params.test_scenarios || [],
        rubric: params.rubric || [],
        is_active: true,
        allow_late_submission: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(mapSupabaseErrorToVietnamese(error));
    }

    return data;
  }

  /**
   * Cập nhật bài tập
   */
  static async updateAssignment(assignmentId: string, updates: Partial<AssignmentItem>) {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await (supabase as any)
      .from("assignments")
      .update(updates)
      .eq("id", assignmentId)
      .select()
      .single();

    if (error) {
      throw new Error(mapSupabaseErrorToVietnamese(error));
    }

    return data;
  }

  /**
   * Xóa bài tập
   */
  static async deleteAssignment(assignmentId: string) {
    const supabase = await createSupabaseServerClient();

    const { error } = await (supabase as any).from("assignments").delete().eq("id", assignmentId);

    if (error) {
      throw new Error(mapSupabaseErrorToVietnamese(error));
    }

    return { success: true };
  }
}
