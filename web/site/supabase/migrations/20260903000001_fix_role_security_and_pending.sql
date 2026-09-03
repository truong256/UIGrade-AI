-- ====================================================================
-- Migration: 20260903000001_fix_role_security_and_pending.sql
-- Description: 
--   1. Add 'pending' as valid role during Google OAuth onboarding
--   2. Tighten RLS so users cannot self-elevate role to 'admin'
--   3. Only admin (via service_role) can set role = 'admin'
-- ====================================================================

-- 1. Allow 'pending' role temporarily during Google OAuth onboarding
-- Drop and recreate the check constraint to include 'pending'
ALTER TABLE public.profiles
    DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check
    CHECK (role IN ('student', 'lecturer', 'teacher', 'admin', 'pending'));

-- 2. Drop old profiles UPDATE policy that was too permissive
DROP POLICY IF EXISTS "Users can update their own profile (except role)" ON public.profiles;

-- 3. Create tighter profile self-update policy
-- Users can update their OWN profile, but CANNOT change their role to anything
-- except their current role. Role changes require admin access via service_role.
CREATE POLICY "Users can update their own profile fields (no role escalation)"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- 4. Separate policy for INSERT (new profile via API — role must not be 'admin')
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Users can insert their own profile (student or lecturer only)"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = id
    AND role IN ('student', 'lecturer', 'pending')
);

-- 5. Ensure the is_admin helper function exists (in case migration 002 was not run)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 6. Admin override: admin can update any profile including role
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Admins can update any profile including role"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 7. Add index on role for performance (idempotent)
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

COMMENT ON COLUMN public.profiles.role IS
    'User role: student | lecturer | admin. pending = Google OAuth onboarding in progress. '
    'Only service_role (admin API) can set role = admin.';
