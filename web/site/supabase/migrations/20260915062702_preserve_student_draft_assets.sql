-- Preserve files already attached to a student's current draft when the
-- student finalizes it without uploading the same file again.
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
    source_zip_path TEXT := input_source_zip_url;
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

    SELECT s.* INTO current_submission
    FROM public.submissions s
    WHERE s.assignment_id = input_assignment_id
      AND s.student_id = auth.uid() AND s.is_current
    FOR UPDATE;
    has_current := FOUND;

    IF has_current
       AND current_submission.status = 'draft'
       AND jsonb_array_length(stored_files) = 0 THEN
        stored_files := COALESCE(current_submission.files, '[]'::jsonb);
        source_zip_path := current_submission.source_zip_url;
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

    IF source_zip_path IS NOT NULL AND (
        LEFT(source_zip_path, LENGTH(object_prefix)) <> object_prefix
        OR source_zip_path !~* '\.zip$'
        OR NOT EXISTS (
            SELECT 1 FROM jsonb_array_elements(stored_files) AS item
            WHERE item->>'path' = source_zip_path
        )
    ) THEN
        RAISE EXCEPTION 'Source ZIP path is invalid';
    END IF;
    IF input_action = 'submit' AND policy_requires_zip AND source_zip_path IS NULL THEN
        RAISE EXCEPTION 'A source ZIP file is required';
    END IF;
    IF input_action = 'submit' AND jsonb_array_length(stored_files) = 0
       AND normalized_repository_url IS NULL THEN
        RAISE EXCEPTION 'A file or repository URL is required';
    END IF;

    requested_status := CASE WHEN input_action = 'draft' THEN 'draft' ELSE 'pending' END;
    PERFORM set_config('uigrade.submission_rpc_actor', auth.uid()::TEXT, TRUE);

    IF NOT has_current THEN
        INSERT INTO public.submissions (
            assignment_id, student_id, content, repository_url, files,
            source_zip_url, status, attempt_no, is_current
        ) VALUES (
            input_assignment_id, auth.uid(), NULLIF(BTRIM(COALESCE(input_content, '')), ''),
            normalized_repository_url, stored_files, source_zip_path,
            requested_status, 1, TRUE
        ) RETURNING * INTO saved_submission;
    ELSIF current_submission.status = 'draft' THEN
        UPDATE public.submissions
        SET content = NULLIF(BTRIM(COALESCE(input_content, '')), ''),
            repository_url = normalized_repository_url,
            files = stored_files,
            source_zip_url = source_zip_path,
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
            normalized_repository_url, stored_files, source_zip_path,
            requested_status, current_submission.attempt_no + 1, TRUE
        ) RETURNING * INTO saved_submission;
    END IF;

    RETURN to_jsonb(saved_submission);
END;
$$;

REVOKE ALL ON FUNCTION public.save_student_submission(UUID, TEXT, TEXT, JSONB, TEXT, TEXT)
FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_student_submission(UUID, TEXT, TEXT, JSONB, TEXT, TEXT)
TO authenticated;
