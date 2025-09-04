-- 1. Ensure RLS policies are properly configured for complaints
-- Enable RLS on all complaint tables
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to manage complaints
-- Users can see and manage complaints for their site
DROP POLICY IF EXISTS "Users can view complaints for their site" ON public.complaints;
CREATE POLICY "Users can view complaints for their site" ON public.complaints
  FOR SELECT USING (
    site_id IN (
      SELECT site_id FROM auth.users 
      WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert complaints for their site" ON public.complaints;
CREATE POLICY "Users can insert complaints for their site" ON public.complaints
  FOR INSERT WITH CHECK (
    site_id IN (
      SELECT site_id FROM auth.users 
      WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update complaints for their site" ON public.complaints;
CREATE POLICY "Users can update complaints for their site" ON public.complaints
  FOR UPDATE USING (
    site_id IN (
      SELECT site_id FROM auth.users 
      WHERE id = auth.uid()
    )
  );

-- Similar policies for complaint_attachments
DROP POLICY IF EXISTS "Users can manage attachments for their site complaints" ON public.complaint_attachments;
CREATE POLICY "Users can manage attachments for their site complaints" ON public.complaint_attachments
  FOR ALL USING (
    complaint_id IN (
      SELECT id FROM public.complaints 
      WHERE site_id IN (
        SELECT site_id FROM auth.users WHERE id = auth.uid()
      )
    )
  );

-- Policies for complaint_notes
DROP POLICY IF EXISTS "Users can manage notes for their site complaints" ON public.complaint_notes;
CREATE POLICY "Users can manage notes for their site complaints" ON public.complaint_notes
  FOR ALL USING (
    complaint_id IN (
      SELECT id FROM public.complaints 
      WHERE site_id IN (
        SELECT site_id FROM auth.users WHERE id = auth.uid()
      )
    )
  );

-- 2. Add useful indexes for performance
CREATE INDEX IF NOT EXISTS idx_complaints_site_datetime ON public.complaints(site_id, datetime DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON public.complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaint_attachments_complaint_id ON public.complaint_attachments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_notes_complaint_id ON public.complaint_notes(complaint_id);

-- 3. Add foreign key constraints if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_complaints_site_id'
  ) THEN
    ALTER TABLE public.complaints 
    ADD CONSTRAINT fk_complaints_site_id 
    FOREIGN KEY (site_id) REFERENCES public.sites(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_complaints_created_by'
  ) THEN
    ALTER TABLE public.complaints 
    ADD CONSTRAINT fk_complaints_created_by 
    FOREIGN KEY (created_by) REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_complaint_attachments_complaint_id'
  ) THEN
    ALTER TABLE public.complaint_attachments 
    ADD CONSTRAINT fk_complaint_attachments_complaint_id 
    FOREIGN KEY (complaint_id) REFERENCES public.complaints(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'fk_complaint_notes_complaint_id'
  ) THEN
    ALTER TABLE public.complaint_notes 
    ADD CONSTRAINT fk_complaint_notes_complaint_id 
    FOREIGN KEY (complaint_id) REFERENCES public.complaints(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 4. Ensure storage bucket exists and has proper permissions
INSERT INTO storage.buckets (id, name, public)
VALUES ('pir_attachments', 'pir_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to the bucket
CREATE POLICY IF NOT EXISTS "Users can upload complaint attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'pir_attachments');

-- Allow users to read their own site's attachments
CREATE POLICY IF NOT EXISTS "Users can view complaint attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'pir_attachments');
