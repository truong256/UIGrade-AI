-- ====================================================================
-- Migration: 20260902000001_fix_rls_security.sql
-- Description: Harden RLS policies to enforce RBAC properly
--
-- CHANGES:
--  1. Update role helper functions with explicit search_path (SECURITY DEFINER hardening)
--  2. Profiles SELECT: Restrict to own profile + classmates (not all users)
--  3. System configs SELECT: Restrict to admin only (was authenticated)
--  4. Profiles UPDATE: Prevent self-role escalation
--
-- IMPORTANT: DO NOT apply automatically to production without review.
-- Refer to README_SECURITY_MIGRATION.md for safety & verification steps.
-- ====================================================================

-- ============================================================
-- 1. Hardened Role Helper Functions (with explicit search_path)
-- ============================================================

-- is_admin: checks if authenticated user has 'admin' role in profiles
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

-- is_lecturer: matches both canonical 'lecturer' and legacy 'teacher'
CREATE OR REPLACE FUNCTION public.is_lecturer()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('lecturer', 'teacher')
    );
$$;

-- is_lecturer_or_admin: matches lecturer, teacher, or admin
CREATE OR REPLACE FUNCTION public.is_lecturer_or_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('lecturer', 'teacher', 'admin')
    );
$$;

-- ============================================================
-- 2. PROFILES: Restrict SELECT policy
-- ============================================================

-- Drop the overly permissive policy (which allowed all authenticated users to view all profiles)
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Profiles viewable by self, classmates, or admin" ON public.profiles;

-- Replacement: Users can only see their own profile and profiles of classmates
-- Admins can see all profiles
CREATE POLICY "Profiles viewable by self, classmates, or admin"
ON public.profiles FOR SELECT
TO authenticated
USING (
    -- User can always see their own profile
    id = auth.uid()
    -- Admin can see all profiles
    OR public.is_admin()
    -- Lecturers can see profiles of students in their classes
    OR (
        public.is_lecturer() AND EXISTS (
            SELECT 1 FROM public.class_members cm
            JOIN public.classes c ON c.id = cm.class_id
            WHERE cm.student_id = public.profiles.id
              AND c.lecturer_id = auth.uid()
        )
    )
    -- Students can see profiles of classmates (in the same class)
    OR EXISTS (
        SELECT 1 FROM public.class_members cm1
        JOIN public.class_members cm2 ON cm1.class_id = cm2.class_id
        WHERE cm1.student_id = auth.uid()
          AND cm2.student_id = public.profiles.id
    )
);

-- ============================================================
-- 3. SYSTEM CONFIGS: Restrict SELECT to admin only
-- ============================================================

-- Drop the overly permissive read policy
DROP POLICY IF EXISTS "System configs viewable by authenticated users" ON public.system_configs;
DROP POLICY IF EXISTS "Only admins can read system configs" ON public.system_configs;

-- Replacement: Only admins can read system configs
CREATE POLICY "Only admins can read system configs"
ON public.system_configs FOR SELECT
TO authenticated
USING (public.is_admin());

-- ============================================================
-- 4. PROFILES: Ensure users cannot escalate their own role
-- ============================================================

DROP POLICY IF EXISTS "Users can update their own profile (except role)" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile (not role)" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

-- Users can update their own non-role fields
CREATE POLICY "Users can update their own profile (not role)"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id
    -- Prevent self-role escalation: role cannot change via this policy
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- Admins have full update access
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
