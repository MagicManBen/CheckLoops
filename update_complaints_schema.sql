-- Update complaints table structure to match new format
-- First, add new columns
ALTER TABLE public.complaints 
ADD COLUMN IF NOT EXISTS complaint_date DATE,
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS complaint_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS response_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS complaint_summary TEXT,
ADD COLUMN IF NOT EXISTS solution_given TEXT,
ADD COLUMN IF NOT EXISTS category_trends VARCHAR(50), -- MEDICATION/COMMUNICATION/ADMIN/MEDICAL/APPT SYSTEM/OUTSIDE AGENCIES/GDPR
ADD COLUMN IF NOT EXISTS people_involved TEXT,
ADD COLUMN IF NOT EXISTS avenue_used VARCHAR(100), -- How they complained (phone, email, in person, etc.)
ADD COLUMN IF NOT EXISTS suggestions_prevent_reoccurrence TEXT,
ADD COLUMN IF NOT EXISTS actions_to_be_taken TEXT;

-- Update existing data to populate complaint_date from datetime
UPDATE public.complaints 
SET complaint_date = DATE(datetime) 
WHERE complaint_date IS NULL AND datetime IS NOT NULL;

-- Update existing data to populate complaint_summary from original_complaint
UPDATE public.complaints 
SET complaint_summary = original_complaint 
WHERE complaint_summary IS NULL AND original_complaint IS NOT NULL;

-- Update existing data to populate solution_given from response
UPDATE public.complaints 
SET solution_given = response 
WHERE solution_given IS NULL AND response IS NOT NULL;

-- Update existing data to populate suggestions_prevent_reoccurrence from lessons_learned
UPDATE public.complaints 
SET suggestions_prevent_reoccurrence = lessons_learned 
WHERE suggestions_prevent_reoccurrence IS NULL AND lessons_learned IS NOT NULL;

-- Generate complaint numbers for existing records that don't have them
WITH numbered AS (
	SELECT id,
				 site_id,
				 ROW_NUMBER() OVER (PARTITION BY site_id ORDER BY created_at, id) AS rn
	FROM public.complaints
	WHERE complaint_number IS NULL
)
UPDATE public.complaints c
SET complaint_number = 'C' || LPAD(numbered.rn::text, 4, '0')
FROM numbered
WHERE c.id = numbered.id;

-- Update complaint_categories table with new standardized categories
DELETE FROM public.complaint_categories WHERE site_id = 0;

INSERT INTO public.complaint_categories (id, site_id, name, description, active, created_at) VALUES 
(gen_random_uuid(), 0, 'MEDICATION', 'Issues related to medication errors, prescriptions, or pharmacy services', true, now()),
(gen_random_uuid(), 0, 'COMMUNICATION', 'Problems with information sharing, staff communication, or clarity of instructions', true, now()),
(gen_random_uuid(), 0, 'ADMIN', 'Administrative issues including billing, records, scheduling systems', true, now()),
(gen_random_uuid(), 0, 'MEDICAL', 'Clinical care, treatment decisions, medical procedures', true, now()),
(gen_random_uuid(), 0, 'APPT SYSTEM', 'Appointment booking, availability, scheduling problems', true, now()),
(gen_random_uuid(), 0, 'OUTSIDE AGENCIES', 'Issues involving external organizations or referrals', true, now()),
(gen_random_uuid(), 0, 'GDPR', 'Data protection, privacy, or information governance concerns', true, now());

-- Add index on complaint_number for better performance
CREATE INDEX IF NOT EXISTS idx_complaints_complaint_number ON public.complaints(complaint_number);
CREATE INDEX IF NOT EXISTS idx_complaints_category_trends ON public.complaints(category_trends);
CREATE INDEX IF NOT EXISTS idx_complaints_complaint_date ON public.complaints(complaint_date);

-- Add comments to document the new structure
COMMENT ON COLUMN public.complaints.complaint_date IS 'Date when the complaint was made (separate from datetime of record creation)';
COMMENT ON COLUMN public.complaints.age IS 'Age of the patient making the complaint';
COMMENT ON COLUMN public.complaints.complaint_number IS 'Unique complaint reference number (e.g., C0001)';
COMMENT ON COLUMN public.complaints.response_sent IS 'Whether a response has been sent to the complainant';
COMMENT ON COLUMN public.complaints.complaint_summary IS 'Brief summary of the complaint';
COMMENT ON COLUMN public.complaints.solution_given IS 'Description of the solution or resolution provided';
COMMENT ON COLUMN public.complaints.category_trends IS 'Standardized category for trending analysis';
COMMENT ON COLUMN public.complaints.people_involved IS 'Names or roles of staff/people involved in the incident';
COMMENT ON COLUMN public.complaints.avenue_used IS 'Method used to submit the complaint (phone, email, letter, in-person)';
COMMENT ON COLUMN public.complaints.suggestions_prevent_reoccurrence IS 'Suggestions to prevent similar complaints in future';
COMMENT ON COLUMN public.complaints.actions_to_be_taken IS 'Specific actions planned or taken to address the issue';
