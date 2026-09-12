-- Close remaining Web MVP data-integrity and profile-privacy gaps.
-- This migration preserves every application table and row.

-- Students need their own profile and the lecturer identity shown for their class,
-- but do not need classmates' email/profile data. Owning lecturers retain access to
-- active and pending members so the approval workflow continues to work.
DROP POLICY IF EXISTS "Profiles viewable by self, active classmates, or owner lecturer"
    ON public.profiles;

CREATE POLICY "Profiles visible only through required relationships"
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
            JOIN public.classes c ON c.id = mine.class_id
            WHERE mine.student_id = auth.uid()
              AND mine.status = 'active'
              AND c.lecturer_id = profiles.id
        )
    )
);

-- Core submission writes must use save_student_submission(). Leaving direct
-- PostgREST INSERT/UPDATE policies in place bypasses max-attempt and rotation rules.
DROP POLICY IF EXISTS "Active students can insert own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Active students can update own pending submissions" ON public.submissions;
DROP POLICY IF EXISTS "Active students can update own editable submissions" ON public.submissions;

-- Enforce bounded values for every future write, including privileged maintenance
-- paths. NOT VALID preserves any legacy rows that may need a separate cleanup.
ALTER TABLE public.submissions
    DROP CONSTRAINT IF EXISTS submissions_attempt_no_range,
    DROP CONSTRAINT IF EXISTS submissions_content_length,
    DROP CONSTRAINT IF EXISTS submissions_repository_url_length,
    DROP CONSTRAINT IF EXISTS submissions_files_shape;
ALTER TABLE public.submissions
    ADD CONSTRAINT submissions_attempt_no_range
        CHECK (attempt_no BETWEEN 1 AND 100) NOT VALID,
    ADD CONSTRAINT submissions_content_length
        CHECK (content IS NULL OR CHAR_LENGTH(content) <= 20000) NOT VALID,
    ADD CONSTRAINT submissions_repository_url_length
        CHECK (repository_url IS NULL OR CHAR_LENGTH(repository_url) <= 2048) NOT VALID,
    ADD CONSTRAINT submissions_files_shape
        CHECK (jsonb_typeof(files) = 'array' AND jsonb_array_length(files) <= 10) NOT VALID;

-- Permit the SECURITY DEFINER RPC to rotate its own current row while retaining
-- the existing protection for direct student updates and every grading column.
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
    trusted_rpc_actor TEXT;
BEGIN
    jwt_role := COALESCE(auth.jwt()->>'role', current_setting('request.jwt.claim.role', true));
    trusted_rpc_actor := current_setting('uigrade.submission_rpc_actor', true);

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
                OR (
                    NEW.is_current IS DISTINCT FROM OLD.is_current
                    AND trusted_rpc_actor IS DISTINCT FROM auth.uid()::TEXT
                )
            ) THEN
                RAISE EXCEPTION 'Submission ownership cannot be changed';
            END IF;

            -- Rotation only closes the previous current attempt. Preserve its
            -- original timestamp, late flag, status, files and grading fields.
            IF TG_OP = 'UPDATE'
               AND trusted_rpc_actor = auth.uid()::TEXT
               AND OLD.is_current IS TRUE
               AND NEW.is_current IS FALSE THEN
                RETURN NEW;
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

REVOKE ALL ON FUNCTION public.protect_submission_grading_columns() FROM PUBLIC;

-- Transactional draft/submit/resubmit flow. Existing rows are preserved as
-- history; exactly one row remains current for each student and assignment.
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
    stored_files JSONB := COALESCE(input_files, '[]'::jsonb);
    requested_status TEXT;
    normalized_repository_url TEXT := NULLIF(BTRIM(COALESCE(input_repository_url, '')), '');
    policy_max_attempts INTEGER := 1;
    max_attempts_text TEXT;
    policy_max_file_size_mb INTEGER := 100;
    max_file_size_text TEXT;
    policy_accepted_file_types JSONB := '["zip", "apk"]'::jsonb;
    policy_allows_repository BOOLEAN := FALSE;
    policy_requires_zip BOOLEAN := FALSE;
    object_prefix TEXT;
    has_current BOOLEAN := FALSE;
BEGIN
    IF NOT public.is_active_student() THEN
        RAISE EXCEPTION 'Only an active student can submit work';
    END IF;
    IF input_action NOT IN ('draft', 'submit') THEN
        RAISE EXCEPTION 'Invalid submission action';
    END IF;
    IF LENGTH(COALESCE(input_content, '')) > 20000 THEN
        RAISE EXCEPTION 'Submission note is too long';
    END IF;
    IF LENGTH(COALESCE(input_repository_url, '')) > 2048 THEN
        RAISE EXCEPTION 'Repository URL is too long';
    END IF;
    IF jsonb_typeof(stored_files) IS DISTINCT FROM 'array'
       OR jsonb_array_length(stored_files) > 10 THEN
        RAISE EXCEPTION 'Invalid submission file list';
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

    max_attempts_text := target_assignment.submission_policy->>'maxAttempts';
    -- Older Web clients represented "resubmit allowed" as 999999. Accept that
    -- legacy value safely, but cap the effective policy to a bounded 100 attempts.
    IF max_attempts_text ~ '^[1-9][0-9]{0,8}$' THEN
        policy_max_attempts := LEAST(max_attempts_text::INTEGER, 100);
    END IF;
    IF target_assignment.allow_resubmit IS NOT TRUE THEN
        policy_max_attempts := 1;
    END IF;
    policy_allows_repository := LOWER(COALESCE(
        target_assignment.submission_policy->>'allowGithubUrl', 'false'
    )) = 'true';
    policy_requires_zip := LOWER(COALESCE(
        target_assignment.submission_policy->>'requireZip', 'false'
    )) = 'true';
    max_file_size_text := target_assignment.submission_policy->>'maxFileSizeMb';
    IF max_file_size_text ~ '^[1-9][0-9]{0,2}$' THEN
        policy_max_file_size_mb := LEAST(max_file_size_text::INTEGER, 100);
    END IF;
    IF jsonb_typeof(target_assignment.submission_policy->'acceptedFileTypes') = 'array' THEN
        policy_accepted_file_types := target_assignment.submission_policy->'acceptedFileTypes';
    END IF;

    IF normalized_repository_url IS NOT NULL AND (
        policy_allows_repository IS NOT TRUE OR normalized_repository_url !~* '^https://'
    ) THEN
        RAISE EXCEPTION 'Repository URL is not allowed';
    END IF;

    object_prefix := auth.uid()::TEXT || '/' || input_assignment_id::TEXT || '/';
    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(stored_files) AS item
        WHERE jsonb_typeof(item) IS DISTINCT FROM 'object'
           OR COALESCE(item->>'path', '') = ''
           OR LEFT(COALESCE(item->>'path', ''), LENGTH(object_prefix)) <> object_prefix
           OR LENGTH(COALESCE(item->>'originalName', '')) > 255
    ) THEN
        RAISE EXCEPTION 'Submission file ownership is invalid';
    END IF;

    -- Do not trust caller-supplied size or MIME metadata. Resolve the real
    -- private object and validate it against the assignment policy.
    IF EXISTS (
        SELECT 1
        FROM jsonb_array_elements(stored_files) AS item
        WHERE NOT EXISTS (
            SELECT 1
            FROM storage.objects stored_object
            WHERE stored_object.bucket_id = 'submissions'
              AND stored_object.name = item->>'path'
              AND CASE
                    WHEN COALESCE(stored_object.metadata->>'size', '') ~ '^[0-9]+$'
                    THEN (stored_object.metadata->>'size')::BIGINT
                         <= policy_max_file_size_mb::BIGINT * 1024 * 1024
                    ELSE FALSE
                  END
              AND (
                  jsonb_array_length(policy_accepted_file_types) = 0
                  OR EXISTS (
                      SELECT 1
                      FROM jsonb_array_elements_text(policy_accepted_file_types) AS allowed(value)
                      WHERE LOWER(allowed.value) = LOWER(COALESCE(stored_object.metadata->>'mimetype', ''))
                         OR LOWER(COALESCE(item->>'originalName', ''))
                            LIKE '%.' || LTRIM(LOWER(allowed.value), '.')
                  )
              )
        )
    ) THEN
        RAISE EXCEPTION 'Submission file does not exist or violates assignment policy';
    END IF;

    IF input_source_zip_url IS NOT NULL AND (
        LEFT(input_source_zip_url, LENGTH(object_prefix)) <> object_prefix
        OR input_source_zip_url !~* '\.zip$'
        OR NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements(stored_files) AS item
            WHERE item->>'path' = input_source_zip_url
        )
    ) THEN
        RAISE EXCEPTION 'Source ZIP path is invalid';
    END IF;
    IF input_action = 'submit' AND policy_requires_zip AND input_source_zip_url IS NULL THEN
        RAISE EXCEPTION 'A source ZIP file is required';
    END IF;
    IF input_action = 'submit' AND jsonb_array_length(stored_files) = 0 AND normalized_repository_url IS NULL THEN
        RAISE EXCEPTION 'A file or repository URL is required';
    END IF;

    SELECT s.* INTO current_submission
    FROM public.submissions s
    WHERE s.assignment_id = input_assignment_id
      AND s.student_id = auth.uid() AND s.is_current
    FOR UPDATE;
    has_current := FOUND;

    requested_status := CASE WHEN input_action = 'draft' THEN 'draft' ELSE 'pending' END;
    PERFORM set_config('uigrade.submission_rpc_actor', auth.uid()::TEXT, TRUE);

    IF NOT has_current THEN
        INSERT INTO public.submissions (
            assignment_id, student_id, content, repository_url, files,
            source_zip_url, status, attempt_no, is_current
        ) VALUES (
            input_assignment_id, auth.uid(), NULLIF(BTRIM(COALESCE(input_content, '')), ''),
            normalized_repository_url, stored_files, input_source_zip_url,
            requested_status, 1, TRUE
        ) RETURNING * INTO saved_submission;
    ELSIF current_submission.status = 'draft' THEN
        UPDATE public.submissions
        SET content = NULLIF(BTRIM(COALESCE(input_content, '')), ''),
            repository_url = normalized_repository_url,
            files = stored_files,
            source_zip_url = input_source_zip_url,
            status = requested_status
        WHERE id = current_submission.id
        RETURNING * INTO saved_submission;
    ELSE
        IF current_submission.status IN ('grading', 'graded') OR EXISTS (
            SELECT 1 FROM public.grades g WHERE g.submission_id = current_submission.id
        ) THEN
            RAISE EXCEPTION 'Grading has started; this submission can no longer be changed';
        END IF;
        IF current_submission.attempt_no >= policy_max_attempts THEN
            RAISE EXCEPTION 'Maximum submission attempts reached';
        END IF;

        UPDATE public.submissions
        SET is_current = FALSE
        WHERE id = current_submission.id;

        INSERT INTO public.submissions (
            assignment_id, student_id, content, repository_url, files,
            source_zip_url, status, attempt_no, is_current
        ) VALUES (
            input_assignment_id, auth.uid(), NULLIF(BTRIM(COALESCE(input_content, '')), ''),
            normalized_repository_url, stored_files, input_source_zip_url,
            requested_status, current_submission.attempt_no + 1, TRUE
        ) RETURNING * INTO saved_submission;
    END IF;

    RETURN to_jsonb(saved_submission);
END;
$$;

REVOKE ALL ON FUNCTION public.save_student_submission(UUID, TEXT, TEXT, JSONB, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_student_submission(UUID, TEXT, TEXT, JSONB, TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.save_student_submission(UUID, TEXT, TEXT, JSONB, TEXT, TEXT) IS
    'Only student submission write boundary. Validates ownership, policy, attempts, and preserves resubmission history.';

-- Submitted and historical evidence is immutable to students. Orphan objects
-- remain removable so the application can clean up a partial upload or a failed
-- RPC without requiring a service-role key.
DROP POLICY IF EXISTS "Students replace own submission files" ON storage.objects;
CREATE POLICY "Students clean orphan or draft submission files"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'submissions'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
    AND public.is_active_student()
    AND (
        NOT EXISTS (
            SELECT 1 FROM public.submissions s
            WHERE s.files @> jsonb_build_array(jsonb_build_object('path', storage.objects.name))
        )
        OR EXISTS (
            SELECT 1 FROM public.submissions s
            WHERE s.student_id = auth.uid()
              AND s.is_current
              AND s.status = 'draft'
              AND s.files @> jsonb_build_array(jsonb_build_object('path', storage.objects.name))
        )
    )
);

-- Assignment objects are public course resources by current product design, but
-- only their owning lecturer (or an admin) may create/delete object paths.
DROP POLICY IF EXISTS "Lecturers and admins can upload assignment files" ON storage.objects;
DROP POLICY IF EXISTS "Lecturers and admins can delete assignment files" ON storage.objects;
CREATE POLICY "Lecturers upload assignment files to own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'assignments'
    AND (storage.foldername(name))[1] = auth.uid()::TEXT
    AND public.is_lecturer()
);
CREATE POLICY "Assignment owners or admins delete assignment files"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'assignments'
    AND (
        public.is_admin()
        OR (
            public.is_lecturer()
            AND (storage.foldername(name))[1] = auth.uid()::TEXT
        )
    )
);
