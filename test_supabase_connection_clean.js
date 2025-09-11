#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Use secret key to bypass RLS for verification
const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_SECRET_KEY = 'sb_secret_j2J5SdPNTzbodsmfJi4IZw_Mg-Rlrxs';

console.log('=== TESTING SUPABASE CONNECTION WITH SECRET KEY ===');
console.log('URL:', SUPABASE_URL);
console.log('');

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

// User IDs to check for
const BEN_ID = '55f1b4e6-01f4-452d-8d6c-617fe7794873';
const TOM_ID = '68a1a111-ac7c-44a3-8fd3-8c37ff07e0a2';

async function testConnection() {
  try {
    // Test 1: Check profiles table
    console.log('📊 Checking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(10);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
    } else {
      console.log(`✅ Found ${profiles.length} profiles:`);
      profiles.forEach(profile => {
        console.log(`  - ${profile.email || profile.id} (${profile.role || 'no role'})`);
      });
    }

    // Test 2: Check holiday entitlements
    console.log('\n📊 Checking holiday_entitlements table...');
    const { data: entitlements, error: entError } = await supabase
      .from('holiday_entitlements')
      .select('*')
      .order('created_at', { ascending: false });

    if (entError) {
      console.error('❌ Error fetching entitlements:', entError);
    } else {
      console.log(`✅ Found ${entitlements.length} entitlements`);
      entitlements.forEach(ent => {
        console.log(`  - User ${ent.user_id}: ${ent.annual_hours}h / ${ent.annual_sessions}s for ${ent.year}`);
      });
    }

    // Test 3: Check holiday requests
    console.log('\n📊 Checking holiday_requests table...');
    const { data: requests, error: reqError } = await supabase
      .from('holiday_requests')
      .select('*')
      .order('start_date', { ascending: false });

    if (reqError) {
      console.error('❌ Error fetching requests:', reqError);
    } else {
      console.log(`✅ Found ${requests.length} holiday requests`);
      requests.slice(0, 5).forEach(req => {
        console.log(`  - User ${req.user_id}: ${req.start_date} to ${req.end_date} (${req.status})`);
      });
      if (requests.length > 5) {
        console.log(`  ... and ${requests.length - 5} more`);
      }
    }

    // Test 4: Check holiday request days
    console.log('\n📊 Checking holiday_request_days table...');
    const { data: days, error: daysError } = await supabase
      .from('holiday_request_days')
      .select('*')
      .order('holiday_date', { ascending: false })
      .limit(10);

    if (daysError) {
      console.error('❌ Error fetching days:', daysError);
    } else {
      console.log(`✅ Found ${days.length} holiday days (showing first 10)`);
      days.forEach(day => {
        console.log(`  - ${day.holiday_date}: ${day.hours_requested}h / ${day.sessions_requested}s`);
      });
    }

    // Test 5: Check specific users
    console.log('\n🔍 Checking for Ben Howard and Tom Donlan data...');
    
    // Ben Howard entitlements
    const { data: benEnt } = await supabase
      .from('holiday_entitlements')
      .select('*')
      .eq('user_id', BEN_ID);
    
    console.log(benEnt?.length > 0 ? `✅ Found ${benEnt.length} entitlements for Ben Howard` : '❌ No entitlements found for Ben Howard');

    // Ben Howard requests
    const { data: benReq } = await supabase
      .from('holiday_requests')
      .select('*')
      .eq('user_id', BEN_ID);
    
    console.log(benReq?.length > 0 ? `✅ Found ${benReq.length} holiday requests for Ben Howard` : '❌ No holiday requests found for Ben Howard');

    // Tom Donlan entitlements
    const { data: tomEnt } = await supabase
      .from('holiday_entitlements')
      .select('*')
      .eq('user_id', TOM_ID);
    
    console.log(tomEnt?.length > 0 ? `✅ Found ${tomEnt.length} entitlements for Tom Donlan` : '❌ No entitlements found for Tom Donlan');

    // Tom Donlan requests
    const { data: tomReq } = await supabase
      .from('holiday_requests')
      .select('*')
      .eq('user_id', TOM_ID);
    
    console.log(tomReq?.length > 0 ? `✅ Found ${tomReq.length} holiday requests for Tom Donlan` : '❌ No holiday requests found for Tom Donlan');

  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

testConnection().then(() => {
  console.log('\n=== CONNECTION TEST COMPLETE ===');
});