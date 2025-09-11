#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Use secret key to bypass RLS
const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_SECRET_KEY = 'sb_secret_j2J5SdPNTzbodsmfJi4IZw_Mg-Rlrxs';
  if (!urlMatch) {
    urlMatch = configContent.match(/window\.SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
  }
  if (!keyMatch) {
    keyMatch = configContent.match(/window\.SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);
  }
  
  if (urlMatch) SUPABASE_URL = urlMatch[1];
  if (keyMatch) SUPABASE_ANON_KEY = keyMatch[1];
} catch (error) {
  console.error('Error reading config.js:', error);
  // Use hardcoded values as fallback
  SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
  SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Use hardcoded values
  SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
  SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';
}

console.log('=== TESTING SUPABASE CONNECTION ===');
console.log('URL:', SUPABASE_URL);
console.log('');

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

async function testConnection() {
  try {
    // Test 1: Check profiles table
    console.log('📊 Checking profiles table...');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, full_name, role, site_id');
    
    if (profileError) {
      console.error('❌ Error reading profiles:', profileError);
    } else {
      console.log(`✅ Found ${profiles.length} profiles:`);
      profiles.forEach(p => {
        console.log(`   - ${p.full_name} (${p.role}) - ID: ${p.user_id}`);
      });
    }
    console.log('');

    // Test 2: Check holiday_entitlements table
    console.log('📊 Checking holiday_entitlements table...');
    const { data: entitlements, error: entError } = await supabase
      .from('holiday_entitlements')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (entError) {
      console.error('❌ Error reading holiday_entitlements:', entError);
    } else {
      console.log(`✅ Found ${entitlements.length} entitlements`);
      if (entitlements && entitlements.length > 0) {
        console.log('Sample entitlements:');
        entitlements.slice(0, 3).forEach(e => {
          console.log(`   - User: ${e.user_id}, Year: ${e.year}, Hours: ${e.annual_hours}, Sessions: ${e.annual_sessions}`);
        });
      }
    }
    console.log('');

    // Test 3: Check holiday_requests table
    console.log('📊 Checking holiday_requests table...');
    const { data: requests, error: reqError } = await supabase
      .from('holiday_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (reqError) {
      console.error('❌ Error reading holiday_requests:', reqError);
    } else {
      console.log(`✅ Found ${requests.length} holiday requests`);
      if (requests && requests.length > 0) {
        console.log('Sample requests:');
        requests.slice(0, 3).forEach(r => {
          console.log(`   - User: ${r.user_id}, Status: ${r.status}, Dates: ${r.start_date} to ${r.end_date}`);
        });
      }
    }
    console.log('');

    // Test 4: Check holiday_request_days table
    console.log('📊 Checking holiday_request_days table...');
    const { data: days, error: daysError } = await supabase
      .from('holiday_request_days')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (daysError) {
      console.error('❌ Error reading holiday_request_days:', daysError);
    } else {
      console.log(`✅ Found ${days.length} holiday days (showing first 10)`);
      if (days && days.length > 0) {
        console.log('Sample days:');
        days.slice(0, 3).forEach(d => {
          console.log(`   - Request: ${d.holiday_request_id}, Date: ${d.date}, Hours: ${d.hours_requested}, Sessions: ${d.sessions_requested}`);
        });
      }
    }
    console.log('');

    // Test 5: Check for Ben and Tom specifically
    console.log('🔍 Checking for Ben Howard and Tom Donlan data...');
    const benId = '55f1b4e6-01f4-452d-8d6c-617fe7794873';
    const tomId = '68a1a111-ac7c-44a3-8fd3-8c37ff07e0a2';
    
    // Ben's entitlements
    const { data: benEnt } = await supabase
      .from('holiday_entitlements')
      .select('*')
      .eq('user_id', benId);
    
    if (benEnt && benEnt.length > 0) {
      console.log('✅ Ben Howard has entitlements:', benEnt);
    } else {
      console.log('❌ No entitlements found for Ben Howard');
    }
    
    // Ben's requests
    const { data: benReq } = await supabase
      .from('holiday_requests')
      .select('*')
      .eq('user_id', benId);
    
    if (benReq && benReq.length > 0) {
      console.log(`✅ Ben Howard has ${benReq.length} holiday requests`);
    } else {
      console.log('❌ No holiday requests found for Ben Howard');
    }
    
    // Tom's entitlements
    const { data: tomEnt } = await supabase
      .from('holiday_entitlements')
      .select('*')
      .eq('user_id', tomId);
    
    if (tomEnt && tomEnt.length > 0) {
      console.log('✅ Tom Donlan has entitlements:', tomEnt);
    } else {
      console.log('❌ No entitlements found for Tom Donlan');
    }
    
    // Tom's requests
    const { data: tomReq } = await supabase
      .from('holiday_requests')
      .select('*')
      .eq('user_id', tomId);
    
    if (tomReq && tomReq.length > 0) {
      console.log(`✅ Tom Donlan has ${tomReq.length} holiday requests`);
    } else {
      console.log('❌ No holiday requests found for Tom Donlan');
    }
    
    console.log('\n=== CONNECTION TEST COMPLETE ===');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testConnection();