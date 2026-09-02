-- ====================================================================
-- Migration: 20260902000001_fix_rls_security.sql
-- Description: Harden RLS policies & add database triggers to enforce RBAC & Last-Admin Invariant
--
-- CHANGES:
--  1. Update role helper functions with explicit search_path (SECURITY DEFINER hardening)
--  2. Profiles SELECT: Restrict to own profile + classmates (not all users)
--  3. System configs SELECT: Restrict to admin only (was authenticated)
--  4. Profiles UPDATE: Prevent self-role escalation via RLS policies
--  5. Database Trigger: Enforce Last-Admin Protection on PostgreSQL engine level (prevents direct REST/PostgREST bypass)
--  6. Database Trigger: Prevent non-admin self-role escalation on PostgreSQL engine level
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
-- 4. PROFILES: RLS Policies for UPDATE
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

-- Admins have update access (guarded at database level by triggers below)
CREATE POLICY "Admins can update any profile"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================
-- 5. DATABASE TRIGGER: Enforce Last-Admin Protection (Atomic & Engine-Level)
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_last_admin_protection()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    active_admin_count INT;
BEGIN
    -- Check if target was an active admin
    IF (OLD.role = 'admin' AND (OLD.status IS NULL OR OLD.status = 'active')) THEN
        -- Case 1: Deletion of an active admin
        IF TG_OP = 'DELETE' THEN
            SELECT COUNT(*) INTO active_admin_count
            FROM public.profiles
            WHERE role = 'admin' AND (status IS NULL OR status = 'active');

            IF active_admin_count <= 1 THEN
                RAISE EXCEPTION 'Cannot delete the last active admin account';
            END IF;
            RETURN OLD;
        END IF;

        -- Case 2: Update of an active admin (demotion or locking)
        IF TG_OP = 'UPDATE' THEN
            IF (NEW.role <> 'admin' OR (NEW.status IS NOT NULL AND NEW.status <> 'active')) THEN
                SELECT COUNT(*) INTO active_admin_count
                FROM public.profiles
                WHERE role = 'admin' AND (status IS NULL OR status = 'active');

                IF active_admin_count <= 1 THEN
                    RAISE EXCEPTION 'Cannot demote or lock the last active admin account';
                END IF;
            END IF;
            RETURN NEW;
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_last_admin ON public.profiles;
CREATE TRIGGER trg_protect_last_admin
BEFORE UPDATE OR DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.enforce_last_admin_protection();

-- ============================================================
-- 6. DATABASE TRIGGER: Prevent Self-Role Escalation (Engine-Level)
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_self_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- If role is changing and user is not an admin, block it
    IF (OLD.role <> NEW.role AND NOT public.is_admin()) THEN
        RAISE EXCEPTION 'Non-admin users cannot modify roles';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_self_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_self_role_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_self_role_escalation();
