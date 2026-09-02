import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapSupabaseErrorToVietnamese } from "@/lib/supabase/errors";
import { Json } from "@/types/database.types";

export interface SubmissionItem {
  id: string;
  assignment_id: string;
  assignment_title?: string;
  class_name?: string;
  student_id: string;
  student_name?: string;
  student_email?: string;
  student_code?: string;
  content?: string | null;
  file_url?: string | null;
  apk_file_url?: string | null;
  apk_filename?: string | null;
  apk_size_bytes?: number | null;
  source_zip_url?: string | null;
  screenshot_urls?: Json;
  submitted_at: string;
  status: string;
  is_late: boolean;
  score?: number | null;
  ai_suggested_score?: number | null;
  ai_feedback?: string | null;
  teacher_feedback?: string | null;
  graded_at?: string | null;
  graded_by?: string | null;
  breakdown?: Json;
  execution_logs?: string | null;
  test_results?: Json;
  created_at: string;
  updated_at: string;
}

export class SupabaseSubmissionService {
  /**
   * Lấy danh sách bài nộp theo bài tập hoặc theo sinh viên
   */
  static async getSubmissions(params: {
    assignmentId?: string;
    studentId?: string;
    classId?: string;
  }): Promise<SubmissionItem[]> {
    const supabase = await createSupabaseServerClient();

    let query = (supabase as any).from("submissions").select(`
      *,
      assignment:assignments!submissions_assignment_id_fkey(
        id,
        title,
        max_score,
        due_at,
        class:classes!assignments_class_id_fkey(id, name)
      ),
      student:profiles!submissions_student_id_fkey(id, full_name, email, student_code, avatar_url)
    `);

    if (params.assignmentId) {
      query = query.eq("assignment_id", params.assignmentId);
    }

    if (params.studentId) {
      query = query.eq("student_id", params.studentId);
    }

    const { data, error } = await query.order("submitted_at", { ascending: false });

    if (error) {
      throw new Error(mapSupabaseErrorToVietnamese(error));
    }

    return (data || []).map((s: any) => ({
      id: s.id,
      assignment_id: s.assignment_id,
      assignment_title: s.assignment?.title || "Bài tập",
      class_name: s.assignment?.class?.name || "Lớp học",
      student_id: s.student_id,
      student_name: s.student?.full_name || "Sinh viên",
      student_email: s.student?.email || "",
      student_code: s.student?.student_code || "",
      content: s.content,
      file_url: s.file_url,
      apk_file_url: s.apk_file_url,
      apk_filename: s.apk_filename,
      apk_size_bytes: s.apk_size_bytes,
      source_zip_url: s.source_zip_url,
      screenshot_urls: s.screenshot_urls,
      submitted_at: s.submitted_at,
      status: s.status,
      is_late: s.is_late,
      score: s.score !== null ? Number(s.score) : null,
      ai_suggested_score: s.ai_suggested_score !== null ? Number(s.ai_suggested_score) : null,
      ai_feedback: s.ai_feedback,
      teacher_feedback: s.teacher_feedback,
      graded_at: s.graded_at,
      graded_by: s.graded_by,
      breakdown: s.breakdown,
      execution_logs: s.execution_logs,
      test_results: s.test_results,
      created_at: s.created_at,
      updated_at: s.updated_at,
    }));
  }

  /**
   * Lấy chi tiết bài nộp
   */
  static async getSubmissionById(submissionId: string) {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await (supabase as any)
      .from("submissions")
      .select(`
        *,
        assignment:assignments!submissions_assignment_id_fkey(
          id,
          title,
          description,
          due_at,
          max_score,
          rubric,
          test_scenarios,
          baseline_ui_url,
          class:classes!assignments_class_id_fkey(id, name, class_code)
        ),
        student:profiles!submissions_student_id_fkey(id, full_name, email, student_code, avatar_url),
        grading_history(
          id,
          score,
          teacher_feedback,
          graded_at,
          graded_by_profile:profiles!grading_history_graded_by_fkey(full_name)
        )
      `)
      .eq("id", submissionId)
      .single();

    if (error || !data) {
      throw new Error(mapSupabaseErrorToVietnamese(error || "Không tìm thấy bài nộp"));
    }

    return data;
  }

  /**
   * Sinh viên nộp bài hoặc cập nhật bài nộp
   */
  static async submitAssignment(params: {
    assignmentId: string;
    studentId: string;
    content?: string;
    fileUrl?: string;
    apkFileUrl?: string;
    apkFilename?: string;
    apkSizeBytes?: number;
    sourceZipUrl?: string;
  }) {
    const supabase = await createSupabaseServerClient();

    // 1. Kiểm tra hạn nộp
    const { data: assignment, error: assignError } = await (supabase as any)
      .from("assignments")
      .select("due_at, allow_late_submission, is_active")
      .eq("id", params.assignmentId)
      .single();

    if (assignError || !assignment) {
      throw new Error("Bài tập không tồn tại");
    }

    const now = new Date();
    const dueDate = new Date((assignment as any).due_at);
    const isLate = now > dueDate;

    if (isLate && !(assignment as any).allow_late_submission) {
      throw new Error("Bài tập này đã quá hạn và không cho phép nộp muộn.");
    }

    // 2. Kiểm tra xem đã có bản nộp trước đó chưa
    const { data: existing } = await (supabase as any)
      .from("submissions")
      .select("id")
      .eq("assignment_id", params.assignmentId)
      .eq("student_id", params.studentId)
      .maybeSingle();

    let submissionResult;

    if (existing) {
      // Cập nhật lại bài nộp
      const { data, error } = await (supabase as any)
        .from("submissions")
        .update({
          content: params.content,
          file_url: params.fileUrl,
          apk_file_url: params.apkFileUrl,
          apk_filename: params.apkFilename,
          apk_size_bytes: params.apkSizeBytes,
          source_zip_url: params.sourceZipUrl,
          submitted_at: now.toISOString(),
          status: "pending",
          is_late: isLate,
        })
        .eq("id", (existing as any).id)
        .select()
        .single();

      if (error) throw new Error(mapSupabaseErrorToVietnamese(error));
      submissionResult = data;
    } else {
      // Tạo bài nộp mới
      const { data, error } = await (supabase as any)
        .from("submissions")
        .insert({
          assignment_id: params.assignmentId,
          student_id: params.studentId,
          content: params.content || null,
          file_url: params.fileUrl || null,
          apk_file_url: params.apkFileUrl || null,
          apk_filename: params.apkFilename || null,
          apk_size_bytes: params.apkSizeBytes || null,
          source_zip_url: params.sourceZipUrl || null,
          submitted_at: now.toISOString(),
          status: "pending",
          is_late: isLate,
        })
        .select()
        .single();

      if (error) throw new Error(mapSupabaseErrorToVietnamese(error));
      submissionResult = data;
    }

    return submissionResult;
  }

  /**
   * Giảng viên chấm điểm bài nộp
   */
  static async gradeSubmission(params: {
    submissionId: string;
    score: number;
    teacherFeedback?: string;
    breakdown?: Json;
    gradedBy: string;
  }) {
    const supabase = await createSupabaseServerClient();
    const now = new Date().toISOString();

    // 1. Cập nhật bài nộp
    const { data: submission, error: updateError } = await (supabase as any)
      .from("submissions")
      .update({
        score: params.score,
        teacher_feedback: params.teacherFeedback || null,
        breakdown: params.breakdown || {},
        status: "graded",
        graded_at: now,
        graded_by: params.gradedBy,
      })
      .eq("id", params.submissionId)
      .select()
      .single();

    if (updateError) {
      throw new Error(mapSupabaseErrorToVietnamese(updateError));
    }

    // 2. Ghi lịch sử chấm bài
    await (supabase as any).from("grading_history").insert({
      submission_id: params.submissionId,
      score: params.score,
      teacher_feedback: params.teacherFeedback || null,
      breakdown: params.breakdown || {},
      graded_by: params.gradedBy,
      graded_at: now,
    });

    // 3. Tạo thông báo cho sinh viên
    if (submission && (submission as any).student_id) {
      await (supabase as any).from("notifications").insert({
        user_id: (submission as any).student_id,
        title: "Bài tập của bạn đã được chấm điểm",
        content: `Điểm số: ${params.score}đ. ${params.teacherFeedback ? `Nhận xét: ${params.teacherFeedback}` : ""}`,
        type: "grade",
        metadata: { submission_id: params.submissionId },
        is_read: false,
      });
    }

    return submission;
  }
}
