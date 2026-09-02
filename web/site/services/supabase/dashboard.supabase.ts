import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapSupabaseErrorToVietnamese } from "@/lib/supabase/errors";

export interface DashboardStats {
  classes_count: number;
  assignments_count: number;
  submissions_count: number;
  students_count: number;
  graded_count: number;
  pending_count: number;
  average_score: number;
  recent_submissions: any[];
  class_performance: any[];
}

export class SupabaseDashboardService {
  /**
   * Lấy thống kê tổng quan dashboard cho giảng viên hoặc sinh viên
   */
  static async getOverviewStats(userId: string, userRole: string): Promise<DashboardStats> {
    const supabase = await createSupabaseServerClient();

    try {
      if (userRole === "lecturer" || userRole === "teacher" || userRole === "admin") {
        // 1. Lớp học do giảng viên quản lý
        const { data: classes } = await (supabase as any)
          .from("classes")
          .select("id, name, class_code")
          .eq("lecturer_id", userId);

        const classIds = (classes || []).map((c: any) => c.id);

        // 2. Sinh viên trong các lớp
        const { count: studentCount } = await (supabase as any)
          .from("class_members")
          .select("student_id", { count: "exact", head: true })
          .in("class_id", classIds.length > 0 ? classIds : ["00000000-0000-0000-0000-000000000000"]);

        // 3. Bài tập
        const { data: assignments } = await (supabase as any)
          .from("assignments")
          .select("id, title, max_score, due_at")
          .eq("lecturer_id", userId);

        const assignmentIds = (assignments || []).map((a: any) => a.id);

        // 4. Bài nộp
        const { data: submissions } = await (supabase as any)
          .from("submissions")
          .select(`
            id,
            status,
            score,
            submitted_at,
            assignment:assignments!submissions_assignment_id_fkey(id, title, max_score),
            student:profiles!submissions_student_id_fkey(id, full_name, student_code, avatar_url)
          `)
          .in("assignment_id", assignmentIds.length > 0 ? assignmentIds : ["00000000-0000-0000-0000-000000000000"])
          .order("submitted_at", { ascending: false });

        const subsList = submissions || [];
        const gradedSubs = subsList.filter((s: any) => s.status === "graded");
        const pendingSubs = subsList.filter((s: any) => s.status === "pending" || s.status === "grading");
        const totalScores = gradedSubs.reduce((sum: number, s: any) => sum + (s.score !== null ? Number(s.score) : 0), 0);
        const avgScore = gradedSubs.length > 0 ? Number((totalScores / gradedSubs.length).toFixed(2)) : 0;

        return {
          classes_count: (classes || []).length,
          assignments_count: (assignments || []).length,
          submissions_count: subsList.length,
          students_count: studentCount || 0,
          graded_count: gradedSubs.length,
          pending_count: pendingSubs.length,
          average_score: avgScore,
          recent_submissions: subsList.slice(0, 10).map((s: any) => ({
            id: s.id,
            title: s.assignment?.title || "Bài tập",
            studentName: s.student?.full_name || "Sinh viên",
            studentCode: s.student?.student_code || "",
            avatar: s.student?.avatar_url,
            submittedAt: s.submitted_at,
            status: s.status,
            score: s.score,
            maxScore: s.assignment?.max_score || 10,
          })),
          class_performance: (classes || []).map((c: any) => ({
            classId: c.id,
            className: c.name,
            classCode: c.class_code,
            averageScore: avgScore,
          })),
        };
      } else {
        // Sinh viên xem thống kê cá nhân
        const { data: memberships } = await (supabase as any)
          .from("class_members")
          .select("class_id")
          .eq("student_id", userId);

        const classIds = (memberships || []).map((m: any) => m.class_id);

        const { data: submissions } = await (supabase as any)
          .from("submissions")
          .select(`
            id,
            status,
            score,
            submitted_at,
            assignment:assignments!submissions_assignment_id_fkey(id, title, max_score, due_at)
          `)
          .eq("student_id", userId)
          .order("submitted_at", { ascending: false });

        const subsList = submissions || [];
        const gradedSubs = subsList.filter((s: any) => s.status === "graded");
        const totalScores = gradedSubs.reduce((sum: number, s: any) => sum + (s.score !== null ? Number(s.score) : 0), 0);
        const avgScore = gradedSubs.length > 0 ? Number((totalScores / gradedSubs.length).toFixed(2)) : 0;

        return {
          classes_count: classIds.length,
          assignments_count: subsList.length,
          submissions_count: subsList.length,
          students_count: 1,
          graded_count: gradedSubs.length,
          pending_count: subsList.filter((s: any) => s.status === "pending" || s.status === "grading").length,
          average_score: avgScore,
          recent_submissions: subsList.slice(0, 10).map((s: any) => ({
            id: s.id,
            title: s.assignment?.title || "Bài tập",
            studentName: "Bạn",
            studentCode: "",
            submittedAt: s.submitted_at,
            status: s.status,
            score: s.score,
            maxScore: s.assignment?.max_score || 10,
          })),
          class_performance: [],
        };
      }
    } catch (error) {
      throw new Error(mapSupabaseErrorToVietnamese(error));
    }
  }
}
