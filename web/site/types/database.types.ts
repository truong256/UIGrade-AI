// SPDX-License-Identifier: MIT
// Copyright (c) 2026 UIGrade AI contributors

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "student" | "lecturer" | "admin" | "pending";
export type UserStatus = "active" | "inactive" | "banned" | "pending";
export type ClassStatus = "active" | "archived" | "closed";
export type MemberStatus = "active" | "invited" | "pending" | "dropped";
export type AssignmentStatus = "draft" | "published" | "closed" | "archived";
export type SubmissionStatus = "draft" | "pending" | "grading" | "graded" | "error";
export type GradeLifecycleStatus = "draft" | "published";
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
          language: string;
          rubric_text: string | null;
          submission_policy: Json;
          runner_config: Json;
          ai_config: Json;
          attachments: Json;
          start_at: string;
          allow_resubmit: boolean;
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
          language?: string;
          rubric_text?: string | null;
          submission_policy?: Json;
          runner_config?: Json;
          ai_config?: Json;
          attachments?: Json;
          start_at?: string;
          allow_resubmit?: boolean;
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
          language?: string;
          rubric_text?: string | null;
          submission_policy?: Json;
          runner_config?: Json;
          ai_config?: Json;
          attachments?: Json;
          start_at?: string;
          allow_resubmit?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
          repository_url: string | null;
          files: Json;
          attempt_no: number;
          is_current: boolean;
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
          repository_url?: string | null;
          files?: Json;
          attempt_no?: number;
          is_current?: boolean;
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
          repository_url?: string | null;
          files?: Json;
          attempt_no?: number;
          is_current?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      grades: {
        Row: {
          id: string;
          submission_id: string;
          lecturer_id: string;
          score: number;
          max_score: number;
          status: GradeLifecycleStatus;
          feedback: string | null;
          rubric_breakdown: Json;
          ai_feedback: Json | null;
          graded_at: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          lecturer_id: string;
          score: number;
          max_score: number;
          status?: GradeLifecycleStatus;
          feedback?: string | null;
          rubric_breakdown?: Json;
          ai_feedback?: Json | null;
          graded_at?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          lecturer_id?: string;
          score?: number;
          max_score?: number;
          status?: GradeLifecycleStatus;
          feedback?: string | null;
          rubric_breakdown?: Json;
          ai_feedback?: Json | null;
          graded_at?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      grading_history: {
        Row: {
          id: string;
          grade_id: string;
          submission_id: string;
          actor_id: string | null;
          action: "GRADE_DRAFT_SAVED" | "GRADE_PUBLISHED" | "GRADE_UPDATED" | "GRADE_REPUBLISHED";
          previous_score: number | null;
          next_score: number | null;
          previous_status: string | null;
          next_status: GradeLifecycleStatus;
          lecturer_feedback: string | null;
          rubric_breakdown: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          grade_id: string;
          submission_id: string;
          actor_id?: string | null;
          action: "GRADE_DRAFT_SAVED" | "GRADE_PUBLISHED" | "GRADE_UPDATED" | "GRADE_REPUBLISHED";
          previous_score?: number | null;
          next_score?: number | null;
          previous_status?: string | null;
          next_status: GradeLifecycleStatus;
          lecturer_feedback?: string | null;
          rubric_breakdown?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          grade_id?: string;
          submission_id?: string;
          actor_id?: string | null;
          action?: "GRADE_DRAFT_SAVED" | "GRADE_PUBLISHED" | "GRADE_UPDATED" | "GRADE_REPUBLISHED";
          previous_score?: number | null;
          next_score?: number | null;
          previous_status?: string | null;
          next_status?: GradeLifecycleStatus;
          lecturer_feedback?: string | null;
          rubric_breakdown?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      rubrics: {
        Row: {
          id: string;
          assignment_id: string | null;
          owner_id: string | null;
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
          owner_id?: string | null;
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
          owner_id?: string | null;
          title?: string;
          description?: string | null;
          criteria?: Json;
          max_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      join_class_by_code: {
        Args: { input_code: string };
        Returns: Json;
      };
      save_student_submission: {
        Args: {
          input_assignment_id: string;
          input_content: string;
          input_repository_url: string;
          input_files: Json;
          input_action: "draft" | "submit";
          input_source_zip_url: string | null;
        };
        Returns: Json;
      };
    };
  };
}
