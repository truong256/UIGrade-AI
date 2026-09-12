-- Harden grading boundaries without deleting or rewriting application data.

CREATE OR REPLACE FUNCTION public.protect_published_ai_feedback()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF OLD.status = 'published'
       AND NEW.ai_feedback IS DISTINCT FROM OLD.ai_feedback THEN
        RAISE EXCEPTION 'AI feedback on a published grade is immutable';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_published_ai_feedback ON public.grades;
CREATE TRIGGER trg_protect_published_ai_feedback
BEFORE UPDATE OF ai_feedback ON public.grades
FOR EACH ROW EXECUTE FUNCTION public.protect_published_ai_feedback();

REVOKE ALL ON FUNCTION public.protect_published_ai_feedback() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.lock_submission_after_grading_starts()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    actor_role TEXT;
    jwt_role TEXT;
BEGIN
    jwt_role := COALESCE(auth.jwt()->>'role', current_setting('request.jwt.claim.role', true));
    IF jwt_role IS DISTINCT FROM 'service_role' THEN
        SELECT role INTO actor_role
        FROM public.profiles
        WHERE id = auth.uid() AND status = 'active';

        IF actor_role = 'student'
           AND EXISTS (SELECT 1 FROM public.grades g WHERE g.submission_id = OLD.id) THEN
            RAISE EXCEPTION 'Grading has started; this submission can no longer be changed';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lock_submission_after_grading_starts ON public.submissions;
CREATE TRIGGER trg_lock_submission_after_grading_starts
BEFORE UPDATE ON public.submissions
FOR EACH ROW EXECUTE FUNCTION public.lock_submission_after_grading_starts();

REVOKE ALL ON FUNCTION public.lock_submission_after_grading_starts() FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.lock_assignment_grading_schema()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF (
        NEW.max_score IS DISTINCT FROM OLD.max_score
        OR NEW.rubric IS DISTINCT FROM OLD.rubric
    ) AND EXISTS (
        SELECT 1
        FROM public.submissions s
        JOIN public.grades g ON g.submission_id = s.id
        WHERE s.assignment_id = OLD.id
    ) THEN
        RAISE EXCEPTION 'Rubric and maximum score are locked after grading starts';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lock_assignment_grading_schema ON public.assignments;
CREATE TRIGGER trg_lock_assignment_grading_schema
BEFORE UPDATE OF max_score, rubric ON public.assignments
FOR EACH ROW EXECUTE FUNCTION public.lock_assignment_grading_schema();

REVOKE ALL ON FUNCTION public.lock_assignment_grading_schema() FROM PUBLIC;
