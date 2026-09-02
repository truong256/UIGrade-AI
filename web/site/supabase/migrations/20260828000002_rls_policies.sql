-- ====================================================================
-- Migration: 20260828000002_rls_policies.sql
-- Description: Enable and configure Row Level Security (RLS) policies
-- ====================================================================

-- Helper functions to check user roles safely without recursive query
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_lecturer_or_admin()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('lecturer', 'teacher', 'admin')
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 1. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_configs ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- PROFILES POLICIES
-- ====================================================================
CREATE POLICY "Profiles are viewable by authenticated users"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile (except role)"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id AND (
        role = (SELECT role FROM public.profiles WHERE id = auth.uid()) OR public.is_admin()
    )
);

CREATE POLICY "Admins can update any profile"
ON public.profiles FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ====================================================================
-- CLASSES POLICIES
-- ====================================================================
CREATE POLICY "Lecturers can create classes"
ON public.classes FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = lecturer_id AND public.is_lecturer_or_admin()
);

CREATE POLICY "Classes are viewable by lecturer, members, or by class code lookup"
ON public.classes FOR SELECT
TO authenticated
USING (
    lecturer_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.class_members
        WHERE class_members.class_id = classes.id
          AND class_members.student_id = auth.uid()
    )
    OR status = 'active' -- Allows lookup to join
);

CREATE POLICY "Lecturers can update their own classes"
ON public.classes FOR UPDATE
TO authenticated
USING (lecturer_id = auth.uid() OR public.is_admin())
WITH CHECK (lecturer_id = auth.uid() OR public.is_admin());

CREATE POLICY "Lecturers can delete their own classes"
ON public.classes FOR DELETE
TO authenticated
USING (lecturer_id = auth.uid() OR public.is_admin());

-- ====================================================================
-- CLASS MEMBERS POLICIES
-- ====================================================================
CREATE POLICY "Class members viewable by class teacher and classmates"
ON public.class_members FOR SELECT
TO authenticated
USING (
    student_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.classes
        WHERE classes.id = class_members.class_id
          AND classes.lecturer_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1 FROM public.class_members AS cm
        WHERE cm.class_id = class_members.class_id
          AND cm.student_id = auth.uid()
    )
);

CREATE POLICY "Students can join class for themselves"
ON public.class_members FOR INSERT
TO authenticated
WITH CHECK (
    student_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.classes
        WHERE classes.id = class_members.class_id
          AND classes.lecturer_id = auth.uid()
    )
);

CREATE POLICY "Lecturers and Admins can update/remove members"
ON public.class_members FOR UPDATE
TO authenticated
USING (
    public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.classes
        WHERE classes.id = class_members.class_id
          AND classes.lecturer_id = auth.uid()
    )
);

CREATE POLICY "Lecturers and Admins can delete members"
ON public.class_members FOR DELETE
TO authenticated
USING (
    student_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.classes
        WHERE classes.id = class_members.class_id
          AND classes.lecturer_id = auth.uid()
    )
);

-- ====================================================================
-- ASSIGNMENTS POLICIES
-- ====================================================================
CREATE POLICY "Assignments viewable by enrolled students and class teachers"
ON public.assignments FOR SELECT
TO authenticated
USING (
    lecturer_id = auth.uid()
    OR public.is_admin()
    OR (
        status = 'published' AND EXISTS (
            SELECT 1 FROM public.class_members
            WHERE class_members.class_id = assignments.class_id
              AND class_members.student_id = auth.uid()
        )
    )
);

CREATE POLICY "Lecturers can insert assignments in their classes"
ON public.assignments FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = lecturer_id AND public.is_lecturer_or_admin()
);

CREATE POLICY "Lecturers can update their assignments"
ON public.assignments FOR UPDATE
TO authenticated
USING (lecturer_id = auth.uid() OR public.is_admin())
WITH CHECK (lecturer_id = auth.uid() OR public.is_admin());

CREATE POLICY "Lecturers can delete their assignments"
ON public.assignments FOR DELETE
TO authenticated
USING (lecturer_id = auth.uid() OR public.is_admin());

-- ====================================================================
-- SUBMISSIONS POLICIES
-- ====================================================================
CREATE POLICY "Students can view only their own submissions, lecturers view class submissions"
ON public.submissions FOR SELECT
TO authenticated
USING (
    student_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.assignments a
        JOIN public.classes c ON a.class_id = c.id
        WHERE a.id = submissions.assignment_id
          AND c.lecturer_id = auth.uid()
    )
);

CREATE POLICY "Students can submit their own work"
ON public.submissions FOR INSERT
TO authenticated
WITH CHECK (
    student_id = auth.uid()
    AND EXISTS (
        SELECT 1 FROM public.assignments a
        JOIN public.class_members cm ON a.class_id = cm.class_id
        WHERE a.id = submissions.assignment_id
          AND cm.student_id = auth.uid()
          AND a.is_active = true
    )
);

CREATE POLICY "Students can update their un-graded submissions, lecturers can grade"
ON public.submissions FOR UPDATE
TO authenticated
USING (
    (student_id = auth.uid() AND status IN ('pending', 'error'))
    OR public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.assignments a
        JOIN public.classes c ON a.class_id = c.id
        WHERE a.id = submissions.assignment_id
          AND c.lecturer_id = auth.uid()
    )
);

-- ====================================================================
-- GRADES POLICIES
-- ====================================================================
CREATE POLICY "Grades viewable by submission owner and class lecturer"
ON public.grades FOR SELECT
TO authenticated
USING (
    lecturer_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (
        SELECT 1 FROM public.submissions s
        WHERE s.id = grades.submission_id
          AND s.student_id = auth.uid()
    )
);

CREATE POLICY "Lecturers can insert/update grades"
ON public.grades FOR ALL
TO authenticated
USING (
    lecturer_id = auth.uid() OR public.is_admin()
)
WITH CHECK (
    lecturer_id = auth.uid() OR public.is_admin()
);

-- ====================================================================
-- RUBRICS POLICIES
-- ====================================================================
CREATE POLICY "Rubrics viewable by class members and teachers"
ON public.rubrics FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Lecturers and admins can manage rubrics"
ON public.rubrics FOR ALL
TO authenticated
USING (public.is_lecturer_or_admin())
WITH CHECK (public.is_lecturer_or_admin());

-- ====================================================================
-- NOTIFICATIONS POLICIES
-- ====================================================================
CREATE POLICY "Users can view and manage their own notifications"
ON public.notifications FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ====================================================================
-- SYSTEM CONFIGS POLICIES
-- ====================================================================
CREATE POLICY "System configs viewable by authenticated users"
ON public.system_configs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify system configs"
ON public.system_configs FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
