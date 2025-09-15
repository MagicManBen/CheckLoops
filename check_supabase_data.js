import { createClient } from '@supabase/supabase-js';

// Read Supabase credentials from file
import { readFileSync } from 'fs';
const info = readFileSync('./SupabaseInfo.txt', 'utf8');
const urlMatch = info.match(/URL: (https:\/\/[^\s]+)/);
const keyMatch = info.match(/ANON KEY: ([^\s]+)/);

if (!urlMatch || !keyMatch) {
  console.error('Could not find Supabase credentials');
  process.exit(1);
}

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function checkData() {
  console.log('Checking Supabase data...\n');

  // Check staff holiday profiles
  console.log('1. Staff Holiday Profiles:');
  const { data: profiles, error: profileError } = await supabase
    .from('1_staff_holiday_profiles')
    .select('*')
    .order('full_name');

  if (profileError) {
    console.error('Error:', profileError);
  } else {
    profiles.forEach(p => {
      console.log(`  - ${p.full_name} (ID: ${p.id}, Role: ${p.role}, GP: ${p.is_gp})`);
    });
  }

  // Check entitlements
  console.log('\n2. Staff Entitlements (2025):');
  const { data: entitlements, error: entError } = await supabase
    .from('2_staff_entitlements')
    .select('*')
    .eq('year', 2025)
    .order('staff_id');

  if (entError) {
    console.error('Error:', entError);
  } else {
    entitlements.forEach(e => {
      console.log(`  Staff ID ${e.staff_id}:`);
      console.log(`    - Weekly: ${e.weekly_hours} hrs, ${e.weekly_sessions} sessions`);
      console.log(`    - Multiplier: ${e.multiplier}`);
      console.log(`    - Calculated: ${e.calculated_hours} hrs, ${e.calculated_sessions} sessions`);
      console.log(`    - Override: ${e.override}`);
    });
  }

  // Check working patterns
  console.log('\n3. Working Patterns:');
  const { data: patterns, error: patternError } = await supabase
    .from('3_staff_working_patterns')
    .select('*')
    .order('user_id');

  if (patternError) {
    console.error('Error:', patternError);
  } else {
    patterns.forEach(p => {
      console.log(`  User ${p.user_id}:`);
      console.log(`    Mon: ${p.monday_hours} / ${p.monday_sessions} sessions`);
      console.log(`    Tue: ${p.tuesday_hours} / ${p.tuesday_sessions} sessions`);
      console.log(`    Wed: ${p.wednesday_hours} / ${p.wednesday_sessions} sessions`);
      console.log(`    Thu: ${p.thursday_hours} / ${p.thursday_sessions} sessions`);
      console.log(`    Fri: ${p.friday_hours} / ${p.friday_sessions} sessions`);
      console.log(`    Total: ${p.total_hours} hrs, ${p.total_sessions} sessions`);
    });
  }

  console.log('\n✅ Data check complete');
}

checkData().catch(console.error);