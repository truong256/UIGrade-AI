-- ====================================================================
-- Complete the Supabase-backed Web MVP without deleting application data.
-- ====================================================================

-- Canonicalize the one legacy production role before tightening the check.
UPDATE public.profiles SET role = 'lecturer' WHERE role = 'teacher';
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('student', 'lecturer', 'admin', 'pending'));

DROP POLICY IF EXISTS "Users can update own profile or complete onboarding" ON public.profiles;
CREATE POLICY "Users can update own profile or complete onboarding"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role IN ('student', 'lecturer', 'pending'));

-- Fields used by the existing Web assignment editor. JSON keeps runner and AI
-- configuration extensible while the relational ownership remains authoritative.
ALTER TABLE public.assignments
    ADD COLUMN IF NOT EXISTS language TEXT NOT NULL DEFAULT 'kotlin',
    ADD COLUMN IF NOT EXISTS rubric_text TEXT,
    ADD COLUMN IF NOT EXISTS submission_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS runner_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS ai_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS start_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS allow_resubmit BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.submissions
    ADD COLUMN IF NOT EXISTS repository_url TEXT,
    ADD COLUMN IF NOT EXISTS files JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS attempt_no INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS is_current BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE public.submissions DROP CONSTRAINT IF EXISTS submissions_status_check;
ALTER TABLE public.submissions
    ADD CONSTRAINT submissions_status_check
    CHECK (status IN ('draft', 'pending', 'grading', 'graded', 'error'));

-- Preserve every legacy submission, but designate only the newest as current.
WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (
        PARTITION BY assignment_id, student_id
        ORDER BY submitted_at DESC, created_at DESC, id DESC
    ) AS position
    FROM public.submissions
)
UPDATE public.submissions s
SET is_current = (ranked.position = 1)
FROM ranked
WHERE ranked.id = s.id;

CREATE UNIQUE INDEX IF NOT EXISTS submissions_one_current_per_student_assignment
ON public.submissions (assignment_id, student_id)
WHERE is_current;

-- Student writes may retain the explicit draft state, but never grading fields.
CREATE OR REPLACE FUNCTION public.protect_submission_grading_columns()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    jwt_role TEXT;
    actor_role TEXT;
    assignment_due TIMESTAMPTZ;
    assignment_allows_late BOOLEAN;
    assignment_active BOOLEAN;
BEGIN
    jwt_role := COALESCE(auth.jwt()->>'role', current_setting('request.jwt.claim.role', true));
    IF jwt_role IS DISTINCT FROM 'service_role' THEN
        SELECT role INTO actor_role FROM public.profiles
        WHERE id = auth.uid() AND status = 'active';

        IF actor_role = 'student' THEN
            IF NEW.student_id IS DISTINCT FROM auth.uid() THEN
                RAISE EXCEPTION 'Students can only submit their own work';
            END IF;
            IF TG_OP = 'UPDATE' AND (
                NEW.assignment_id IS DISTINCT FROM OLD.assignment_id
                OR NEW.student_id IS DISTINCT FROM OLD.student_id
                OR NEW.is_current IS DISTINCT FROM OLD.is_current
            ) THEN
                RAISE EXCEPTION 'Submission ownership cannot be changed';
            END IF;

            SELECT due_at, allow_late_submission, is_active
            INTO assignment_due, assignment_allows_late, assignment_active
            FROM public.assignments WHERE id = NEW.assignment_id;

            IF assignment_due IS NULL THEN RAISE EXCEPTION 'Assignment does not exist'; END IF;
            IF assignment_active IS NOT TRUE THEN RAISE EXCEPTION 'Assignment is not active'; END IF;
            IF NOW() > assignment_due AND assignment_allows_late IS NOT TRUE THEN
                RAISE EXCEPTION 'Late submissions are not allowed';
            END IF;

            NEW.submitted_at := NOW();
            NEW.is_late := NOW() > assignment_due;
            NEW.status := CASE WHEN NEW.status = 'draft' THEN 'draft' ELSE 'pending' END;
        END IF;

        IF TG_OP = 'UPDATE' THEN
            NEW.score := NULL;
            NEW.ai_suggested_score := NULL;
            NEW.ai_feedback := NULL;
            NEW.teacher_feedback := NULL;
            NEW.graded_at := NULL;
            NEW.graded_by := NULL;
            NEW.breakdown := '[]'::jsonb;
        ELSIF NEW.score IS NOT NULL
           OR NEW.ai_suggested_score IS NOT NULL
           OR NEW.ai_feedback IS NOT NULL
           OR NEW.teacher_feedback IS NOT NULL
           OR NEW.graded_at IS NOT NULL
           OR NEW.graded_by IS NOT NULL
           OR COALESCE(NEW.breakdown, '[]'::jsonb) <> '[]'::jsonb THEN
            RAISE EXCEPTION 'Submission grading fields are server-managed';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Authorized users can view related submissions" ON public.submissions;
CREATE POLICY "Authorized users can view related submissions"
ON public.submissions FOR SELECT TO authenticated
USING (
    public.is_active_user() AND (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.assignments a
            WHERE a.id = submissions.assignment_id
              AND a.lecturer_id = auth.uid()
              AND public.is_lecturer()
              AND submissions.status <> 'draft'
        )
        OR EXISTS (
            SELECT 1 FROM public.assignments a
            JOIN public.class_members cm ON cm.class_id = a.class_id
            WHERE a.id = submissions.assignment_id
              AND submissions.student_id = auth.uid()
              AND cm.student_id = auth.uid()
              AND cm.status = 'active'
              AND public.is_active_student()
        )
    )
);

DROP POLICY IF EXISTS "Active students can update own pending submissions" ON public.submissions;
CREATE POLICY "Active students can update own editable submissions"
ON public.submissions FOR UPDATE TO authenticated
USING (
    public.is_active_student() AND student_id = auth.uid()
    AND status IN ('draft', 'pending', 'error')
    AND EXISTS (
        SELECT 1 FROM public.assignments a
        JOIN public.class_members cm ON cm.class_id = a.class_id
        WHERE a.id = submissions.assignment_id
          AND cm.student_id = auth.uid() AND cm.status = 'active'
    )
)
WITH CHECK (
    public.is_active_student() AND student_id = auth.uid()
    AND status IN ('draft', 'pending', 'error')
    AND EXISTS (
        SELECT 1 FROM public.assignments a
        JOIN public.class_members cm ON cm.class_id = a.class_id
        WHERE a.id = submissions.assignment_id
          AND a.status = 'published' AND a.is_active = TRUE
          AND cm.student_id = auth.uid() AND cm.status = 'active'
    )
);

-- One transaction is the concurrency boundary for draft/save/resubmit. The
-- actor is always auth.uid(); no caller-supplied student id is accepted.
CREATE OR REPLACE FUNCTION public.save_student_submission(
    input_assignment_id UUID,
    input_content TEXT,
    input_repository_url TEXT,
    input_files JSONB,
    input_action TEXT,
    input_source_zip_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    target_assignment public.assignments%ROWTYPE;
    current_submission public.submissions%ROWTYPE;
    saved_submission public.submissions%ROWTYPE;
    requested_status TEXT;
BEGIN
    IF NOT public.is_active_student() THEN
        RAISE EXCEPTION 'Only an active student can submit work';
    END IF;
    IF input_action NOT IN ('draft', 'submit') THEN
        RAISE EXCEPTION 'Invalid submission action';
    END IF;

    SELECT a.* INTO target_assignment
    FROM public.assignments a
    JOIN public.classes c ON c.id = a.class_id
    JOIN public.class_members cm ON cm.class_id = a.class_id
    WHERE a.id = input_assignment_id
      AND a.status = 'published' AND a.is_active = TRUE
      AND c.status = 'active'
      AND cm.student_id = auth.uid() AND cm.status = 'active'
    FOR UPDATE OF a;

    IF NOT FOUND THEN RAISE EXCEPTION 'Assignment is unavailable'; END IF;
    IF NOW() > target_assignment.due_at AND target_assignment.allow_late_submission IS NOT TRUE THEN
        RAISE EXCEPTION 'Late submissions are not allowed';
    END IF;

    SELECT s.* INTO current_submission
    FROM public.submissions s
    WHERE s.assignment_id = input_assignment_id
      AND s.student_id = auth.uid() AND s.is_current
    FOR UPDATE;

    IF FOUND AND current_submission.status <> 'draft'
       AND target_assignment.allow_resubmit IS NOT TRUE THEN
        RAISE EXCEPTION 'Resubmission is not allowed';
    END IF;
    IF FOUND AND EXISTS (
        SELECT 1 FROM public.grades g
        WHERE g.submission_id = current_submission.id AND g.status = 'published'
    ) THEN
        RAISE EXCEPTION 'A published grade locks this submission';
    END IF;

    requested_status := CASE WHEN input_action = 'draft' THEN 'draft' ELSE 'pending' END;

    IF FOUND THEN
        UPDATE public.submissions
        SET content = NULLIF(BTRIM(COALESCE(input_content, '')), ''),
            repository_url = NULLIF(BTRIM(COALESCE(input_repository_url, '')), ''),
            files = COALESCE(input_files, '[]'::jsonb),
            source_zip_url = input_source_zip_url,
            status = requested_status,
            attempt_no = CASE WHEN input_action = 'submit' THEN attempt_no + 1 ELSE attempt_no END
        WHERE id = current_submission.id
        RETURNING * INTO saved_submission;
    ELSE
        INSERT INTO public.submissions (
            assignment_id, student_id, content, repository_url, files,
            source_zip_url, status, attempt_no, is_current
        ) VALUES (
            input_assignment_id, auth.uid(), NULLIF(BTRIM(COALESCE(input_content, '')), ''),
            NULLIF(BTRIM(COALESCE(input_repository_url, '')), ''),
            COALESCE(input_files, '[]'::jsonb), input_source_zip_url,
            requested_status, 1, TRUE
        ) RETURNING * INTO saved_submission;
    END IF;

    RETURN to_jsonb(saved_submission);
END;
$$;

REVOKE ALL ON FUNCTION public.save_student_submission(UUID, TEXT, TEXT, JSONB, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_student_submission(UUID, TEXT, TEXT, JSONB, TEXT, TEXT) TO authenticated;

-- Submission objects are private and scoped to student/assignment paths.
UPDATE storage.buckets SET public = FALSE WHERE id = 'submissions';
DROP POLICY IF EXISTS "Students can upload submissions to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Students can read their own submission files, teachers can read all submissions" ON storage.objects;
DROP POLICY IF EXISTS "Students can delete/replace their own submission files before grading" ON storage.objects;
DROP POLICY IF EXISTS "Submission files visible to owner and assignment lecturer" ON storage.objects;

CREATE POLICY "Students upload submission files for active assignments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'submissions'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
    AND public.is_active_student()
    AND EXISTS (
        SELECT 1 FROM public.assignments a
        JOIN public.class_members cm ON cm.class_id = a.class_id
        WHERE a.id::TEXT = (storage.foldername(name))[2]
          AND a.status = 'published' AND a.is_active = TRUE
          AND cm.student_id = auth.uid() AND cm.status = 'active'
    )
);

CREATE POLICY "Authorized users read related submission files"
ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id = 'submissions' AND public.is_active_user() AND (
        (
            (storage.foldername(name))[1] = auth.uid()::TEXT
            AND EXISTS (
                SELECT 1 FROM public.submissions s
                JOIN public.assignments a ON a.id = s.assignment_id
                JOIN public.class_members cm ON cm.class_id = a.class_id
                WHERE s.student_id = auth.uid()
                  AND cm.student_id = auth.uid() AND cm.status = 'active'
                  AND s.files @> jsonb_build_array(jsonb_build_object('path', storage.objects.name))
            )
        )
        OR public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.assignments a
            WHERE a.id::TEXT = (storage.foldername(name))[2]
              AND a.lecturer_id = auth.uid() AND public.is_lecturer()
        )
    )
);

CREATE POLICY "Students replace own submission files"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'submissions'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
    AND public.is_active_student()
    AND EXISTS (
        SELECT 1 FROM public.submissions s
        WHERE s.student_id = auth.uid()
          AND s.status IN ('draft', 'pending', 'error')
          AND s.files @> jsonb_build_array(jsonb_build_object('path', storage.objects.name))
    )
);
