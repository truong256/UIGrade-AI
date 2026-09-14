-- Keep RLS helpers available to policies without exposing them as REST RPCs.
-- The private schema is deliberately not part of Supabase's exposed schemas.
CREATE SCHEMA IF NOT EXISTS private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

ALTER FUNCTION public.is_active_user() SET SCHEMA private;
ALTER FUNCTION public.is_active_student() SET SCHEMA private;
ALTER FUNCTION public.is_active_class_member(UUID) SET SCHEMA private;
ALTER FUNCTION public.owns_class(UUID) SET SCHEMA private;
ALTER FUNCTION public.can_read_class_members(UUID) SET SCHEMA private;
ALTER FUNCTION public.is_admin() SET SCHEMA private;
ALTER FUNCTION public.is_lecturer() SET SCHEMA private;
ALTER FUNCTION public.is_lecturer_or_admin() SET SCHEMA private;

CREATE OR REPLACE FUNCTION private.is_active_user()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION private.is_active_student()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'student' AND status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION private.is_lecturer()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'lecturer' AND status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION private.is_lecturer_or_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('lecturer', 'admin') AND status = 'active'
    );
$$;

CREATE OR REPLACE FUNCTION private.is_active_class_member(target_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT private.is_active_student()
       AND EXISTS (
            SELECT 1 FROM public.class_members cm
            WHERE cm.class_id = target_class_id
              AND cm.student_id = auth.uid()
              AND cm.status = 'active'
       );
$$;

CREATE OR REPLACE FUNCTION private.owns_class(target_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT private.is_lecturer()
       AND EXISTS (
            SELECT 1 FROM public.classes c
            WHERE c.id = target_class_id AND c.lecturer_id = auth.uid()
       );
$$;

CREATE OR REPLACE FUNCTION private.can_read_class_members(target_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT private.is_active_user()
       AND (
            private.is_admin()
            OR EXISTS (
                SELECT 1 FROM public.classes c
                WHERE c.id = target_class_id
                  AND c.lecturer_id = auth.uid()
                  AND private.is_lecturer()
            )
            OR EXISTS (
                SELECT 1 FROM public.class_members cm
                WHERE cm.class_id = target_class_id
                  AND cm.student_id = auth.uid()
                  AND cm.status = 'active'
                  AND private.is_active_student()
            )
       );
$$;

REVOKE ALL ON FUNCTION private.is_active_user() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_active_student() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_active_class_member(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.owns_class(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.can_read_class_members(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_lecturer() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.is_lecturer_or_admin() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION private.is_active_user() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_active_student() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_active_class_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.owns_class(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_read_class_members(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_lecturer() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_lecturer_or_admin() TO authenticated;

-- These are the only two intentional public business RPCs. Both validate the
-- current user and all ownership constraints in their function bodies.
ALTER FUNCTION public.join_class_by_code(TEXT) SET search_path = '';

REVOKE ALL ON FUNCTION public.join_class_by_code(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_class_by_code(TEXT) TO authenticated;

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
SET search_path = ''
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
    IF NOT private.is_active_student() THEN
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
    IF input_action = 'submit' AND jsonb_array_length(stored_files) = 0
       AND normalized_repository_url IS NULL THEN
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

REVOKE ALL ON FUNCTION public.save_student_submission(UUID, TEXT, TEXT, JSONB, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_student_submission(UUID, TEXT, TEXT, JSONB, TEXT, TEXT) TO authenticated;
