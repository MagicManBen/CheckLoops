-- Insert test complaint data for development/testing
-- Replace the site_id with an actual site_id from your sites table

-- First, let's get a site_id (replace with your actual site_id)
-- You can find your site_id by running: SELECT id, site_name FROM public.sites;

DO $$
DECLARE
  test_site_id bigint;
  test_complaint_id uuid;
BEGIN
  -- Get the first available site_id
  SELECT id INTO test_site_id FROM public.sites LIMIT 1;
  
  IF test_site_id IS NULL THEN
    RAISE EXCEPTION 'No sites found. Please create a site first.';
  END IF;

  -- Insert test complaint
  INSERT INTO public.complaints (
    site_id,
    datetime,
    patient_initials,
    category,
    original_complaint,
    response,
    lessons_learned,
    status,
    priority,
    share_with_team,
    ai_extracted
  ) VALUES (
    test_site_id,
    '2024-12-20T10:30:00Z',
    'J.D.',
    'Communication',
    'Patient complained that they were not informed about the side effects of their new medication. They experienced nausea and dizziness but were not warned this might happen. The patient felt this was poor communication from the prescribing doctor.',
    'We apologized to the patient and arranged a follow-up appointment with the prescribing doctor. The doctor explained the side effects in detail and adjusted the medication dosage. We also reviewed our medication counseling protocols.',
    'Need to ensure all prescribing doctors provide comprehensive medication counseling including common side effects. Consider implementing a medication information checklist.',
    'resolved',
    'medium',
    true,
    false
  ) RETURNING id INTO test_complaint_id;

  -- Insert a test note for this complaint
  INSERT INTO public.complaint_notes (
    complaint_id,
    note_text,
    note_type,
    created_by
  ) VALUES (
    test_complaint_id,
    'Follow-up appointment scheduled for next week to check medication tolerance.',
    'follow_up',
    (SELECT id FROM auth.users LIMIT 1)
  );

  -- Insert another test complaint
  INSERT INTO public.complaints (
    site_id,
    datetime,
    patient_initials,
    category,
    original_complaint,
    response,
    lessons_learned,
    status,
    priority,
    share_with_team,
    ai_extracted
  ) VALUES (
    test_site_id,
    '2024-12-19T14:15:00Z',
    'M.S.',
    'Access/Appointments',
    'Patient was unable to get an urgent appointment for 3 days despite explaining they had severe symptoms. They had to go to A&E instead. Patient felt the receptionist was dismissive of their concerns.',
    'We implemented a new triage system where urgent requests are immediately escalated to a nurse for assessment. The receptionist involved received additional training on empathy and active listening.',
    'Urgent appointment triage system needed improvement. Staff training on patient communication is essential for maintaining trust.',
    'resolved',
    'high',
    true,
    false
  );

  -- Insert a pending complaint
  INSERT INTO public.complaints (
    site_id,
    datetime,
    patient_initials,
    category,
    original_complaint,
    status,
    priority,
    share_with_team,
    ai_extracted
  ) VALUES (
    test_site_id,
    '2024-12-21T09:00:00Z',
    'A.B.',
    'Facilities',
    'Patient complained about the waiting room being too cold and uncomfortable seating. They mentioned this has been an ongoing issue for several months.',
    'pending',
    'low',
    false,
    false
  );

  RAISE NOTICE 'Test complaints inserted successfully for site_id: %', test_site_id;
END $$;
