-- Create the reference-videos storage bucket (public so FAL can download from it)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reference-videos',
  'reference-videos',
  true,
  209715200, -- 200 MB
  ARRAY['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to reference-videos bucket
CREATE POLICY "Admin users can upload reference videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'reference-videos');

-- Allow public read access so FAL can download
CREATE POLICY "Public read access for reference videos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'reference-videos');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Admin users can delete reference videos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'reference-videos');
