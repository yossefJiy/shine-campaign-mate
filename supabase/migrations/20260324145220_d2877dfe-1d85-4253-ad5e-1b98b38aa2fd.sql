-- Make task-attachments bucket public so images display inline
UPDATE storage.buckets SET public = true WHERE id = 'task-attachments';

-- Ensure RLS policies exist for uploads
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload task attachments' AND tablename = 'objects') THEN
    CREATE POLICY "Authenticated users can upload task attachments"
    ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'task-attachments');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can read task attachments' AND tablename = 'objects') THEN
    CREATE POLICY "Anyone can read task attachments"
    ON storage.objects FOR SELECT TO public
    USING (bucket_id = 'task-attachments');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can delete task attachments' AND tablename = 'objects') THEN
    CREATE POLICY "Authenticated users can delete task attachments"
    ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'task-attachments');
  END IF;
END $$;