#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

// Supabase credentials
const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// User IDs
const BEN_ID = '55f1b4e6-01f4-452d-8d6c-617fe7794873';
const TOM_ID = '68a1a111-ac7c-44a3-8fd3-8c37ff07e0a2';

// Staff mapping from clean_staff_mapping.csv
const staffData = {
  'Ben Howard': {
    id: BEN_ID,
    role: 'Manager',
    entitlement: '8 days, 9:47:00'
  },
  'Tom Donlan': {
    id: TOM_ID,
    role: 'Admin',
    entitlement: '9 days, 8:13:00'
  }
};

async function clearExistingData() {
  console.log('🧹 Clearing existing data...');
  
  // First get the request IDs to delete
  const { data: requests } = await supabase
    .from('holiday_requests')
    .select('id')
    .in('user_id', [BEN_ID, TOM_ID]);
  
  if (requests && requests.length > 0) {
    const requestIds = requests.map(r => r.id);
    
    // Clear holiday_request_days first (foreign key constraint)
    const { error: daysError } = await supabase
      .from('holiday_request_days')
      .delete()
      .in('holiday_request_id', requestIds);
    
    if (daysError) {
      console.error('Error clearing days:', daysError);
    }
  }
  
  // Clear holiday_requests
  const { error: reqError } = await supabase
    .from('holiday_requests')
    .delete()
    .in('user_id', [BEN_ID, TOM_ID]);
  
  if (reqError) {
    console.error('Error clearing requests:', reqError);
  }
  
  // Clear holiday_entitlements
  const { error: entError } = await supabase
    .from('holiday_entitlements')
    .delete()
    .in('user_id', [BEN_ID, TOM_ID]);
  
  if (entError) {
    console.error('Error clearing entitlements:', entError);
  }
  
  console.log('✅ Existing data cleared');
}

async function insertEntitlements() {
  console.log('\n📊 Inserting holiday entitlements...');
  
  for (const [name, data] of Object.entries(staffData)) {
    // Parse entitlement
    let annual_hours = 0; // Store as decimal number
    let annual_sessions = 0;
    
    if (data.entitlement.includes('days')) {
      // Format: "X days, HH:MM:SS"
      const match = data.entitlement.match(/(\d+) days?,\s*(\d+):(\d+):(\d+)/);
      if (match) {
        const days = parseInt(match[1]);
        const hours = parseInt(match[2]);
        const minutes = parseInt(match[3]);
        const seconds = parseInt(match[4]);
        
        // Calculate total hours as a decimal number
        annual_hours = (days * 7.5) + hours + (minutes / 60) + (seconds / 3600);
      }
    }
    
    const entitlement = {
      user_id: data.id,
      site_id: 2,
      year: 2025,
      annual_hours: annual_hours.toFixed(2), // Store as decimal with 2 decimal places
      annual_sessions: annual_sessions,
      annual_education_sessions: 0,
      carried_over_hours: 0,
      carried_over_sessions: 0,
      carried_over_education_sessions: 0
    };
    
    const { error } = await supabase
      .from('holiday_entitlements')
      .insert(entitlement);
    
    if (error) {
      console.error(`❌ Error inserting entitlement for ${name}:`, error);
    } else {
      console.log(`✅ Inserted entitlement for ${name}: ${data.entitlement} → ${annual_hours.toFixed(2)} hours`);
    }
  }
}

async function insertHolidayRequests() {
  console.log('\n📅 Inserting holiday requests and days...');
  
  // Read the backdated holidays CSV
  const csvContent = fs.readFileSync('backdated_holidays.csv', 'utf-8');
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true
  });
  
  // Group holidays by staff and month
  const holidaysByStaff = {};
  
  for (const record of records) {
    const staffName = record.StaffName;
    if (!staffData[staffName]) continue; // Skip staff not in our mapping
    
    if (!holidaysByStaff[staffName]) {
      holidaysByStaff[staffName] = {};
    }
    
    const date = record.Date;
    const month = date.substring(0, 7); // YYYY-MM
    
    if (!holidaysByStaff[staffName][month]) {
      holidaysByStaff[staffName][month] = [];
    }
    
    holidaysByStaff[staffName][month].push({
      date: date,
      value: record.Value
    });
  }
  
  // Create holiday requests grouped by month
  for (const [staffName, months] of Object.entries(holidaysByStaff)) {
    const userId = staffData[staffName].id;
    let requestCount = 0;
    
    for (const [month, holidays] of Object.entries(months)) {
      // Sort holidays by date
      holidays.sort((a, b) => a.date.localeCompare(b.date));
      
      // Create holiday request
      const request = {
        user_id: userId,
        site_id: 2,
        request_type: 'holiday',
        status: 'approved',
        start_date: holidays[0].date,
        end_date: holidays[holidays.length - 1].date,
        approved_at: new Date().toISOString()
      };
      
      const { data: requestData, error: requestError } = await supabase
        .from('holiday_requests')
        .insert(request)
        .select()
        .single();
      
      if (requestError) {
        console.error(`❌ Error creating request for ${staffName} in ${month}:`, requestError);
        continue;
      }
      
      requestCount++;
      
      // Insert individual holiday days
      const days = holidays.map(h => {
        let hours_requested = 0;
        let sessions_requested = 0;
        
        if (h.value.includes(':')) {
          // Convert HH:MM:SS to decimal hours
          const [hrs, min, sec] = h.value.split(':').map(n => parseInt(n) || 0);
          hours_requested = hrs + (min / 60) + (sec / 3600);
        } else {
          // It's sessions
          sessions_requested = parseInt(h.value) || 0;
        }
        
        return {
          holiday_request_id: requestData.id,
          holiday_date: h.date,
          hours_requested: hours_requested,
          sessions_requested: sessions_requested
        };
      });
      
      const { error: daysError } = await supabase
        .from('holiday_request_days')
        .insert(days);
      
      if (daysError) {
        console.error(`❌ Error inserting days for ${staffName} in ${month}:`, daysError);
      } else {
        console.log(`✅ Inserted ${holidays.length} days for ${staffName} in ${month}`);
      }
    }
    
    console.log(`📌 Created ${requestCount} holiday requests for ${staffName}`);
  }
}

async function verifyImport() {
  console.log('\n🔍 Verifying import...');
  
  // Check entitlements
  const { data: entitlements, error: entError } = await supabase
    .from('holiday_entitlements')
    .select('*')
    .in('user_id', [BEN_ID, TOM_ID]);
  
  console.log(`✅ Found ${entitlements?.length || 0} entitlements`);
  
  // Check requests
  const { data: requests, error: reqError } = await supabase
    .from('holiday_requests')
    .select('*, holiday_request_days(*)')
    .in('user_id', [BEN_ID, TOM_ID])
    .order('start_date');
  
  console.log(`✅ Found ${requests?.length || 0} holiday requests`);
  
  // Count total days
  let totalDays = 0;
  requests?.forEach(r => {
    totalDays += r.holiday_request_days?.length || 0;
  });
  console.log(`✅ Found ${totalDays} total holiday days`);
  
  // Show summary for each user
  console.log('\n📊 Summary by user:');
  
  for (const [name, data] of Object.entries(staffData)) {
    const userRequests = requests?.filter(r => r.user_id === data.id) || [];
    const userDays = userRequests.reduce((sum, r) => sum + (r.holiday_request_days?.length || 0), 0);
    
    console.log(`${name}:`);
    console.log(`  - ${userRequests.length} holiday requests`);
    console.log(`  - ${userDays} total days`);
    
    // Calculate total hours taken
    let totalHours = 0;
    userRequests.forEach(r => {
      r.holiday_request_days?.forEach(d => {
        if (d.hours_requested) {
          totalHours += parseFloat(d.hours_requested) || 0;
        }
      });
    });
    
    console.log(`  - ${totalHours.toFixed(2)} total hours taken`);
  }
}

async function main() {
  console.log('=== HOLIDAY DATA IMPORT ===');
  console.log('Importing holiday data for Ben Howard and Tom Donlan\n');
  
  try {
    // Clear existing data first
    await clearExistingData();
    
    // Insert entitlements
    await insertEntitlements();
    
    // Insert holiday requests and days
    await insertHolidayRequests();
    
    // Verify the import
    await verifyImport();
    
    console.log('\n🎉 Import complete!');
    console.log('You can now view the data in admin-holidays.html');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
  }
}

// Run the import
main();