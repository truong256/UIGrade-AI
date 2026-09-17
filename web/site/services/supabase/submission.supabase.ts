// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapSupabaseErrorToVietnamese } from "@/lib/supabase/errors";
import { SupabaseGradingService } from "@/services/supabase/grading.supabase";
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
      id, assignment_id, student_id, content, file_url, apk_file_url, apk_filename,
      apk_size_bytes, source_zip_url, screenshot_urls, submitted_at, status, is_late,
      execution_logs, test_results, created_at, updated_at,
      assignment:assignments!submissions_assignment_id_fkey(
        id,
        title,
        max_score,
        due_at,
        class:classes!assignments_class_id_fkey(id, name)
      ),
      student:profiles!submissions_student_id_fkey(id, full_name, email, student_code, avatar_url),
      grade:grades(status, score, max_score, feedback, rubric_breakdown, ai_feedback, graded_at, published_at)
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

    return (data || []).map((s: any) => {
      const gradeRelation = Array.isArray(s.grade) ? s.grade[0] : s.grade;
      const grade = gradeRelation || null;
      return {
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
      score: grade?.score !== null && grade?.score !== undefined ? Number(grade.score) : null,
      ai_suggested_score: null,
      ai_feedback: grade?.ai_feedback || null,
      teacher_feedback: grade?.feedback || null,
      graded_at: grade?.graded_at || null,
      graded_by: null,
      breakdown: grade?.rubric_breakdown || [],
      execution_logs: s.execution_logs,
      test_results: s.test_results,
      created_at: s.created_at,
      updated_at: s.updated_at,
      };
    });
  }

  /**
   * Lấy chi tiết bài nộp
   */
  static async getSubmissionById(submissionId: string) {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await (supabase as any)
      .from("submissions")
      .select(`
        id, assignment_id, student_id, content, file_url, apk_file_url, apk_filename,
        apk_size_bytes, source_zip_url, screenshot_urls, submitted_at, status, is_late,
        execution_logs, test_results, created_at, updated_at,
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
        grade:grades(id, status, score, max_score, feedback, rubric_breakdown, ai_feedback, graded_at, published_at, updated_at),
        grading_history(
          id,
          action,
          actor_id,
          previous_score,
          next_score,
          previous_status,
          next_status,
          lecturer_feedback,
          rubric_breakdown,
          created_at
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
    // Compatibility wrapper for older callers. Authentication, assignment
    // ownership, validation, audit and notification all live in one workflow.
    void params.gradedBy; // Never trust a caller-supplied grader id.
    const breakdown = Array.isArray(params.breakdown) ? params.breakdown : [];
    return SupabaseGradingService.saveGrade({
      submissionId: params.submissionId,
      manualScore: params.score,
      criteria: breakdown.map((entry) => {
        const item = typeof entry === "object" && entry !== null
          ? entry as Record<string, unknown>
          : {};
        return {
          criterionCode: String(item.criterionCode ?? item.criterion_code ?? ""),
          awardedPoints: item.awardedPoints ?? item.score,
          feedback: item.feedback ?? item.note,
        };
      }),
      lecturerFeedback: params.teacherFeedback,
      publish: true,
    });
  }
}
