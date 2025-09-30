import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Read the Excel file
const workbook = XLSX.readFile('HolidayTransfer.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(worksheet);

// Parse Excel dates (Excel stores dates as numbers)
function excelDateToJS(excelDate) {
  if (typeof excelDate === 'number') {
    // Excel date serial number to JS date
    const utc_days = Math.floor(excelDate - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    
    const fractional_day = excelDate - Math.floor(excelDate) + 0.0000001;
    let total_seconds = Math.floor(86400 * fractional_day);
    const seconds = total_seconds % 60;
    total_seconds -= seconds;
    const hours = Math.floor(total_seconds / (60 * 60));
    const minutes = Math.floor(total_seconds / 60) % 60;
    
    return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
  }
  return null;
}

// Convert hours from decimal to actual hours
function decimalToHours(decimal) {
  if (decimal === 'null' || decimal === null) return 0;
  if (typeof decimal === 'number') {
    return Math.round(decimal * 24); // Convert from fraction of day to hours
  }
  return 0;
}

async function populateHolidayData() {
  console.log('Starting holiday data population...');
  
  // Extract unique staff members with their data
  const staffMap = new Map();
  
  // First pass - collect staff information
  data.forEach(row => {
    if (row.Name && row.Role && row.Name !== 'ID') {
      const name = row.Name;
      if (!staffMap.has(name)) {
        staffMap.set(name, {
          name: name,
          role: row.Role,
          entitlement: typeof row.Entitlement === 'number' ? row.Entitlement : 0,
          mondayHours: decimalToHours(row['Staff Monday Hours (HH:MM)']),
          tuesdayHours: decimalToHours(row['Staff Tuesday Hours (HH:MM)']),
          wednesdayHours: decimalToHours(row['Staff Wednesday Hours (HH:MM)']),
          thursdayHours: decimalToHours(row['Staff Thursday Hours (HH:MM)']),
          fridayHours: decimalToHours(row['Staff Friday Hours (HH:MM)']),
          drMondayHours: row['Dr Monday Hours'] || 0,
          drTuesdayHours: row['Dr Tuesday Hours'] || 0,
          drWednesdayHours: row['Dr Wednesday Hours'] || 0,
          drThursdayHours: row['Dr Thursday Hours'] || 0,
          drFridayHours: row['Dr Friday Hours'] || 0,
        });
      }
    }
  });

  // Get or create site
  let { data: sites } = await supabase
    .from('sites')
    .select('id')
    .eq('name', 'Harley Street Medical Centre')
    .single();
  
  let siteId;
  if (!sites) {
    // Create the site if it doesn't exist
    const { data: newSite, error } = await supabase
      .from('sites')
      .insert({
        name: 'Harley Street Medical Centre',
        city: 'Stoke-on-Trent'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating site:', error);
      siteId = 1; // Default to 1
    } else {
      siteId = newSite.id;
    }
  } else {
    siteId = sites.id;
  }
  
  console.log(`Using site ID: ${siteId}`);
  
  // Process each staff member
  for (const [name, staffData] of staffMap) {
    console.log(`Processing ${name} (${staffData.role})...`);
    
    // Skip kiosk_users for now - we'll use placeholder user IDs
    // The master_users table structure is different
    
    // Create a placeholder user_id for non-registered users
    // We'll use a deterministic UUID based on the name
    const userId = `placeholder-${name.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Insert or update holiday entitlements
    const currentYear = new Date().getFullYear();
    const isGP = staffData.role === 'GP';
    
    const entitlementData = {
      user_id: userId,
      site_id: siteId,
      year: currentYear,
      annual_hours: isGP ? 0 : Math.round(staffData.entitlement * 24), // Convert days to hours
      annual_sessions: isGP ? Math.round(staffData.entitlement) : 0,
      carried_over_hours: 0,
      carried_over_sessions: 0,
      updated_at: new Date().toISOString()
    };
    
    const { error: entitlementError } = await supabase
      .from('master_users')
      .upsert(entitlementData, { onConflict: 'user_id,site_id,year' });
    
    if (entitlementError) {
      console.error(`Error upserting entitlements for ${name}:`, entitlementError);
    }
    
    // Insert or update working patterns
    const workingPatternData = {
      user_id: userId,
      site_id: siteId,
      monday_hours: isGP ? staffData.drMondayHours : staffData.mondayHours,
      tuesday_hours: isGP ? staffData.drTuesdayHours : staffData.tuesdayHours,
      wednesday_hours: isGP ? staffData.drWednesdayHours : staffData.wednesdayHours,
      thursday_hours: isGP ? staffData.drThursdayHours : staffData.thursdayHours,
      friday_hours: isGP ? staffData.drFridayHours : staffData.fridayHours,
      saturday_hours: 0,
      sunday_hours: 0,
      updated_at: new Date().toISOString()
    };
    
    const { error: patternError } = await supabase
      .from('master_users')
      .upsert(workingPatternData, { onConflict: 'user_id,site_id' });
    
    if (patternError) {
      console.error(`Error upserting working pattern for ${name}:`, patternError);
    }
    
    // Create staff_app_welcome entry
    const welcomeData = {
      user_id: userId,
      site_id: siteId,
      full_name: name,
      nickname: name.split(' ')[0], // Use first name as nickname
      role: staffData.role,
      team_id: null,
      team_name: staffData.role, // Use role as team name for now
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { error: welcomeError } = await supabase
      .from('master_users')
      .upsert(welcomeData, { onConflict: 'user_id,site_id' });
    
    if (welcomeError) {
      console.error(`Error upserting staff_app_welcome for ${name}:`, welcomeError);
    }
  }
  
  // Now process holiday requests from the Excel file
  console.log('\nProcessing holiday requests...');
  
  const holidayRequests = [];
  data.forEach(row => {
    // Check if this row is a holiday request (has ID number and dates)
    if (typeof row.Name === 'number' && row.Role && row.Entitlement) {
      const requestId = row.Name; // ID is stored in Name column
      const requestedDate = row.Role; // Date is in Role column
      const staffName = row.Entitlement; // Staff name is in Entitlement column
      const role = row['Dr Monday Hours']; // Role is in Dr Monday Hours column
      const startDateStr = row['Dr Tuesday Hours']; // Start date is in Dr Tuesday Hours column
      const endDateStr = row['Dr Wednesday Hours']; // End date is in Dr Wednesday Hours column
      const requestType = row['Dr Thursday Hours']; // Request type is in Dr Thursday Hours column
      const comments = row['Dr Friday Hours']; // Comments are in Dr Friday Hours column
      const benApproved = row['Staff Monday Hours (HH:MM)']; // Ben's approval
      const tomApproved = row['Staff Tuesday Hours (HH:MM)']; // Tom's approval
      
      // Determine status based on approvals
      let status = 'pending';
      if (benApproved === 'APPROVED' || tomApproved === 'APPROVED') {
        status = 'approved';
      } else if (benApproved === 'REJECTED' || tomApproved === 'REJECTED') {
        status = 'declined';
      }
      
      holidayRequests.push({
        id: requestId,
        staffName: staffName,
        role: role,
        startDate: startDateStr,
        endDate: endDateStr,
        requestType: requestType,
        comments: comments,
        status: status,
        requestedDate: requestedDate
      });
    }
  });
  
  // Insert holiday requests
  for (const request of holidayRequests) {
    if (request.staffName && request.startDate && request.endDate) {
      console.log(`Processing holiday request for ${request.staffName}: ${request.startDate} to ${request.endDate}`);
      
      // Parse dates - handle DD/MM/YYYY format
      let startDate, endDate;
      
      // Try different date parsing methods
      if (request.startDate.includes('/')) {
        // Handle DD/MM/YYYY format
        const startParts = request.startDate.split('/');
        const endParts = request.endDate.split('/');
        
        if (startParts.length === 3) {
          startDate = new Date(startParts[2], startParts[1] - 1, startParts[0]);
          endDate = new Date(endParts[2], endParts[1] - 1, endParts[0]);
        }
      } else {
        startDate = new Date(request.startDate);
        endDate = new Date(request.endDate);
      }
      
      if (!startDate || !endDate || isNaN(startDate) || isNaN(endDate)) {
        console.warn(`Invalid dates for ${request.staffName}: ${request.startDate} to ${request.endDate}`);
        continue;
      }
      
      // Get user's placeholder ID
      const userId = `placeholder-${request.staffName.toLowerCase().replace(/\s+/g, '-')}`;
      
      // Calculate total hours/sessions
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      const isGP = request.role === 'GP';
      
      // Get working pattern to calculate actual hours
      const { data: workingPattern } = await supabase
        .from('master_users')
        .select('*')
        .eq('auth_user_id', userId)
        .eq('site_id', siteId)
        .single();
      
      let totalHours = 0;
      let totalSessions = 0;
      
      if (isGP) {
        totalSessions = daysDiff * 2; // Assume 2 sessions per day for GPs
      } else {
        // Calculate hours based on working pattern
        if (workingPattern) {
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayOfWeek = d.getDay();
            const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
            const dayHours = workingPattern[`${dayNames[dayOfWeek]}_hours`] || 0;
            totalHours += dayHours;
          }
        } else {
          // Default to 8 hours per day if no pattern found
          totalHours = daysDiff * 8;
        }
      }
      
      const holidayRequestData = {
        user_id: userId,
        site_id: siteId,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        request_type: request.requestType?.toLowerCase().replace(' ', '_') || 'holiday',
        total_hours: totalHours,
        total_sessions: totalSessions,
        status: request.status,
        admin_comments: request.comments !== 'null' ? request.comments : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('holiday_requests')
        .insert(holidayRequestData);
      
      if (error) {
        console.error(`Error inserting holiday request for ${request.staffName}:`, error);
      } else {
        console.log(`✓ Added holiday request for ${request.staffName}`);
      }
    }
  }
  
  console.log('\n✅ Holiday data population complete!');
  
  // Summary
  console.log(`\nSummary:`);
  console.log(`- Processed ${staffMap.size} staff members`);
  console.log(`- Added ${holidayRequests.length} holiday requests`);
}

// Run the population
populateHolidayData().catch(console.error);