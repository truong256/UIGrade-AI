-- ====================================================================
-- Sprint A security lockdown: authorization, join RPC, RLS, constraints
--
-- SAFETY:
--   * This migration preserves schema tables and all application rows.
--   * Invalid legacy numeric values are normalized before validation.
--   * Direct class_members INSERT remains denied; joining is only via RPC.
-- ====================================================================

-- Active, role-aware helpers run as the migration owner to avoid recursive RLS.
CREATE OR REPLACE FUNCTION public.is_active_class_member(target_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT public.is_active_student() AND EXISTS (
        SELECT 1
        FROM public.class_members cm
        WHERE cm.class_id = target_class_id
          AND cm.student_id = auth.uid()
          AND cm.status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION public.owns_class(target_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT public.is_lecturer() AND EXISTS (
        SELECT 1
        FROM public.classes c
        WHERE c.id = target_class_id
          AND c.lecturer_id = auth.uid()
    );
$$;

CREATE OR REPLACE FUNCTION public.can_read_class_members(target_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT public.is_active_user() AND (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.classes c
            WHERE c.id = target_class_id
              AND c.lecturer_id = auth.uid()
              AND public.is_lecturer()
        )
        OR EXISTS (
            SELECT 1 FROM public.class_members cm
            WHERE cm.class_id = target_class_id
              AND cm.student_id = auth.uid()
              AND cm.status = 'active'
              AND public.is_active_student()
        )
    );
$$;

REVOKE ALL ON FUNCTION public.is_active_class_member(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owns_class(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_read_class_members(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_class_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_class(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_read_class_members(UUID) TO authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;

-- Profile visibility: self is required for onboarding. Other profile reads need
-- an active, relevant relationship. Pending members are visible only to owner.
DROP POLICY IF EXISTS "Profiles viewable by self, classmates, or admin" ON public.profiles;
CREATE POLICY "Profiles viewable by self, active classmates, or owner lecturer"
ON public.profiles FOR SELECT
TO authenticated
USING (
    id = auth.uid()
    OR public.is_admin()
    OR (
        public.is_lecturer()
        AND EXISTS (
            SELECT 1
            FROM public.class_members cm
            JOIN public.classes c ON c.id = cm.class_id
            WHERE cm.student_id = profiles.id
              AND cm.status IN ('active', 'pending', 'invited')
              AND c.lecturer_id = auth.uid()
        )
    )
    OR (
        public.is_active_student()
        AND EXISTS (
            SELECT 1
            FROM public.class_members mine
            JOIN public.class_members theirs ON theirs.class_id = mine.class_id
            WHERE mine.student_id = auth.uid()
              AND mine.status = 'active'
              AND theirs.student_id = profiles.id
              AND theirs.status = 'active'
        )
    )
);

-- Classes: active admins can read for oversight; only the active owner lecturer
-- can mutate. Students need an active membership.
DROP POLICY IF EXISTS "Lecturers can create classes" ON public.classes;
DROP POLICY IF EXISTS "Classes are viewable by lecturer, members, or by class code lookup" ON public.classes;
DROP POLICY IF EXISTS "Lecturers can update their own classes" ON public.classes;
DROP POLICY IF EXISTS "Lecturers can delete their own classes" ON public.classes;

CREATE POLICY "Authorized users can view related classes"
ON public.classes FOR SELECT
TO authenticated
USING (
    public.is_active_user()
    AND (
        public.is_admin()
        OR (public.is_lecturer() AND lecturer_id = auth.uid())
        OR public.is_active_class_member(id)
    )
);

CREATE POLICY "Owning lecturers can create classes"
ON public.classes FOR INSERT
TO authenticated
WITH CHECK (public.is_lecturer() AND lecturer_id = auth.uid());

CREATE POLICY "Owning lecturers can update classes"
ON public.classes FOR UPDATE
TO authenticated
USING (public.is_lecturer() AND lecturer_id = auth.uid())
WITH CHECK (public.is_lecturer() AND lecturer_id = auth.uid());

CREATE POLICY "Owning lecturers can delete classes"
ON public.classes FOR DELETE
TO authenticated
USING (public.is_lecturer() AND lecturer_id = auth.uid());

-- Membership reads exclude pending/dropped rows from students. The owner can
-- see pending/invited rows to perform the existing approval workflow.
DROP POLICY IF EXISTS "Class members viewable by class teacher and classmates" ON public.class_members;
DROP POLICY IF EXISTS "Students can join class for themselves" ON public.class_members;
DROP POLICY IF EXISTS "Lecturers and Admins can update/remove members" ON public.class_members;
DROP POLICY IF EXISTS "Lecturers and Admins can delete members" ON public.class_members;

CREATE POLICY "Authorized users can view class members"
ON public.class_members FOR SELECT
TO authenticated
USING (
    public.is_active_user()
    AND (
        public.is_admin()
        OR public.owns_class(class_id)
        OR (
            status = 'active'
            AND public.is_active_class_member(class_id)
        )
    )
);

-- Intentionally no class_members INSERT policy for authenticated. The
-- SECURITY DEFINER join function below is the sole student insertion path.
CREATE POLICY "Owning lecturers can update class members"
ON public.class_members FOR UPDATE
TO authenticated
USING (public.owns_class(class_id))
WITH CHECK (public.owns_class(class_id));

CREATE POLICY "Owners and active students can remove memberships"
ON public.class_members FOR DELETE
TO authenticated
USING (
    public.owns_class(class_id)
    OR (
        public.is_active_student()
        AND student_id = auth.uid()
        AND status = 'active'
    )
);

CREATE OR REPLACE FUNCTION public.protect_class_member_identity()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    jwt_role TEXT;
BEGIN
    jwt_role := COALESCE(auth.jwt()->>'role', current_setting('request.jwt.claim.role', true));
    IF jwt_role IS DISTINCT FROM 'service_role'
       AND (NEW.class_id IS DISTINCT FROM OLD.class_id
            OR NEW.student_id IS DISTINCT FROM OLD.student_id) THEN
        RAISE EXCEPTION 'Membership ownership cannot be changed';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_class_member_identity ON public.class_members;
CREATE TRIGGER trg_protect_class_member_identity
BEFORE UPDATE ON public.class_members
FOR EACH ROW EXECUTE FUNCTION public.protect_class_member_identity();
REVOKE ALL ON FUNCTION public.protect_class_member_identity() FROM PUBLIC;

-- Transactional join-by-code. The class row lock serializes concurrent joins
-- for one code; the existing unique(class_id, student_id) is a second defense.
CREATE OR REPLACE FUNCTION public.join_class_by_code(input_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    normalized_code TEXT := UPPER(BTRIM(COALESCE(input_code, '')));
    target_class public.classes%ROWTYPE;
    membership public.class_members%ROWTYPE;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'student'
          AND p.status = 'active'
    ) THEN
        RAISE EXCEPTION 'Only an active student can join a class';
    END IF;

    IF normalized_code = '' OR LENGTH(normalized_code) > 64 THEN
        RAISE EXCEPTION 'Invalid class code';
    END IF;

    SELECT c.* INTO target_class
    FROM public.classes c
    WHERE UPPER(BTRIM(c.class_code)) = normalized_code
      AND c.status = 'active'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Class not found or inactive';
    END IF;

    SELECT cm.* INTO membership
    FROM public.class_members cm
    WHERE cm.class_id = target_class.id
      AND cm.student_id = auth.uid()
    FOR UPDATE;

    IF FOUND AND membership.status = 'active' THEN
        RETURN jsonb_build_object(
            'classId', target_class.id,
            'className', target_class.name,
            'membershipStatus', 'active',
            'message', 'Bạn đã là thành viên của lớp học này'
        );
    END IF;

    IF FOUND AND membership.status IN ('pending', 'invited') THEN
        RETURN jsonb_build_object(
            'classId', target_class.id,
            'className', target_class.name,
            'membershipStatus', membership.status,
            'message', 'Yêu cầu tham gia lớp đang chờ giảng viên duyệt'
        );
    END IF;

    IF FOUND THEN
        UPDATE public.class_members
        SET status = 'pending', joined_at = NOW(), updated_at = NOW()
        WHERE id = membership.id;
    ELSE
        INSERT INTO public.class_members (class_id, student_id, status)
        VALUES (target_class.id, auth.uid(), 'pending');
    END IF;

    RETURN jsonb_build_object(
        'classId', target_class.id,
        'className', target_class.name,
        'membershipStatus', 'pending',
        'message', 'Yêu cầu tham gia lớp đã được gửi và đang chờ duyệt'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.join_class_by_code(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_class_by_code(TEXT) TO authenticated;

-- Assignments: active members see only active published work. Only the active
-- lecturer who owns both class and assignment can mutate.
DROP POLICY IF EXISTS "Assignments viewable by enrolled students and class teachers" ON public.assignments;
DROP POLICY IF EXISTS "Lecturers can insert assignments in their classes" ON public.assignments;
DROP POLICY IF EXISTS "Lecturers can update their assignments" ON public.assignments;
DROP POLICY IF EXISTS "Lecturers can delete their assignments" ON public.assignments;

CREATE POLICY "Authorized users can view related assignments"
ON public.assignments FOR SELECT
TO authenticated
USING (
    public.is_active_user()
    AND (
        public.is_admin()
        OR (public.is_lecturer() AND lecturer_id = auth.uid())
        OR (
            status = 'published'
            AND is_active = TRUE
            AND public.is_active_class_member(class_id)
        )
    )
);

CREATE POLICY "Owning lecturers can insert assignments"
ON public.assignments FOR INSERT
TO authenticated
WITH CHECK (
    public.is_lecturer()
    AND lecturer_id = auth.uid()
    AND public.owns_class(class_id)
    AND EXISTS (SELECT 1 FROM public.classes c WHERE c.id = class_id AND c.status = 'active')
);

CREATE POLICY "Owning lecturers can update assignments"
ON public.assignments FOR UPDATE
TO authenticated
USING (public.is_lecturer() AND lecturer_id = auth.uid() AND public.owns_class(class_id))
WITH CHECK (public.is_lecturer() AND lecturer_id = auth.uid() AND public.owns_class(class_id));

CREATE POLICY "Owning lecturers can delete assignments"
ON public.assignments FOR DELETE
TO authenticated
USING (public.is_lecturer() AND lecturer_id = auth.uid() AND public.owns_class(class_id));

-- Submission reads/writes require an active membership or assignment ownership.
DROP POLICY IF EXISTS "Students can view only their own submissions, lecturers view class submissions" ON public.submissions;
DROP POLICY IF EXISTS "Students can submit their own work" ON public.submissions;
DROP POLICY IF EXISTS "Students can update their un-graded submissions, lecturers can grade" ON public.submissions;
DROP POLICY IF EXISTS "Students can update their own pending submissions" ON public.submissions;
DROP POLICY IF EXISTS "Lecturers can update submissions in their assignments" ON public.submissions;

CREATE POLICY "Authorized users can view related submissions"
ON public.submissions FOR SELECT
TO authenticated
USING (
    public.is_active_user()
    AND (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.assignments a
            WHERE a.id = submissions.assignment_id
              AND a.lecturer_id = auth.uid()
              AND public.is_lecturer()
        )
        OR EXISTS (
            SELECT 1
            FROM public.assignments a
            JOIN public.class_members cm ON cm.class_id = a.class_id
            WHERE a.id = submissions.assignment_id
              AND submissions.student_id = auth.uid()
              AND cm.student_id = auth.uid()
              AND cm.status = 'active'
              AND public.is_active_student()
        )
    )
);

CREATE POLICY "Active students can insert own submissions"
ON public.submissions FOR INSERT
TO authenticated
WITH CHECK (
    public.is_active_student()
    AND student_id = auth.uid()
    AND EXISTS (
        SELECT 1
        FROM public.assignments a
        JOIN public.classes c ON c.id = a.class_id
        JOIN public.class_members cm ON cm.class_id = a.class_id
        WHERE a.id = submissions.assignment_id
          AND a.status = 'published'
          AND a.is_active = TRUE
          AND c.status = 'active'
          AND cm.student_id = auth.uid()
          AND cm.status = 'active'
    )
);

CREATE POLICY "Active students can update own pending submissions"
ON public.submissions FOR UPDATE
TO authenticated
USING (
    public.is_active_student()
    AND student_id = auth.uid()
    AND status IN ('pending', 'error')
    AND EXISTS (
        SELECT 1 FROM public.assignments a
        JOIN public.class_members cm ON cm.class_id = a.class_id
        WHERE a.id = submissions.assignment_id
          AND cm.student_id = auth.uid()
          AND cm.status = 'active'
    )
)
WITH CHECK (
    public.is_active_student()
    AND student_id = auth.uid()
    AND status IN ('pending', 'error')
    AND EXISTS (
        SELECT 1 FROM public.assignments a
        JOIN public.class_members cm ON cm.class_id = a.class_id
        WHERE a.id = submissions.assignment_id
          AND a.status = 'published'
          AND a.is_active = TRUE
          AND cm.student_id = auth.uid()
          AND cm.status = 'active'
    )
);

CREATE POLICY "Owning lecturers can update assignment submissions"
ON public.submissions FOR UPDATE
TO authenticated
USING (
    public.is_lecturer()
    AND EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = submissions.assignment_id
          AND a.lecturer_id = auth.uid()
          AND public.owns_class(a.class_id)
    )
)
WITH CHECK (
    public.is_lecturer()
    AND EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = submissions.assignment_id
          AND a.lecturer_id = auth.uid()
          AND public.owns_class(a.class_id)
    )
);

-- Grades: admins retain read-only oversight. Students need their active class
-- membership and see only their own published result.
DROP POLICY IF EXISTS "Grades viewable by submission owner and class lecturer" ON public.grades;
DROP POLICY IF EXISTS "Lecturers can insert/update grades" ON public.grades;
DROP POLICY IF EXISTS "Published grades visible to owner and assignment lecturer" ON public.grades;
DROP POLICY IF EXISTS "Assignment lecturers can insert grades" ON public.grades;
DROP POLICY IF EXISTS "Assignment lecturers can update grades" ON public.grades;

CREATE POLICY "Published grades visible to active related users"
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
              AND a.lecturer_id = auth.uid()
              AND public.is_lecturer()
        )
        OR EXISTS (
            SELECT 1
            FROM public.submissions s
            JOIN public.assignments a ON a.id = s.assignment_id
            JOIN public.class_members cm ON cm.class_id = a.class_id
            WHERE s.id = grades.submission_id
              AND s.student_id = auth.uid()
              AND grades.status = 'published'
              AND cm.student_id = auth.uid()
              AND cm.status = 'active'
              AND public.is_active_student()
        )
    )
);

CREATE POLICY "Owning lecturers can insert grades"
ON public.grades FOR INSERT
TO authenticated
WITH CHECK (
    lecturer_id = auth.uid()
    AND public.is_lecturer()
    AND EXISTS (
        SELECT 1 FROM public.submissions s
        JOIN public.assignments a ON a.id = s.assignment_id
        WHERE s.id = grades.submission_id
          AND a.lecturer_id = auth.uid()
          AND public.owns_class(a.class_id)
    )
);

CREATE POLICY "Owning lecturers can update grades"
ON public.grades FOR UPDATE
TO authenticated
USING (
    lecturer_id = auth.uid()
    AND public.is_lecturer()
    AND EXISTS (
        SELECT 1 FROM public.submissions s
        JOIN public.assignments a ON a.id = s.assignment_id
        WHERE s.id = grades.submission_id
          AND a.lecturer_id = auth.uid()
          AND public.owns_class(a.class_id)
    )
)
WITH CHECK (
    lecturer_id = auth.uid()
    AND public.is_lecturer()
    AND EXISTS (
        SELECT 1 FROM public.submissions s
        JOIN public.assignments a ON a.id = s.assignment_id
        WHERE s.id = grades.submission_id
          AND a.lecturer_id = auth.uid()
          AND public.owns_class(a.class_id)
    )
);

-- Rubric access follows the related assignment. Admin remains read-only.
DROP POLICY IF EXISTS "Rubrics viewable by class members and teachers" ON public.rubrics;
DROP POLICY IF EXISTS "Lecturers and admins can manage rubrics" ON public.rubrics;
DROP POLICY IF EXISTS "Rubrics visible to related class members and lecturers" ON public.rubrics;
DROP POLICY IF EXISTS "Lecturers can insert related rubrics" ON public.rubrics;
DROP POLICY IF EXISTS "Lecturers can update related rubrics" ON public.rubrics;
DROP POLICY IF EXISTS "Lecturers can delete related rubrics" ON public.rubrics;

CREATE POLICY "Rubrics visible to active related users"
ON public.rubrics FOR SELECT
TO authenticated
USING (
    public.is_admin()
    OR (assignment_id IS NULL AND owner_id = auth.uid() AND public.is_lecturer())
    OR EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = rubrics.assignment_id
          AND (
              (a.lecturer_id = auth.uid() AND public.is_lecturer())
              OR (
                  a.status = 'published'
                  AND a.is_active = TRUE
                  AND public.is_active_class_member(a.class_id)
              )
          )
    )
);

CREATE POLICY "Owning lecturers can insert rubrics"
ON public.rubrics FOR INSERT
TO authenticated
WITH CHECK (
    public.is_lecturer()
    AND owner_id = auth.uid()
    AND (assignment_id IS NULL OR EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = rubrics.assignment_id
          AND a.lecturer_id = auth.uid()
          AND public.owns_class(a.class_id)
    ))
);

CREATE POLICY "Owning lecturers can update rubrics"
ON public.rubrics FOR UPDATE
TO authenticated
USING (public.is_lecturer() AND owner_id = auth.uid())
WITH CHECK (
    public.is_lecturer()
    AND owner_id = auth.uid()
    AND (assignment_id IS NULL OR EXISTS (
        SELECT 1 FROM public.assignments a
        WHERE a.id = rubrics.assignment_id
          AND a.lecturer_id = auth.uid()
          AND public.owns_class(a.class_id)
    ))
);

CREATE POLICY "Owning lecturers can delete rubrics"
ON public.rubrics FOR DELETE
TO authenticated
USING (public.is_lecturer() AND owner_id = auth.uid());

-- BUG-020 core numeric constraints. Preserve NULL where the schema permits it.
UPDATE public.assignments SET weight = 1 WHERE weight IS NOT NULL AND weight <= 0;
UPDATE public.assignments
SET late_penalty_percent = LEAST(100, GREATEST(0, late_penalty_percent))
WHERE late_penalty_percent IS NOT NULL
  AND (late_penalty_percent < 0 OR late_penalty_percent > 100);
UPDATE public.rubrics SET max_score = 10 WHERE max_score <= 0;

ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS assignments_weight_positive;
ALTER TABLE public.assignments
    ADD CONSTRAINT assignments_weight_positive
    CHECK (weight IS NULL OR weight > 0) NOT VALID;
ALTER TABLE public.assignments VALIDATE CONSTRAINT assignments_weight_positive;

ALTER TABLE public.assignments DROP CONSTRAINT IF EXISTS assignments_late_penalty_range;
ALTER TABLE public.assignments
    ADD CONSTRAINT assignments_late_penalty_range
    CHECK (late_penalty_percent IS NULL OR late_penalty_percent BETWEEN 0 AND 100) NOT VALID;
ALTER TABLE public.assignments VALIDATE CONSTRAINT assignments_late_penalty_range;

ALTER TABLE public.rubrics DROP CONSTRAINT IF EXISTS rubrics_max_score_positive;
ALTER TABLE public.rubrics
    ADD CONSTRAINT rubrics_max_score_positive CHECK (max_score > 0) NOT VALID;
ALTER TABLE public.rubrics VALIDATE CONSTRAINT rubrics_max_score_positive;

COMMENT ON FUNCTION public.join_class_by_code(TEXT) IS
    'Transactional student join request. Creates pending membership for lecturer approval.';
