-- Supabase Storage Migration for Vendor Logos
-- Run this in Supabase SQL Editor or Dashboard

-- Create the storage bucket for vendor logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vendor-logos',
  'vendor-logos',
  true,  -- Public bucket so logos are accessible on public bill pages
  5242880,  -- 5MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Policy: Anyone can view logos (public bucket)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'vendor-logos');

-- Policy: Service role can upload/update/delete (handled via API with service role key)
-- No additional policies needed since we use the admin client with service role key

-- Alternative: If you want vendors to upload directly (not recommended for this use case)
-- CREATE POLICY "Vendors can upload their own logos"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'vendor-logos' AND
--   (storage.foldername(name))[1] = auth.uid()::text
-- );
