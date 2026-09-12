-- UIGrade AI Web: final Supabase-only runtime support.
-- Adds idempotent notification logging, missing FK indexes and removes legacy
-- overlapping policies left behind by older migration iterations.

CREATE TABLE IF NOT EXISTS public.email_notification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unique_key TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('new_assignment','deadline_before','deadline_due')),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    meta JSONB NOT NULL DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_notification_logs_assignment
    ON public.email_notification_logs(assignment_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_notification_logs_student
    ON public.email_notification_logs(student_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_grading_history_grade_id ON public.grading_history(grade_id);
CREATE INDEX IF NOT EXISTS idx_rubrics_owner_id ON public.rubrics(owner_id);
CREATE INDEX IF NOT EXISTS idx_submissions_graded_by ON public.submissions(graded_by);
CREATE INDEX IF NOT EXISTS idx_system_configs_updated_by ON public.system_configs(updated_by);

ALTER TABLE public.email_notification_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.email_notification_logs FROM anon;
GRANT SELECT, INSERT ON public.email_notification_logs TO authenticated;

DROP POLICY IF EXISTS "Admins can read email notification logs" ON public.email_notification_logs;
CREATE POLICY "Admins can read email notification logs"
ON public.email_notification_logs FOR SELECT TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can write email notification logs" ON public.email_notification_logs;
CREATE POLICY "Admins can write email notification logs"
ON public.email_notification_logs FOR INSERT TO authenticated
WITH CHECK (public.is_admin());

-- Remove superseded overlapping profile policies.
DROP POLICY IF EXISTS "Profiles viewable by self, classmates, or admin" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile including role" ON public.profiles;
DROP POLICY IF EXISTS "Admins can select any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
CREATE POLICY "Admins can select any profile"
ON public.profiles FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert profiles"
ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Replace the old ALL + SELECT overlap with explicit admin-only operations.
DROP POLICY IF EXISTS "Only admins can modify system configs" ON public.system_configs;
DROP POLICY IF EXISTS "Only admins can read system configs" ON public.system_configs;
DROP POLICY IF EXISTS "Admins can read system configs" ON public.system_configs;
DROP POLICY IF EXISTS "Admins can insert system configs" ON public.system_configs;
DROP POLICY IF EXISTS "Admins can update system configs" ON public.system_configs;
CREATE POLICY "Admins can read system configs"
ON public.system_configs FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Admins can insert system configs"
ON public.system_configs FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update system configs"
ON public.system_configs FOR UPDATE TO authenticated
USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Trigger helpers are not RPC endpoints.
ALTER FUNCTION public.update_updated_at_column() SET search_path = public, pg_temp;
ALTER FUNCTION public.current_user_role() SET search_path = public, pg_temp;
REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_last_admin_protection() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_self_role_escalation() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lock_assignment_grading_schema() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lock_submission_after_grading_starts() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_ai_grading_suggestion() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_published_ai_feedback() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.protect_submission_grading_columns() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.reject_legacy_grade_ai_feedback() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- RLS helper/RPC functions are callable only by authenticated users and
-- enforce auth.uid()/role/ownership inside the function body.
REVOKE ALL ON FUNCTION public.is_active_user() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_active_student() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_active_class_member(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.owns_class(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.can_read_class_members(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_lecturer() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_lecturer_or_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.join_class_by_code(TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_student_submission(UUID,TEXT,TEXT,JSONB,TEXT,TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_active_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_student() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_class_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_class(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_class_members(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_lecturer() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_lecturer_or_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_class_by_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_student_submission(UUID,TEXT,TEXT,JSONB,TEXT,TEXT) TO authenticated;

DROP POLICY IF EXISTS "Grade history visible to assignment lecturer and admin" ON public.grading_history;
CREATE POLICY "Grade history visible to assignment lecturer and admin"
ON public.grading_history FOR SELECT TO authenticated
USING (
    public.is_active_user()
    AND (
        public.is_admin()
        OR (
            public.is_lecturer()
            AND EXISTS (
                SELECT 1
                FROM public.submissions s
                JOIN public.assignments a ON a.id = s.assignment_id
                WHERE s.id = grading_history.submission_id
                  AND a.lecturer_id = auth.uid()
            )
        )
    )
);
