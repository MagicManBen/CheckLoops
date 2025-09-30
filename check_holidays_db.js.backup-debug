import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oajszsjpluislmvfkmzi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hanN6c2pwbHVpc2xtdmZrbXppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjA0NTIzNzYsImV4cCI6MjAzNjAyODM3Nn0.w5F-LgXevgFfRKjCdNiLOe7lbXEp3dPXNe_rnoyT7xQ';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkHolidays() {
  // Check recent holiday bookings
  const { data: holidays, error } = await supabase
    .from('4_holiday_bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (error) {
    console.error('Error fetching holidays:', error);
    return;
  }
  
  console.log('\n📊 Recent Holiday Bookings:');
  console.log('=' .repeat(60));
  
  if (holidays && holidays.length > 0) {
    holidays.forEach((h, i) => {
      console.log(`\n${i + 1}. Holiday Request:`);
      console.log(`   ID: ${h.id}`);
      console.log(`   Staff Profile: ${h.staff_profile_id}`);
      console.log(`   Dates: ${h.start_date} to ${h.end_date}`);
      console.log(`   Type: ${h.booking_type}`);
      console.log(`   Status: ${h.status}`);
      console.log(`   Destination: ${h.destination || 'Not specified'}`);
      console.log(`   Created: ${h.created_at}`);
    });
    
    // Check for Tokyo destination
    const tokyoHoliday = holidays.find(h => h.destination && h.destination.includes('Tokyo'));
    if (tokyoHoliday) {
      console.log('\n✅ SUCCESS: Found holiday with Tokyo destination!');
      console.log('   This confirms the holiday submission is working.');
    }
  } else {
    console.log('No holiday bookings found in database.');
  }
}

checkHolidays().catch(console.error);