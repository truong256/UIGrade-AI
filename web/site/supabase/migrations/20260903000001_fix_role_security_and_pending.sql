-- ====================================================================
-- Migration: 20260903000001_fix_role_security_and_pending.sql
-- Description:
--   1. Add the temporary 'pending' role for OAuth onboarding
--   2. Create profiles from auth.users without defaulting Google users to student
--   3. Allow exactly one self-service pending -> student/lecturer transition
--   4. Keep admin assignment restricted to an existing admin or service_role
--
-- SAFETY: This migration does not delete tables or application rows.
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- The original class_members SELECT policy queried class_members itself and
-- classes (whose SELECT policy queries class_members). Profile SELECT joins
-- these tables too. Break that RLS recursion without broadening visibility.
-- The migration owner must own these tables, as with the existing is_admin().
CREATE OR REPLACE FUNCTION public.can_read_class_members(target_class_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT auth.uid() IS NOT NULL AND (
        EXISTS (
            SELECT 1 FROM public.classes c
            WHERE c.id = target_class_id AND c.lecturer_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.class_members cm
            WHERE cm.class_id = target_class_id AND cm.student_id = auth.uid()
        )
    );
$$;

REVOKE ALL ON FUNCTION public.can_read_class_members(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_read_class_members(UUID) TO authenticated;

DROP POLICY IF EXISTS "Class members viewable by class teacher and classmates"
    ON public.class_members;
CREATE POLICY "Class members viewable by class teacher and classmates"
ON public.class_members FOR SELECT
TO authenticated
USING (
    student_id = auth.uid()
    OR public.is_admin()
    OR public.can_read_class_members(class_id)
);

-- Keep all existing application roles and add the temporary onboarding state.
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('student', 'lecturer', 'teacher', 'admin', 'pending'));

-- Harden helper functions created by earlier migrations.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    );
$$;

-- New auth users receive a profile whose PK is exactly auth.users.id.
-- Only student/lecturer metadata is accepted. Google users normally have no role,
-- so they remain pending until they explicitly complete onboarding.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    requested_role TEXT;
BEGIN
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
            NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
            'Người dùng'
        ),
        COALESCE(NEW.email, ''),
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Replace all earlier self-update policies with one explicit policy. The RLS
-- policy rejects admin as a self-selected value; the trigger below also proves
-- the old role was pending before allowing a role transition.
DROP POLICY IF EXISTS "Users can update their own profile (except role)" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile (not role)" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile fields (no role escalation)" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or complete onboarding" ON public.profiles;

CREATE POLICY "Users can update own profile or complete onboarding"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id
    AND role IN ('student', 'lecturer', 'teacher', 'pending')
);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile (student or lecturer only)" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own onboarding profile" ON public.profiles;

CREATE POLICY "Users can insert own onboarding profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = id
    AND role IN ('student', 'lecturer', 'pending')
    AND status = 'active'
);

-- Existing authenticated admins keep their profile-management policy.
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile including role" ON public.profiles;

CREATE POLICY "Admins can update any profile including role"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Earlier migration 20260902000001 created this function but blocked every
-- non-admin role change, including legitimate onboarding. Preserve its strong
-- default and allow only the user's own pending -> student/lecturer transition.
CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    jwt_role TEXT;
BEGIN
    -- auth.jwt() reads the current PostgREST JWT claims. Keep the legacy
    -- per-claim setting as a fallback for older/self-hosted PostgREST setups.
    jwt_role := COALESCE(
        auth.jwt()->>'role',
        current_setting('request.jwt.claim.role', true)
    );

    IF public.is_admin() OR jwt_role = 'service_role' THEN
        RETURN NEW;
    END IF;

    -- A banned/inactive user must not reactivate themselves through PostgREST.
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        RAISE EXCEPTION 'Account status change is not allowed for this user';
    END IF;

    IF OLD.role IS NOT DISTINCT FROM NEW.role THEN
        RETURN NEW;
    END IF;

    IF auth.uid() = OLD.id
       AND OLD.role = 'pending'
       AND OLD.status = 'active'
       AND NEW.role IN ('student', 'lecturer') THEN
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Role change is not allowed for this user';
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_self_role_escalation
BEFORE UPDATE OF role, status ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_self_role_escalation();

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

COMMENT ON COLUMN public.profiles.role IS
    'student | lecturer | admin; pending is temporary onboarding state. '
    'Users may only self-select student or lecturer once from pending.';
