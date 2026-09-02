export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "student" | "lecturer" | "teacher" | "admin";
export type UserStatus = "active" | "inactive" | "banned" | "pending";
export type ClassStatus = "active" | "archived" | "closed";
export type MemberStatus = "active" | "invited" | "pending" | "dropped";
export type AssignmentStatus = "draft" | "published" | "closed" | "archived";
export type SubmissionStatus = "pending" | "grading" | "graded" | "error";
export type NotificationType = "assignment" | "grade" | "class" | "system" | "reminder";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          avatar_url: string | null;
          role: UserRole;
          status: UserStatus;
          phone: string | null;
          student_code: string | null;
          department: string | null;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email: string;
          avatar_url?: string | null;
          role?: UserRole;
          status?: UserStatus;
          phone?: string | null;
          student_code?: string | null;
          department?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          avatar_url?: string | null;
          role?: UserRole;
          status?: UserStatus;
          phone?: string | null;
          student_code?: string | null;
          department?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      classes: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          class_code: string;
          lecturer_id: string;
          semester: string | null;
          academic_year: string | null;
          subject_code: string | null;
          status: ClassStatus;
          cover_color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          class_code: string;
          lecturer_id: string;
          semester?: string | null;
          academic_year?: string | null;
          subject_code?: string | null;
          status?: ClassStatus;
          cover_color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          class_code?: string;
          lecturer_id?: string;
          semester?: string | null;
          academic_year?: string | null;
          subject_code?: string | null;
          status?: ClassStatus;
          cover_color?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      class_members: {
        Row: {
          id: string;
          class_id: string;
          student_id: string;
          status: MemberStatus;
          joined_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          student_id: string;
          status?: MemberStatus;
          joined_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          student_id?: string;
          status?: MemberStatus;
          joined_at?: string;
          updated_at?: string;
        };
      };
      assignments: {
        Row: {
          id: string;
          class_id: string;
          lecturer_id: string;
          title: string;
          description: string | null;
          instructions: string | null;
          due_at: string;
          max_score: number;
          weight: number | null;
          status: AssignmentStatus;
          attachment_url: string | null;
          target_apk_url: string | null;
          baseline_ui_url: string | null;
          test_scenarios: Json;
          rubric: Json;
          is_active: boolean;
          allow_late_submission: boolean;
          late_penalty_percent: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          lecturer_id: string;
          title: string;
          description?: string | null;
          instructions?: string | null;
          due_at: string;
          max_score?: number;
          weight?: number | null;
          status?: AssignmentStatus;
          attachment_url?: string | null;
          target_apk_url?: string | null;
          baseline_ui_url?: string | null;
          test_scenarios?: Json;
          rubric?: Json;
          is_active?: boolean;
          allow_late_submission?: boolean;
          late_penalty_percent?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          lecturer_id?: string;
          title?: string;
          description?: string | null;
          instructions?: string | null;
          due_at?: string;
          max_score?: number;
          weight?: number | null;
          status?: AssignmentStatus;
          attachment_url?: string | null;
          target_apk_url?: string | null;
          baseline_ui_url?: string | null;
          test_scenarios?: Json;
          rubric?: Json;
          is_active?: boolean;
          allow_late_submission?: boolean;
          late_penalty_percent?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      submissions: {
        Row: {
          id: string;
          assignment_id: string;
          student_id: string;
          content: string | null;
          file_url: string | null;
          apk_file_url: string | null;
          apk_filename: string | null;
          apk_size_bytes: number | null;
          source_zip_url: string | null;
          screenshot_urls: Json;
          submitted_at: string;
          status: SubmissionStatus;
          is_late: boolean;
          score: number | null;
          ai_suggested_score: number | null;
          ai_feedback: string | null;
          teacher_feedback: string | null;
          graded_at: string | null;
          graded_by: string | null;
          breakdown: Json;
          execution_logs: string | null;
          test_results: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          student_id: string;
          content?: string | null;
          file_url?: string | null;
          apk_file_url?: string | null;
          apk_filename?: string | null;
          apk_size_bytes?: number | null;
          source_zip_url?: string | null;
          screenshot_urls?: Json;
          submitted_at?: string;
          status?: SubmissionStatus;
          is_late?: boolean;
          score?: number | null;
          ai_suggested_score?: number | null;
          ai_feedback?: string | null;
          teacher_feedback?: string | null;
          graded_at?: string | null;
          graded_by?: string | null;
          breakdown?: Json;
          execution_logs?: string | null;
          test_results?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          assignment_id?: string;
          student_id?: string;
          content?: string | null;
          file_url?: string | null;
          apk_file_url?: string | null;
          apk_filename?: string | null;
          apk_size_bytes?: number | null;
          source_zip_url?: string | null;
          screenshot_urls?: Json;
          submitted_at?: string;
          status?: SubmissionStatus;
          is_late?: boolean;
          score?: number | null;
          ai_suggested_score?: number | null;
          ai_feedback?: string | null;
          teacher_feedback?: string | null;
          graded_at?: string | null;
          graded_by?: string | null;
          breakdown?: Json;
          execution_logs?: string | null;
          test_results?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      grades: {
        Row: {
          id: string;
          submission_id: string;
          lecturer_id: string;
          score: number;
          feedback: string | null;
          rubric_breakdown: Json;
          graded_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          lecturer_id: string;
          score: number;
          feedback?: string | null;
          rubric_breakdown?: Json;
          graded_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          lecturer_id?: string;
          score?: number;
          feedback?: string | null;
          rubric_breakdown?: Json;
          graded_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      rubrics: {
        Row: {
          id: string;
          assignment_id: string | null;
          title: string;
          description: string | null;
          criteria: Json;
          max_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          assignment_id?: string | null;
          title: string;
          description?: string | null;
          criteria?: Json;
          max_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          assignment_id?: string | null;
          title?: string;
          description?: string | null;
          criteria?: Json;
          max_score?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: NotificationType;
          is_read: boolean;
          link: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type?: NotificationType;
          is_read?: boolean;
          link?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: NotificationType;
          is_read?: boolean;
          link?: string | null;
          created_at?: string;
        };
      };
      system_configs: {
        Row: {
          id: string;
          key: string;
          value: Json;
          description: string | null;
          updated_by: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          value: Json;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          key?: string;
          value?: Json;
          description?: string | null;
          updated_by?: string | null;
          updated_at?: string;
        };
      };
    };
  };
}
