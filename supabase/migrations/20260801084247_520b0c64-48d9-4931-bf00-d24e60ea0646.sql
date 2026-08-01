CREATE POLICY "submissions_own_read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'submissions' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_staff(auth.uid())));
CREATE POLICY "submissions_own_insert" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "submissions_own_update" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "submissions_own_delete" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'submissions' AND auth.uid()::text = (storage.foldername(name))[1]);