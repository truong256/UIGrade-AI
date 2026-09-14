ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS cohort TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_email_lower
    ON public.profiles (LOWER(email));

CREATE INDEX IF NOT EXISTS idx_profiles_student_code
    ON public.profiles(student_code)
    WHERE student_code IS NOT NULL;
