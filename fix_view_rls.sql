-- RLS Policy for 'complaint_summary' view

-- This policy allows users to view the summarized complaint data that belongs to their assigned site.
-- It uses the helper function `get_current_user_site_id()` created previously.

CREATE POLICY "Allow users to view their site's complaint summaries"
ON public.complaint_summary
FOR SELECT
TO authenticated
USING (site_id = get_current_user_site_id());
