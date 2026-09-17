-- SPDX-License-Identifier: MIT
-- Copyright (c) 2026 UIGrade AI contributors

-- ====================================================================
-- Migration: Lecturer Approval workflow for class joining
-- 1. Student joins class -> status = 'pending'
-- 2. Duplicate join checks:
--    - Already active: 'Bạn đã tham gia lớp học này.'
--    - Already pending: 'Yêu cầu tham gia lớp đang chờ giảng viên duyệt.'
-- 3. Capacity limit: 50 active students
-- 4. RLS updates:
--    - Students can view their own membership (including pending)
--    - Students can view basic class metadata when membership is pending
--    - Assignments remain viewable ONLY by active students
-- ====================================================================

-- 1. Replace join_class_by_code function to implement Lecturer Approval
CREATE OR REPLACE FUNCTION public.join_class_by_code(input_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    normalized_code TEXT := UPPER(BTRIM(COALESCE(input_code, '')));
    target_class public.classes%ROWTYPE;
    membership public.class_members%ROWTYPE;
    current_active_members INT;
BEGIN
    -- 1. Must be authenticated
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- 2. Must be an active student
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid()
          AND p.role = 'student'
          AND p.status = 'active'
    ) THEN
        RAISE EXCEPTION 'Only an active student can join a class';
    END IF;

    -- 3. Validate code format
    IF normalized_code = '' OR LENGTH(normalized_code) > 64 THEN
        RAISE EXCEPTION 'Mã lớp không tồn tại.';
    END IF;

    -- 4. Lookup class with row lock
    SELECT c.* INTO target_class
    FROM public.classes c
    WHERE UPPER(BTRIM(c.class_code)) = normalized_code
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Mã lớp không tồn tại.';
    END IF;

    -- 5. Class status check
    IF target_class.status != 'active' THEN
        RAISE EXCEPTION 'Lớp học hiện không nhận thêm sinh viên.';
    END IF;

    -- 6. Check existing membership
    SELECT cm.* INTO membership
    FROM public.class_members cm
    WHERE cm.class_id = target_class.id
      AND cm.student_id = auth.uid()
    FOR UPDATE;

    IF FOUND THEN
        IF membership.status = 'active' THEN
            RAISE EXCEPTION 'Bạn đã tham gia lớp học này.';
        ELSIF membership.status = 'pending' THEN
            RAISE EXCEPTION 'Yêu cầu tham gia lớp đang chờ giảng viên duyệt.';
        END IF;
    END IF;

    -- 7. Enforce class capacity limit of 50 active students
    SELECT COUNT(*) INTO current_active_members
    FROM public.class_members cm
    WHERE cm.class_id = target_class.id
      AND cm.status = 'active';

    IF current_active_members >= 50 THEN
        RAISE EXCEPTION 'Lớp học đã đạt số lượng thành viên tối đa.';
    END IF;

    -- 8. Add or reactivate membership with pending status (Lecturer Approval required)
    IF FOUND THEN
        UPDATE public.class_members
        SET status = 'pending', joined_at = NOW(), updated_at = NOW()
        WHERE id = membership.id;
    ELSE
        INSERT INTO public.class_members (class_id, student_id, status, joined_at, updated_at)
        VALUES (target_class.id, auth.uid(), 'pending', NOW(), NOW());
    END IF;

    RETURN jsonb_build_object(
        'classId', target_class.id,
        'className', target_class.name,
        'membershipStatus', 'pending',
        'message', 'Yêu cầu tham gia lớp đã được gửi và đang chờ giảng viên phê duyệt.'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.join_class_by_code(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_class_by_code(TEXT) TO authenticated;

COMMENT ON FUNCTION public.join_class_by_code(TEXT) IS
'Allows authenticated active students to submit a join request with pending status and capacity check (max 50 active members). Requires lecturer approval.';

-- 2. Update RLS on class_members to allow students to read their own membership status
DROP POLICY IF EXISTS "Authorized users can view class members" ON public.class_members;
CREATE POLICY "Authorized users can view class members"
ON public.class_members FOR SELECT
TO authenticated
USING (
    public.is_active_user()
    AND (
        public.is_admin()
        OR public.owns_class(class_id)
        OR (
            status = 'active'
            AND public.is_active_class_member(class_id)
        )
        OR (
            public.is_active_student()
            AND student_id = auth.uid()
        )
    )
);

-- 3. Update RLS on classes to allow students with pending membership to view class metadata
DROP POLICY IF EXISTS "Authorized users can view related classes" ON public.classes;
CREATE POLICY "Authorized users can view related classes"
ON public.classes FOR SELECT
TO authenticated
USING (
    public.is_active_user()
    AND (
        public.is_admin()
        OR (public.is_lecturer() AND lecturer_id = auth.uid())
        OR public.is_active_class_member(id)
        OR (
            public.is_active_student()
            AND EXISTS (
                SELECT 1 FROM public.class_members cm
                WHERE cm.class_id = classes.id
                  AND cm.student_id = auth.uid()
                  AND cm.status = 'pending'
            )
        )
    )
);
