-- RLS Policies for complaint_attachments table
-- Run this in your Supabase SQL editor

-- Allow authenticated users to insert complaint attachments
CREATE POLICY "authenticated_users_can_insert_complaint_attachments" 
ON complaint_attachments 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Allow authenticated users to select complaint attachments for their site
CREATE POLICY "authenticated_users_can_select_complaint_attachments" 
ON complaint_attachments 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM complaints 
    WHERE complaints.id = complaint_attachments.complaint_id 
    AND complaints.site_id = (auth.jwt() ->> 'site_id')::bigint
  )
);

-- Allow authenticated users to update complaint attachments for their site
CREATE POLICY "authenticated_users_can_update_complaint_attachments" 
ON complaint_attachments 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM complaints 
    WHERE complaints.id = complaint_attachments.complaint_id 
    AND complaints.site_id = (auth.jwt() ->> 'site_id')::bigint
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM complaints 
    WHERE complaints.id = complaint_attachments.complaint_id 
    AND complaints.site_id = (auth.jwt() ->> 'site_id')::bigint
  )
);

-- Allow authenticated users to delete complaint attachments for their site
CREATE POLICY "authenticated_users_can_delete_complaint_attachments" 
ON complaint_attachments 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM complaints 
    WHERE complaints.id = complaint_attachments.complaint_id 
    AND complaints.site_id = (auth.jwt() ->> 'site_id')::bigint
  )
);
