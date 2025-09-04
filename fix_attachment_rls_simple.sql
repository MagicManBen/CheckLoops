-- Alternative simpler RLS policies for complaint_attachments table
-- Run this ONLY if the first set of policies don't work

-- Drop existing policies (if any)
DROP POLICY IF EXISTS "authenticated_users_can_insert_complaint_attachments" ON complaint_attachments;
DROP POLICY IF EXISTS "authenticated_users_can_select_complaint_attachments" ON complaint_attachments;
DROP POLICY IF EXISTS "authenticated_users_can_update_complaint_attachments" ON complaint_attachments;
DROP POLICY IF EXISTS "authenticated_users_can_delete_complaint_attachments" ON complaint_attachments;

-- Simple policy: allow all authenticated users full access
CREATE POLICY "authenticated_users_full_access_complaint_attachments" 
ON complaint_attachments 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Check if policies were created successfully
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'complaint_attachments';
