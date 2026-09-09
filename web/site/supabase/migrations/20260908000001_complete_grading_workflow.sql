-- ====================================================================
-- Complete grading workflow: draft -> publish, validation, audit and RLS
--
-- SAFETY:
--   * No application rows or tables are dropped.
--   * Existing grades are treated as already published.
--   * Draft grading data lives only in public.grades, never in submissions.
-- ====================================================================

ALTER TABLE public.grades
    ADD COLUMN IF NOT EXISTS max_score NUMERIC,
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS ai_feedback JSONB;

-- Drafts do not have an official grading timestamp. Relax the legacy NOT NULL
-- before importing any in-progress values from submissions.
ALTER TABLE public.grades
    ALTER COLUMN graded_at DROP NOT NULL;

ALTER TABLE public.rubrics
    ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Earlier role helpers predated account suspension checks. Recreate them here so
-- every grading policy rejects pending, banned, or otherwise inactive accounts.
CREATE OR REPLACE FUNCTION public.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_active_student()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'student' AND status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_lecturer()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('lecturer', 'teacher')
          AND status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_lecturer_or_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('lecturer', 'teacher', 'admin')
          AND status = 'active'
    );
$$;

REVOKE ALL ON FUNCTION public.is_active_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_active_student() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_lecturer() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_lecturer_or_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_active_student() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_lecturer() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_lecturer_or_admin() TO authenticated;

UPDATE public.rubrics r
SET owner_id = a.lecturer_id
FROM public.assignments a
WHERE a.id = r.assignment_id AND r.owner_id IS NULL;

UPDATE public.grades g
SET max_score = a.max_score,
    published_at = COALESCE(g.published_at, g.graded_at),
    status = 'published'
FROM public.submissions s
JOIN public.assignments a ON a.id = s.assignment_id
WHERE g.submission_id = s.id
  AND (g.max_score IS NULL OR g.published_at IS NULL);

-- Preserve results written by the former submission-level grading code before
-- retiring those columns. They are copied into the canonical grades table first.
INSERT INTO public.grades (
    submission_id, lecturer_id, score, feedback, rubric_breakdown,
    graded_at, max_score, status, published_at, ai_feedback
)
SELECT
    s.id,
    COALESCE(s.graded_by, a.lecturer_id),
    LEAST(GREATEST(COALESCE(s.score, 0), 0), a.max_score),
    s.teacher_feedback,
    CASE WHEN jsonb_typeof(s.breakdown) = 'array' THEN s.breakdown ELSE '[]'::jsonb END,
    CASE WHEN s.status = 'graded' AND s.score IS NOT NULL
        THEN COALESCE(s.graded_at, s.updated_at, NOW()) ELSE NULL END,
    a.max_score,
    CASE WHEN s.status = 'graded' AND s.score IS NOT NULL
        THEN 'published' ELSE 'draft' END,
    CASE WHEN s.status = 'graded' AND s.score IS NOT NULL
        THEN COALESCE(s.graded_at, s.updated_at, NOW()) ELSE NULL END,
    CASE
        WHEN NULLIF(BTRIM(COALESCE(s.ai_feedback, '')), '') IS NOT NULL
             OR s.ai_suggested_score IS NOT NULL
        THEN jsonb_build_object(
            'summary', COALESCE(s.ai_feedback, ''),
            'legacySuggestedScore', s.ai_suggested_score
        )
        ELSE NULL
    END
FROM public.submissions s
JOIN public.assignments a ON a.id = s.assignment_id
WHERE (
      s.score IS NOT NULL
      OR s.ai_suggested_score IS NOT NULL
      OR NULLIF(BTRIM(COALESCE(s.ai_feedback, '')), '') IS NOT NULL
      OR NULLIF(BTRIM(COALESCE(s.teacher_feedback, '')), '') IS NOT NULL
      OR COALESCE(s.breakdown, '[]'::jsonb) <> '[]'::jsonb
  )
  AND NOT EXISTS (
      SELECT 1 FROM public.grades g WHERE g.submission_id = s.id
  );

UPDATE public.grades g
SET feedback = COALESCE(NULLIF(g.feedback, ''), s.teacher_feedback),
    rubric_breakdown = CASE
        WHEN COALESCE(g.rubric_breakdown, '[]'::jsonb) = '[]'::jsonb
             AND jsonb_typeof(s.breakdown) = 'array'
        THEN s.breakdown
        ELSE COALESCE(g.rubric_breakdown, '[]'::jsonb)
    END,
    ai_feedback = COALESCE(
        g.ai_feedback,
        CASE
            WHEN NULLIF(BTRIM(COALESCE(s.ai_feedback, '')), '') IS NOT NULL
                 OR s.ai_suggested_score IS NOT NULL
            THEN jsonb_build_object(
                'summary', COALESCE(s.ai_feedback, ''),
                'legacySuggestedScore', s.ai_suggested_score
            )
            ELSE NULL
        END
    )
FROM public.submissions s
WHERE s.id = g.submission_id;

-- The old columns cannot be protected per column with RLS because every signed-in
-- user shares the `authenticated` database role. Clear them only after copying
-- their value above; canonical grading data now lives exclusively in grades.
UPDATE public.submissions
SET score = NULL,
    ai_suggested_score = NULL,
    ai_feedback = NULL,
    teacher_feedback = NULL,
    graded_at = NULL,
    graded_by = NULL,
    breakdown = '[]'::jsonb;

ALTER TABLE public.grades
    ALTER COLUMN max_score SET NOT NULL,
    ALTER COLUMN status SET DEFAULT 'draft',
    DROP CONSTRAINT IF EXISTS grades_status_check,
    DROP CONSTRAINT IF EXISTS grades_score_within_max_check;

ALTER TABLE public.grades
    ADD CONSTRAINT grades_status_check CHECK (status IN ('draft', 'published')),
    ADD CONSTRAINT grades_score_within_max_check
        CHECK (score >= 0 AND max_score > 0 AND score <= max_score);

-- One current grading record per submission. The history table below preserves
-- every important mutation and prevents a double-click from creating duplicates.
CREATE UNIQUE INDEX IF NOT EXISTS grades_one_result_per_submission
    ON public.grades(submission_id);
CREATE INDEX IF NOT EXISTS idx_grades_status ON public.grades(status);
CREATE INDEX IF NOT EXISTS idx_grades_published_at ON public.grades(published_at);

CREATE TABLE IF NOT EXISTS public.grading_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade_id UUID NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
    submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (
        action IN ('GRADE_DRAFT_SAVED', 'GRADE_PUBLISHED', 'GRADE_UPDATED', 'GRADE_REPUBLISHED')
    ),
    previous_score NUMERIC,
    next_score NUMERIC,
    previous_status TEXT,
    next_status TEXT NOT NULL,
    lecturer_feedback TEXT,
    rubric_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_grading_history_submission
    ON public.grading_history(submission_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_grading_history_actor
    ON public.grading_history(actor_id, created_at DESC);

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grading_history ENABLE ROW LEVEL SECURITY;

-- Validate authorization and scores using authoritative assignment data. Client
-- supplied max scores/titles are ignored and replaced with canonical values.
CREATE OR REPLACE FUNCTION public.validate_grade_write()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    assignment_row public.assignments%ROWTYPE;
    actor_role TEXT;
    jwt_role TEXT;
    rubric JSONB;
    entry JSONB;
    rubric_entry JSONB;
    canonical_breakdown JSONB := '[]'::jsonb;
    submitted_codes TEXT[] := ARRAY[]::TEXT[];
    criterion_code TEXT;
    criterion_title TEXT;
    score_text TEXT;
    criterion_score NUMERIC;
    criterion_max NUMERIC;
    calculated_total NUMERIC := 0;
    rubric_count INTEGER := 0;
BEGIN
    IF TG_OP = 'UPDATE' AND NEW.submission_id IS DISTINCT FROM OLD.submission_id THEN
        RAISE EXCEPTION 'A grade cannot be moved to another submission';
    END IF;
    IF TG_OP = 'UPDATE' AND OLD.status = 'published' AND NEW.status = 'draft' THEN
        RAISE EXCEPTION 'A published grade cannot be changed back to draft';
    END IF;

    SELECT a.* INTO assignment_row
    FROM public.submissions s
    JOIN public.assignments a ON a.id = s.assignment_id
    WHERE s.id = NEW.submission_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Submission does not exist';
    END IF;

    jwt_role := COALESCE(auth.jwt()->>'role', current_setting('request.jwt.claim.role', true));
    SELECT role INTO actor_role
    FROM public.profiles
    WHERE id = auth.uid() AND status = 'active';

    IF jwt_role IS DISTINCT FROM 'service_role' THEN
        IF auth.uid() IS NULL OR actor_role NOT IN ('lecturer', 'teacher') THEN
            RAISE EXCEPTION 'Only an active lecturer can grade submissions';
        END IF;
        IF assignment_row.lecturer_id IS DISTINCT FROM auth.uid() THEN
            RAISE EXCEPTION 'Lecturer does not own this assignment';
        END IF;
        NEW.lecturer_id := auth.uid();
    END IF;

    IF NEW.status NOT IN ('draft', 'published') THEN
        RAISE EXCEPTION 'Invalid grade status';
    END IF;

    NEW.max_score := assignment_row.max_score;
    rubric := COALESCE(assignment_row.rubric, '[]'::jsonb);
    IF jsonb_typeof(rubric) IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Assignment rubric must be a JSON array';
    END IF;
    IF jsonb_typeof(COALESCE(NEW.rubric_breakdown, '[]'::jsonb)) IS DISTINCT FROM 'array' THEN
        RAISE EXCEPTION 'Rubric breakdown must be a JSON array';
    END IF;

    rubric_count := jsonb_array_length(rubric);
    FOR entry IN SELECT value FROM jsonb_array_elements(COALESCE(NEW.rubric_breakdown, '[]'::jsonb))
    LOOP
        criterion_code := BTRIM(COALESCE(entry->>'criterionCode', entry->>'criterion_code', ''));
        IF criterion_code = '' THEN
            RAISE EXCEPTION 'Rubric criterion code is required';
        END IF;
        IF criterion_code = ANY(submitted_codes) THEN
            RAISE EXCEPTION 'Duplicate rubric criterion: %', criterion_code;
        END IF;

        SELECT value INTO rubric_entry
        FROM jsonb_array_elements(rubric)
        WHERE COALESCE(value->>'code', value->>'id') = criterion_code
        LIMIT 1;
        IF rubric_entry IS NULL THEN
            RAISE EXCEPTION 'Criterion % is not part of this assignment rubric', criterion_code;
        END IF;

        score_text := COALESCE(entry->>'awardedPoints', entry->>'score');
        IF score_text IS NULL OR score_text !~ '^-?[0-9]+([.][0-9]+)?$' THEN
            RAISE EXCEPTION 'Invalid score for criterion %', criterion_code;
        END IF;
        criterion_score := score_text::NUMERIC;
        criterion_max := COALESCE(
            NULLIF(rubric_entry->>'maxPoints', '')::NUMERIC,
            NULLIF(rubric_entry->>'maxScore', '')::NUMERIC
        );
        criterion_title := COALESCE(
            NULLIF(rubric_entry->>'title', ''),
            NULLIF(rubric_entry->>'name', ''),
            criterion_code
        );

        IF criterion_max IS NULL OR criterion_max <= 0 THEN
            RAISE EXCEPTION 'Invalid maximum score for criterion %', criterion_code;
        END IF;
        IF criterion_score < 0 OR criterion_score > criterion_max THEN
            RAISE EXCEPTION 'Score for criterion % must be between 0 and %', criterion_code, criterion_max;
        END IF;

        submitted_codes := array_append(submitted_codes, criterion_code);
        calculated_total := calculated_total + criterion_score;
        canonical_breakdown := canonical_breakdown || jsonb_build_array(jsonb_build_object(
            'criterionCode', criterion_code,
            'title', criterion_title,
            'gradingSource', 'manual',
            'awardedPoints', criterion_score,
            'maxPoints', criterion_max,
            'feedback', LEFT(COALESCE(entry->>'feedback', entry->>'note', ''), 2000)
        ));
        rubric_entry := NULL;
    END LOOP;

    IF rubric_count > 0 THEN
        IF NEW.status = 'published' AND cardinality(submitted_codes) <> rubric_count THEN
            RAISE EXCEPTION 'Every rubric criterion requires a score before publishing';
        END IF;
        NEW.score := calculated_total;
        NEW.rubric_breakdown := canonical_breakdown;
    ELSE
        NEW.rubric_breakdown := '[]'::jsonb;
    END IF;

    IF NEW.score IS NULL OR NEW.score < 0 OR NEW.score > NEW.max_score THEN
        RAISE EXCEPTION 'Total score must be between 0 and %', NEW.max_score;
    END IF;
    NEW.feedback := LEFT(COALESCE(NEW.feedback, ''), 5000);

    IF NEW.status = 'published' THEN
        IF TG_OP = 'UPDATE'
           AND OLD.status = 'published'
           AND OLD.score IS NOT DISTINCT FROM NEW.score
           AND OLD.feedback IS NOT DISTINCT FROM NEW.feedback
           AND OLD.rubric_breakdown IS NOT DISTINCT FROM NEW.rubric_breakdown THEN
            NEW.graded_at := OLD.graded_at;
            NEW.published_at := OLD.published_at;
        ELSE
            NEW.graded_at := NOW();
            NEW.published_at := NOW();
        END IF;
    ELSE
        NEW.graded_at := NULL;
        NEW.published_at := NULL;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_grade_write ON public.grades;
CREATE TRIGGER trg_validate_grade_write
BEFORE INSERT OR UPDATE ON public.grades
FOR EACH ROW EXECUTE FUNCTION public.validate_grade_write();

CREATE OR REPLACE FUNCTION public.audit_grade_write()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    audit_action TEXT;
BEGIN
    IF TG_OP = 'UPDATE'
       AND OLD.status IS NOT DISTINCT FROM NEW.status
       AND OLD.score IS NOT DISTINCT FROM NEW.score
       AND OLD.feedback IS NOT DISTINCT FROM NEW.feedback
       AND OLD.rubric_breakdown IS NOT DISTINCT FROM NEW.rubric_breakdown THEN
        RETURN NEW;
    END IF;

    audit_action := CASE
        WHEN NEW.status = 'draft' THEN 'GRADE_DRAFT_SAVED'
        WHEN TG_OP = 'INSERT' AND NEW.status = 'published' THEN 'GRADE_PUBLISHED'
        WHEN OLD.status = 'published' AND NEW.status = 'published' THEN 'GRADE_REPUBLISHED'
        WHEN NEW.status = 'published' THEN 'GRADE_PUBLISHED'
        ELSE 'GRADE_UPDATED'
    END;

    INSERT INTO public.grading_history (
        grade_id, submission_id, actor_id, action,
        previous_score, next_score, previous_status, next_status,
        lecturer_feedback, rubric_breakdown
    ) VALUES (
        NEW.id, NEW.submission_id, auth.uid(), audit_action,
        CASE WHEN TG_OP = 'UPDATE' THEN OLD.score ELSE NULL END,
        NEW.score,
        CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
        NEW.status,
        NEW.feedback,
        NEW.rubric_breakdown
    );

    UPDATE public.submissions
    SET status = CASE WHEN NEW.status = 'published' THEN 'graded' ELSE 'grading' END,
        updated_at = NOW()
    WHERE id = NEW.submission_id;

    IF NEW.status = 'published'
       AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'published'
            OR OLD.score IS DISTINCT FROM NEW.score
            OR OLD.feedback IS DISTINCT FROM NEW.feedback
            OR OLD.rubric_breakdown IS DISTINCT FROM NEW.rubric_breakdown) THEN
        INSERT INTO public.notifications (user_id, title, message, type, link)
        SELECT s.student_id,
               'Bài tập đã được chấm',
               'Kết quả bài tập "' || a.title || '" đã được công bố.',
               'grade',
               '/ui/my_results?submissionId=' || s.id::TEXT
        FROM public.submissions s
        JOIN public.assignments a ON a.id = s.assignment_id
        WHERE s.id = NEW.submission_id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_grade_write ON public.grades;
CREATE TRIGGER trg_audit_grade_write
AFTER INSERT OR UPDATE ON public.grades
FOR EACH ROW EXECUTE FUNCTION public.audit_grade_write();

REVOKE ALL ON FUNCTION public.validate_grade_write() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.audit_grade_write() FROM PUBLIC;

-- Keep deprecated submission grading columns empty so a student selecting their
-- own submission row can never observe draft score/feedback through PostgREST.
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
            IF TG_OP = 'UPDATE'
               AND (NEW.assignment_id IS DISTINCT FROM OLD.assignment_id
                    OR NEW.student_id IS DISTINCT FROM OLD.student_id) THEN
                RAISE EXCEPTION 'Submission ownership cannot be changed';
            END IF;
            SELECT due_at, allow_late_submission, is_active
            INTO assignment_due, assignment_allows_late, assignment_active
            FROM public.assignments
            WHERE id = NEW.assignment_id;
            IF assignment_due IS NULL THEN
                RAISE EXCEPTION 'Assignment does not exist';
            END IF;
            IF assignment_active IS NOT TRUE THEN
                RAISE EXCEPTION 'Assignment is not active';
            END IF;
            IF NOW() > assignment_due AND assignment_allows_late IS NOT TRUE THEN
                RAISE EXCEPTION 'Late submissions are not allowed';
            END IF;
            NEW.submitted_at := NOW();
            NEW.is_late := NOW() > assignment_due;
            NEW.status := 'pending';
        END IF;

        IF TG_OP = 'UPDATE' THEN
            NEW.score := NULL;
            NEW.ai_suggested_score := NULL;
            NEW.ai_feedback := NULL;
            NEW.teacher_feedback := NULL;
            NEW.graded_at := NULL;
            NEW.graded_by := NULL;
            NEW.breakdown := '[]'::jsonb;
        ELSE
            IF NEW.score IS NOT NULL
               OR NEW.ai_suggested_score IS NOT NULL
               OR NEW.ai_feedback IS NOT NULL
               OR NEW.teacher_feedback IS NOT NULL
               OR NEW.graded_at IS NOT NULL
               OR NEW.graded_by IS NOT NULL
               OR COALESCE(NEW.breakdown, '[]'::jsonb) <> '[]'::jsonb THEN
                RAISE EXCEPTION 'Submission grading fields are server-managed';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_submission_grading_columns ON public.submissions;
CREATE TRIGGER trg_protect_submission_grading_columns
BEFORE INSERT OR UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.protect_submission_grading_columns();

REVOKE ALL ON FUNCTION public.protect_submission_grading_columns() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.protect_rubric_owner()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    jwt_role TEXT;
BEGIN
    jwt_role := COALESCE(auth.jwt()->>'role', current_setting('request.jwt.claim.role', true));
    IF jwt_role IS DISTINCT FROM 'service_role' AND NOT public.is_admin() THEN
        IF NOT public.is_lecturer() THEN
            RAISE EXCEPTION 'Only lecturers can manage rubrics';
        END IF;
        IF TG_OP = 'INSERT' THEN
            NEW.owner_id := auth.uid();
        ELSIF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
            RAISE EXCEPTION 'Rubric ownership cannot be changed';
        END IF;
        IF NEW.assignment_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM public.assignments a
            WHERE a.id = NEW.assignment_id AND a.lecturer_id = auth.uid()
        ) THEN
            RAISE EXCEPTION 'Rubric assignment must belong to the current lecturer';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_rubric_owner ON public.rubrics;
CREATE TRIGGER trg_protect_rubric_owner
BEFORE INSERT OR UPDATE ON public.rubrics
FOR EACH ROW EXECUTE FUNCTION public.protect_rubric_owner();

REVOKE ALL ON FUNCTION public.protect_rubric_owner() FROM PUBLIC;

-- Replace the broad grade policies. Students only receive published rows that
-- belong to their own submission. Lecturers are scoped through assignment owner.
DROP POLICY IF EXISTS "Grades viewable by submission owner and class lecturer" ON public.grades;
DROP POLICY IF EXISTS "Lecturers can insert/update grades" ON public.grades;
DROP POLICY IF EXISTS "Published grades visible to owner and assignment lecturer" ON public.grades;
DROP POLICY IF EXISTS "Assignment lecturers can insert grades" ON public.grades;
DROP POLICY IF EXISTS "Assignment lecturers can update grades" ON public.grades;

CREATE POLICY "Published grades visible to owner and assignment lecturer"
ON public.grades FOR SELECT
TO authenticated
USING (
    public.is_active_user()
    AND (
        public.is_admin()
        OR EXISTS (
        SELECT 1
        FROM public.submissions s
        JOIN public.assignments a ON a.id = s.assignment_id
        WHERE s.id = grades.submission_id
          AND (
              (a.lecturer_id = auth.uid() AND public.is_lecturer())
              OR (
                  s.student_id = auth.uid()
                  AND public.is_active_student()
                  AND grades.status = 'published'
              )
          )
        )
    )
);

CREATE POLICY "Assignment lecturers can insert grades"
ON public.grades FOR INSERT
TO authenticated
WITH CHECK (
    lecturer_id = auth.uid()
    AND public.is_lecturer()
    AND EXISTS (
        SELECT 1 FROM public.submissions s
        JOIN public.assignments a ON a.id = s.assignment_id
        WHERE s.id = grades.submission_id AND a.lecturer_id = auth.uid()
    )
);

CREATE POLICY "Assignment lecturers can update grades"
ON public.grades FOR UPDATE
TO authenticated
USING (
    lecturer_id = auth.uid()
    AND public.is_lecturer()
    AND EXISTS (
        SELECT 1 FROM public.submissions s
        JOIN public.assignments a ON a.id = s.assignment_id
        WHERE s.id = grades.submission_id AND a.lecturer_id = auth.uid()
    )
)
WITH CHECK (
    lecturer_id = auth.uid()
    AND public.is_lecturer()
    AND EXISTS (
        SELECT 1 FROM public.submissions s
        JOIN public.assignments a ON a.id = s.assignment_id
        WHERE s.id = grades.submission_id AND a.lecturer_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Grade history visible to assignment lecturer and admin" ON public.grading_history;
CREATE POLICY "Grade history visible to assignment lecturer and admin"
ON public.grading_history FOR SELECT
TO authenticated
USING (
    public.is_active_user()
    AND (
        public.is_admin()
        OR (public.is_lecturer() AND EXISTS (
        SELECT 1 FROM public.submissions s
        JOIN public.assignments a ON a.id = s.assignment_id
        WHERE s.id = grading_history.submission_id AND a.lecturer_id = auth.uid()
        ))
    )
);

-- Students may edit only their own still-editable submission payload. They can
-- never set grading fields or forge a grading lifecycle status.
DROP POLICY IF EXISTS "Students can update their un-graded submissions, lecturers can grade"
    ON public.submissions;
DROP POLICY IF EXISTS "Students can update their own pending submissions" ON public.submissions;
DROP POLICY IF EXISTS "Lecturers can update submissions in their assignments" ON public.submissions;

CREATE POLICY "Students can update their own pending submissions"
ON public.submissions FOR UPDATE
TO authenticated
USING (
    public.is_active_student()
    AND student_id = auth.uid()
    AND status IN ('pending', 'error')
)
WITH CHECK (
    public.is_active_student()
    AND
    student_id = auth.uid()
    AND status IN ('pending', 'error')
    AND EXISTS (
        SELECT 1 FROM public.assignments a
        JOIN public.class_members cm ON cm.class_id = a.class_id
        WHERE a.id = submissions.assignment_id
          AND cm.student_id = auth.uid()
          AND cm.status = 'active'
    )
);

CREATE POLICY "Lecturers can update submissions in their assignments"
ON public.submissions FOR UPDATE
TO authenticated
USING (
    public.is_lecturer()
    AND EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = submissions.assignment_id AND a.lecturer_id = auth.uid()
    )
)
WITH CHECK (
    public.is_lecturer()
    AND EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = submissions.assignment_id AND a.lecturer_id = auth.uid()
    )
);

-- The original global rubric read policy exposed every rubric to every account.
DROP POLICY IF EXISTS "Rubrics viewable by class members and teachers" ON public.rubrics;
DROP POLICY IF EXISTS "Lecturers and admins can manage rubrics" ON public.rubrics;
CREATE POLICY "Rubrics visible to related class members and lecturers"
ON public.rubrics FOR SELECT
TO authenticated
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = rubrics.assignment_id
          AND (
              (a.lecturer_id = auth.uid() AND public.is_lecturer())
              OR EXISTS (
                  SELECT 1 FROM public.class_members cm
                  WHERE cm.class_id = a.class_id
                    AND cm.student_id = auth.uid()
                    AND cm.status = 'active'
              )
          )
    )
    OR (assignment_id IS NULL AND owner_id = auth.uid() AND public.is_lecturer())
);

CREATE POLICY "Lecturers can insert related rubrics"
ON public.rubrics FOR INSERT
TO authenticated
WITH CHECK (
    public.is_admin()
    OR (public.is_lecturer() AND owner_id = auth.uid())
);

CREATE POLICY "Lecturers can update related rubrics"
ON public.rubrics FOR UPDATE
TO authenticated
USING (
    public.is_admin()
    OR (public.is_lecturer() AND owner_id = auth.uid())
)
WITH CHECK (
    public.is_admin()
    OR (public.is_lecturer() AND owner_id = auth.uid())
);

CREATE POLICY "Lecturers can delete related rubrics"
ON public.rubrics FOR DELETE
TO authenticated
USING (
    public.is_admin()
    OR (public.is_lecturer() AND owner_id = auth.uid())
);

-- The initial storage policy allowed every lecturer to read every submission
-- object. Scope file reads to the student owner, the assignment lecturer, or an
-- administrator. Existing rows may store either an object path or a signed URL.
DROP POLICY IF EXISTS "Students can read their own submission files, teachers can read all submissions"
ON storage.objects;
DROP POLICY IF EXISTS "Submission files visible to owner and assignment lecturer"
ON storage.objects;

CREATE POLICY "Submission files visible to owner and assignment lecturer"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'submissions'
    AND (
        (public.is_active_student() AND (storage.foldername(name))[1] = auth.uid()::TEXT)
        OR public.is_admin()
        OR (public.is_lecturer() AND EXISTS (
            SELECT 1
            FROM public.submissions s
            JOIN public.assignments a ON a.id = s.assignment_id
            WHERE a.lecturer_id = auth.uid()
              AND (
                  s.file_url = storage.objects.name
                  OR s.apk_file_url = storage.objects.name
                  OR s.source_zip_url = storage.objects.name
                  OR s.file_url LIKE '%/submissions/' || storage.objects.name || '%'
                  OR s.apk_file_url LIKE '%/submissions/' || storage.objects.name || '%'
                  OR s.source_zip_url LIKE '%/submissions/' || storage.objects.name || '%'
              )
        ))
    )
);

COMMENT ON TABLE public.grades IS
    'One draft or published grading result per submission. RLS hides drafts from students.';
COMMENT ON COLUMN public.grades.ai_feedback IS
    'Optional AI suggestion. It is never authoritative; public score is lecturer-confirmed.';
