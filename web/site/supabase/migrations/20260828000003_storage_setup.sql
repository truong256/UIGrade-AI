-- ====================================================================
-- Migration: 20260828000003_storage_setup.sql
-- Description: Create Supabase Storage buckets and security policies
-- ====================================================================

-- 1. Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
    ('assignments', 'assignments', true, 52428800, ARRAY['application/pdf', 'application/zip', 'application/x-zip-compressed', 'application/vnd.android.package-archive', 'image/png', 'image/jpeg']),
    ('submissions', 'submissions', false, 104857600, ARRAY['application/vnd.android.package-archive', 'application/zip', 'application/x-zip-compressed', 'application/octet-stream', 'image/png', 'image/jpeg'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Avatars Storage Policies
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Assignments Storage Policies
CREATE POLICY "Assignment files are viewable by authenticated users"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'assignments');

CREATE POLICY "Lecturers and admins can upload assignment files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'assignments'
    AND public.is_lecturer_or_admin()
);

CREATE POLICY "Lecturers and admins can delete assignment files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'assignments'
    AND public.is_lecturer_or_admin()
);

-- 4. Submissions Storage Policies
CREATE POLICY "Students can upload submissions to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'submissions'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Students can read their own submission files, teachers can read all submissions"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'submissions'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.is_lecturer_or_admin()
    )
);

CREATE POLICY "Students can delete/replace their own submission files before grading"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'submissions'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.is_admin()
    )
);
