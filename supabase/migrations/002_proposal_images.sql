-- ============================================
-- PROPOSAL SITE IMAGES
-- ============================================
CREATE TABLE proposal_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE proposal_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage proposal images" ON proposal_images
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Public can view proposal images" ON proposal_images
  FOR SELECT USING (TRUE);

-- ============================================
-- SUPABASE STORAGE BUCKET FOR PROPOSAL IMAGES
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'proposal-images',
  'proposal-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload proposal images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'proposal-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Public can view proposal images in storage" ON storage.objects
  FOR SELECT USING (bucket_id = 'proposal-images');

CREATE POLICY "Authenticated users can delete proposal images" ON storage.objects
  FOR DELETE USING (bucket_id = 'proposal-images' AND auth.uid() IS NOT NULL);
