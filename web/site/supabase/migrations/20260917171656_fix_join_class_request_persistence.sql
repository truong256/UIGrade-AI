-- SPDX-License-Identifier: MIT
-- Copyright (c) 2026 UIGrade AI contributors

-- Preserve the result of the membership lookup before COUNT(*) changes
-- PL/pgSQL's special FOUND variable. Previously a first-time join entered the
-- UPDATE branch with a null membership id, updated zero rows, and still
-- returned a successful pending response.
CREATE OR REPLACE FUNCTION public.join_class_by_code(input_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    normalized_code TEXT := UPPER(BTRIM(COALESCE(input_code, '')));
    target_class public.classes%ROWTYPE;
    membership public.class_members%ROWTYPE;
    existing_membership_found BOOLEAN := FALSE;
    current_active_members INT;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    IF NOT private.is_active_student() THEN
        RAISE EXCEPTION 'Only an active student can join a class';
    END IF;

    IF normalized_code = '' OR LENGTH(normalized_code) > 64 THEN
        RAISE EXCEPTION 'Mã lớp không tồn tại.';
    END IF;

    SELECT c.* INTO target_class
    FROM public.classes c
    WHERE UPPER(BTRIM(c.class_code)) = normalized_code
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Mã lớp không tồn tại.';
    END IF;

    IF target_class.status != 'active' THEN
        RAISE EXCEPTION 'Lớp học hiện không nhận thêm sinh viên.';
    END IF;

    SELECT cm.* INTO membership
    FROM public.class_members cm
    WHERE cm.class_id = target_class.id
      AND cm.student_id = auth.uid()
    FOR UPDATE;

    existing_membership_found := FOUND;

    IF existing_membership_found THEN
        IF membership.status = 'active' THEN
            RAISE EXCEPTION 'Bạn đã tham gia lớp học này.';
        ELSIF membership.status = 'pending' THEN
            RAISE EXCEPTION 'Yêu cầu tham gia lớp đang chờ giảng viên duyệt.';
        END IF;
    END IF;

    SELECT COUNT(*) INTO current_active_members
    FROM public.class_members cm
    WHERE cm.class_id = target_class.id
      AND cm.status = 'active';

    IF current_active_members >= 50 THEN
        RAISE EXCEPTION 'Lớp học đã đạt số lượng thành viên tối đa.';
    END IF;

    IF existing_membership_found THEN
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
'Allows authenticated active students to submit a persisted pending join request with capacity check (max 50 active members). Requires lecturer approval.';
