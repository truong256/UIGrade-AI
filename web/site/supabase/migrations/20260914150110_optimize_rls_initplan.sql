-- Evaluate auth.uid() once per statement instead of once per candidate row.
-- ALTER POLICY retains each policy's command and role list; only its existing
-- USING/WITH CHECK expressions are rewritten without changing their boolean
-- authorization logic.
DO $$
DECLARE
    policy_row RECORD;
    statement TEXT;
BEGIN
    FOR policy_row IN
        SELECT schemaname, tablename, policyname, qual, with_check
        FROM pg_catalog.pg_policies
        WHERE schemaname = 'public'
          AND (
              POSITION('auth.uid()' IN COALESCE(qual, '')) > 0
              OR POSITION('auth.uid()' IN COALESCE(with_check, '')) > 0
          )
    LOOP
        statement := FORMAT(
            'ALTER POLICY %I ON %I.%I',
            policy_row.policyname,
            policy_row.schemaname,
            policy_row.tablename
        );

        IF policy_row.qual IS NOT NULL THEN
            statement := statement || FORMAT(
                ' USING (%s)',
                REPLACE(policy_row.qual, 'auth.uid()', '(select auth.uid())')
            );
        END IF;

        IF policy_row.with_check IS NOT NULL THEN
            statement := statement || FORMAT(
                ' WITH CHECK (%s)',
                REPLACE(policy_row.with_check, 'auth.uid()', '(select auth.uid())')
            );
        END IF;

        EXECUTE statement;
    END LOOP;
END;
$$;

-- The relationship policy already includes private.is_admin(), so the
-- separate admin SELECT policy is redundant. INSERT and UPDATE are combined
-- as boolean ORs to preserve the previous policy truth table with one policy
-- evaluation per operation.
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can select any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;

ALTER POLICY "Users can insert own onboarding profile"
ON public.profiles
WITH CHECK (
    private.is_admin()
    OR (
        (select auth.uid()) = id
        AND role IN ('student', 'lecturer', 'pending')
        AND status = 'active'
    )
);

ALTER POLICY "Users can update own profile or complete onboarding"
ON public.profiles
USING (
    private.is_admin() OR (select auth.uid()) = id
)
WITH CHECK (
    private.is_admin()
    OR (
        (select auth.uid()) = id
        AND role IN ('student', 'lecturer', 'pending')
    )
);
