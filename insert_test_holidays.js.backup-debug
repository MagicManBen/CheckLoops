import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function insertTestHolidays() {
  console.log('Inserting test holiday data...');
  
  // First, get the site ID for Harley Street Medical Centre
  const { data: site } = await supabase
    .from('sites')
    .select('id')
    .eq('name', 'Harley Street Medical Centre')
    .single();
  
  const siteId = site?.id || 2;
  console.log(`Using site ID: ${siteId}`);
  
  // Insert holiday requests with staff_name field for non-registered users
  const holidayRequests = [
    {
      site_id: siteId,
      staff_name: 'Kelly Amison',
      start_date: '2025-08-11',
      end_date: '2025-08-15',
      request_type: 'holiday',
      total_hours: 40,
      status: 'approved',
      admin_comments: 'Approved by management'
    },
    {
      site_id: siteId,
      staff_name: 'Georgiana Sima',
      start_date: '2025-07-11',
      end_date: '2025-07-11',
      request_type: 'holiday',
      total_hours: 8,
      status: 'approved',
      admin_comments: 'Spoken to Gemma and Ben as it is less than 2 weeks notice'
    },
    {
      site_id: siteId,
      staff_name: 'Alexa Moreton',
      start_date: '2025-08-13',
      end_date: '2025-08-13',
      request_type: 'holiday',
      total_hours: 8,
      status: 'approved'
    },
    {
      site_id: siteId,
      staff_name: 'Sarah Masterson',
      start_date: '2025-08-18',
      end_date: '2025-08-29',
      request_type: 'holiday',
      total_hours: 80,
      status: 'approved'
    },
    {
      site_id: siteId,
      staff_name: 'Tom Donlan',
      start_date: '2025-11-17',
      end_date: '2025-11-21',
      request_type: 'holiday',
      total_hours: 40,
      status: 'approved'
    },
    {
      site_id: siteId,
      staff_name: 'Tracy Heaton',
      start_date: '2025-09-12',
      end_date: '2025-09-12',
      request_type: 'holiday',
      total_hours: 8,
      status: 'approved'
    },
    {
      site_id: siteId,
      staff_name: 'Carly Tweedie',
      start_date: '2025-10-27',
      end_date: '2025-10-31',
      request_type: 'holiday',
      total_hours: 40,
      status: 'approved',
      admin_comments: 'Half term'
    },
    {
      site_id: siteId,
      staff_name: 'Kasim Hussain',
      start_date: '2025-09-08',
      end_date: '2025-09-12',
      request_type: 'holiday',
      total_hours: 40,
      status: 'approved'
    },
    {
      site_id: siteId,
      staff_name: 'Susan Heath',
      start_date: '2025-09-01',
      end_date: '2025-09-02',
      request_type: 'holiday',
      total_hours: 16,
      status: 'approved'
    },
    {
      site_id: siteId,
      staff_name: 'Gemma Keeling',
      start_date: '2026-07-27',
      end_date: '2026-07-31',
      request_type: 'holiday',
      total_hours: 40,
      status: 'approved',
      admin_comments: 'Would like to book something while we\'re here for next year'
    },
    {
      site_id: siteId,
      staff_name: 'Saba Khalid',
      start_date: '2025-07-22',
      end_date: '2025-07-22',
      request_type: 'holiday',
      total_hours: 8,
      status: 'approved',
      admin_comments: 'Hospital appointment'
    },
    {
      site_id: siteId,
      staff_name: 'Kelly Mansell',
      start_date: '2025-09-02',
      end_date: '2025-09-17',
      request_type: 'holiday',
      total_hours: 96,
      status: 'approved',
      admin_comments: 'Already accepted by PCN, 24 hours in total'
    },
    // GP holiday requests (with sessions instead of hours)
    {
      site_id: siteId,
      staff_name: 'Monique Keersmaekers',
      start_date: '2025-09-23',
      end_date: '2025-09-26',
      request_type: 'holiday',
      total_sessions: 8,
      status: 'approved'
    },
    {
      site_id: siteId,
      staff_name: 'Monique Keersmaekers',
      start_date: '2025-11-05',
      end_date: '2025-11-05',
      request_type: 'holiday',
      total_sessions: 2,
      status: 'approved',
      admin_comments: 'Afternoon please as I need to go to London for conference'
    },
    {
      site_id: siteId,
      staff_name: 'Monique Keersmaekers',
      start_date: '2025-12-09',
      end_date: '2025-12-12',
      request_type: 'holiday',
      total_sessions: 8,
      status: 'approved'
    },
    {
      site_id: siteId,
      staff_name: 'Ashwini Nayak',
      start_date: '2025-09-29',
      end_date: '2025-09-30',
      request_type: 'holiday',
      total_sessions: 4,
      status: 'approved'
    },
    {
      site_id: siteId,
      staff_name: 'Ashwini Nayak',
      start_date: '2026-01-05',
      end_date: '2026-01-05',
      request_type: 'holiday',
      total_sessions: 2,
      status: 'approved'
    }
  ];
  
  // Insert all holiday requests
  for (const request of holidayRequests) {
    const { error } = await supabase
      .from('holiday_requests')
      .insert(request);
    
    if (error) {
      console.error(`Error inserting holiday for ${request.staff_name}:`, error);
    } else {
      console.log(`✓ Added holiday request for ${request.staff_name}: ${request.start_date} to ${request.end_date}`);
    }
  }
  
  console.log('\n✅ Test holiday data inserted successfully!');
}

insertTestHolidays().catch(console.error);