-- Isolate internal AI recommendations from official grades visible to students.
-- Existing JSON is copied before the legacy column is cleared; no grading data
-- or application rows are dropped.

CREATE TABLE IF NOT EXISTS public.ai_grading_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL UNIQUE REFERENCES public.submissions(id) ON DELETE CASCADE,
    lecturer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    suggestion JSONB NOT NULL,
    prompt_version TEXT NOT NULL,
    schema_version TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    submission_version TIMESTAMPTZ,
    assignment_version TIMESTAMPTZ,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_grading_suggestions_lecturer
    ON public.ai_grading_suggestions(lecturer_id, generated_at DESC);

ALTER TABLE public.ai_grading_suggestions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ai_grading_suggestions FROM anon;
REVOKE ALL ON public.ai_grading_suggestions FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON public.ai_grading_suggestions TO authenticated;

INSERT INTO public.ai_grading_suggestions (
    submission_id, lecturer_id, suggestion, prompt_version, schema_version,
    provider, model, content_hash, submission_version, assignment_version, generated_at
)
SELECT
    g.submission_id,
    g.lecturer_id,
    g.ai_feedback,
    COALESCE(g.ai_feedback->'metadata'->>'promptVersion', 'legacy'),
    COALESCE(g.ai_feedback->'metadata'->>'schemaVersion', 'legacy'),
    COALESCE(g.ai_feedback->'metadata'->>'provider', 'gemini'),
    COALESCE(g.ai_feedback->'metadata'->>'model', 'unknown'),
    COALESCE(g.ai_feedback->'metadata'->>'contentHash', 'legacy-' || g.id::TEXT),
    s.updated_at,
    a.updated_at,
    COALESCE(g.updated_at, NOW())
FROM public.grades g
JOIN public.submissions s ON s.id = g.submission_id
JOIN public.assignments a ON a.id = s.assignment_id
WHERE g.ai_feedback IS NOT NULL
ON CONFLICT (submission_id) DO UPDATE
SET suggestion = EXCLUDED.suggestion,
    lecturer_id = EXCLUDED.lecturer_id,
    prompt_version = EXCLUDED.prompt_version,
    schema_version = EXCLUDED.schema_version,
    provider = EXCLUDED.provider,
    model = EXCLUDED.model,
    content_hash = EXCLUDED.content_hash,
    submission_version = EXCLUDED.submission_version,
    assignment_version = EXCLUDED.assignment_version,
    generated_at = EXCLUDED.generated_at,
    updated_at = NOW();

-- The copied legacy field must remain empty because published grade rows are
-- directly readable by students through the public Supabase API.
-- The previous immutability trigger protected this legacy column; it is safely
-- replaced below after every value has been copied to the private table.
DROP TRIGGER IF EXISTS trg_protect_published_ai_feedback ON public.grades;
UPDATE public.grades SET ai_feedback = NULL WHERE ai_feedback IS NOT NULL;

CREATE OR REPLACE FUNCTION public.protect_ai_grading_suggestion()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    assignment_lecturer UUID;
    grade_published BOOLEAN;
BEGIN
    IF NOT (public.is_active_user() AND public.is_lecturer()) THEN
        RAISE EXCEPTION 'Only an active lecturer can manage AI grading suggestions';
    END IF;
    IF NEW.lecturer_id IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'AI suggestion actor must be the authenticated lecturer';
    END IF;

    SELECT a.lecturer_id,
           EXISTS (
               SELECT 1 FROM public.grades g
               WHERE g.submission_id = s.id AND g.status = 'published'
           )
    INTO assignment_lecturer, grade_published
    FROM public.submissions s
    JOIN public.assignments a ON a.id = s.assignment_id
    WHERE s.id = NEW.submission_id;

    IF assignment_lecturer IS NULL OR assignment_lecturer IS DISTINCT FROM auth.uid() THEN
        RAISE EXCEPTION 'Lecturer does not own this submission';
    END IF;
    IF grade_published THEN
        RAISE EXCEPTION 'AI suggestion is immutable after grade publication';
    END IF;
    IF TG_OP = 'UPDATE' AND (
        NEW.submission_id IS DISTINCT FROM OLD.submission_id
        OR NEW.lecturer_id IS DISTINCT FROM OLD.lecturer_id
    ) THEN
        RAISE EXCEPTION 'AI suggestion ownership is immutable';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_ai_grading_suggestion ON public.ai_grading_suggestions;
CREATE TRIGGER trg_protect_ai_grading_suggestion
BEFORE INSERT OR UPDATE ON public.ai_grading_suggestions
FOR EACH ROW EXECUTE FUNCTION public.protect_ai_grading_suggestion();

REVOKE ALL ON FUNCTION public.protect_ai_grading_suggestion() FROM PUBLIC;

DROP POLICY IF EXISTS "AI suggestions visible to owner lecturer and admin" ON public.ai_grading_suggestions;
CREATE POLICY "AI suggestions visible to owner lecturer and admin"
ON public.ai_grading_suggestions FOR SELECT TO authenticated
USING (
    public.is_active_user() AND (
        public.is_admin()
        OR (
            lecturer_id = auth.uid()
            AND public.is_lecturer()
            AND EXISTS (
                SELECT 1
                FROM public.submissions s
                JOIN public.assignments a ON a.id = s.assignment_id
                WHERE s.id = ai_grading_suggestions.submission_id
                  AND a.lecturer_id = auth.uid()
            )
        )
    )
);

DROP POLICY IF EXISTS "Owning lecturers insert AI suggestions" ON public.ai_grading_suggestions;
CREATE POLICY "Owning lecturers insert AI suggestions"
ON public.ai_grading_suggestions FOR INSERT TO authenticated
WITH CHECK (
    lecturer_id = auth.uid()
    AND public.is_active_user() AND public.is_lecturer()
    AND EXISTS (
        SELECT 1
        FROM public.submissions s
        JOIN public.assignments a ON a.id = s.assignment_id
        WHERE s.id = ai_grading_suggestions.submission_id
          AND a.lecturer_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Owning lecturers update AI suggestions" ON public.ai_grading_suggestions;
CREATE POLICY "Owning lecturers update AI suggestions"
ON public.ai_grading_suggestions FOR UPDATE TO authenticated
USING (lecturer_id = auth.uid() AND public.is_active_user() AND public.is_lecturer())
WITH CHECK (
    lecturer_id = auth.uid()
    AND public.is_active_user() AND public.is_lecturer()
    AND EXISTS (
        SELECT 1
        FROM public.submissions s
        JOIN public.assignments a ON a.id = s.assignment_id
        WHERE s.id = ai_grading_suggestions.submission_id
          AND a.lecturer_id = auth.uid()
    )
);

CREATE OR REPLACE FUNCTION public.reject_legacy_grade_ai_feedback()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.ai_feedback IS NOT NULL THEN
        RAISE EXCEPTION 'Store AI output in ai_grading_suggestions, not grades';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reject_legacy_grade_ai_feedback ON public.grades;
CREATE TRIGGER trg_reject_legacy_grade_ai_feedback
BEFORE INSERT OR UPDATE OF ai_feedback ON public.grades
FOR EACH ROW EXECUTE FUNCTION public.reject_legacy_grade_ai_feedback();

REVOKE ALL ON FUNCTION public.reject_legacy_grade_ai_feedback() FROM PUBLIC;

DROP TRIGGER IF EXISTS set_ai_grading_suggestions_updated_at ON public.ai_grading_suggestions;
CREATE TRIGGER set_ai_grading_suggestions_updated_at
BEFORE UPDATE ON public.ai_grading_suggestions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.ai_grading_suggestions IS
    'Internal evidence-grounded AI recommendations. Students have no RLS policy and cannot read this table.';
COMMENT ON COLUMN public.grades.ai_feedback IS
    'Deprecated and kept NULL. Internal AI recommendations live in ai_grading_suggestions.';
