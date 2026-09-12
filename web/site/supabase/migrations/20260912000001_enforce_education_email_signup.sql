-- ====================================================================
-- Enforce the education-email rule for newly created Auth users.
--
-- SAFETY:
--   * Forward-only: no table, profile, Auth user, or application row is deleted.
--   * Existing users (including legacy Admin accounts outside .edu.vn) are not
--     changed and continue to authenticate normally.
--   * profiles.id remains exactly auth.users.id.
--   * Only student/lecturer metadata is accepted; all other new users remain
--     pending until role onboarding.
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    requested_role TEXT;
    normalized_email TEXT;
    email_domain TEXT;
BEGIN
    normalized_email := LOWER(TRIM(COALESCE(NEW.email, '')));
    email_domain := SPLIT_PART(normalized_email, '@', 2);

    IF normalized_email = ''
       OR POSITION('@' IN normalized_email) <= 1
       OR NOT (email_domain = 'edu.vn' OR email_domain LIKE '%.edu.vn') THEN
        RAISE EXCEPTION USING
            ERRCODE = 'check_violation',
            MESSAGE = 'New accounts require an .edu.vn email address';
    END IF;

    requested_role := CASE NEW.raw_user_meta_data->>'role'
        WHEN 'student' THEN 'student'
        WHEN 'lecturer' THEN 'lecturer'
        ELSE 'pending'
    END;

    INSERT INTO public.profiles (
        id,
        full_name,
        email,
        avatar_url,
        role,
        status,
        student_code
    )
    VALUES (
        NEW.id,
        COALESCE(
            NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
            NULLIF(NEW.raw_user_meta_data->>'name', ''),
            NULLIF(SPLIT_PART(normalized_email, '@', 1), ''),
            'Người dùng'
        ),
        normalized_email,
        COALESCE(
            NULLIF(NEW.raw_user_meta_data->>'avatar_url', ''),
            NULLIF(NEW.raw_user_meta_data->>'picture', '')
        ),
        requested_role,
        'active',
        CASE
            WHEN requested_role = 'student'
                THEN NULLIF(NEW.raw_user_meta_data->>'student_code', '')
            ELSE NULL
        END
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
        updated_at = NOW();

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS
    'Creates one pending/student/lecturer profile for a new .edu.vn Auth user; existing users are unaffected.';
