-- Ensure chat attachment storage bucket and policies exist.

INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Chat attachments upload" ON storage.objects;
DROP POLICY IF EXISTS "Chat attachments read" ON storage.objects;
DROP POLICY IF EXISTS "Chat attachments update" ON storage.objects;
DROP POLICY IF EXISTS "Chat attachments delete" ON storage.objects;

CREATE POLICY "Chat attachments upload"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Chat attachments read"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Chat attachments update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'chat-attachments')
WITH CHECK (bucket_id = 'chat-attachments');

CREATE POLICY "Chat attachments delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat-attachments');
