const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// THIS FILE SHOULD NOT BE IN PRODUCTION
// Service role keys must never be in client-side code
// This should be run as a server-side script with proper environment variables

// Get credentials from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  console.error('   Example: SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=... node direct_supabase_import.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Read the generated JSON data files
const profiles = JSON.parse(fs.readFileSync('staff_entitlements_data.json', 'utf8'));
const bookings = JSON.parse(fs.readFileSync('holiday_requests_data.json', 'utf8'));

async function clearExistingData() {
    console.log('Clearing existing holiday data...');
    
    try {
        // Clear in correct order due to foreign keys
        await supabase.from('holiday_bookings').delete().neq('id', 0);
        await supabase.from('staff_working_patterns').delete().neq('id', 0);
        await supabase.from('holiday_entitlements').delete().neq('id', 0);
        await supabase.from('staff_profile_user_links').delete().neq('id', 0);
        await supabase.from('staff_holiday_profiles').delete().neq('id', 0);
        
        console.log('✅ Existing data cleared');
    } catch (error) {
        console.error('Error clearing data:', error);
    }
}

async function importData() {
    console.log('Starting holiday data import...\n');
    
    // Step 1: Create staff profiles
    console.log('Creating staff profiles...');
    const profilesData = [];
    const profileMap = {};
    
    // Add profiles from staff info
    profiles.forEach(p => {
        if (p.full_name && !profileMap[p.full_name]) {
            profileMap[p.full_name] = true;
            const isGP = p.role === 'GP' || 
                        (p['Dr Monday Hours'] || p['Dr Tuesday Hours'] || 
                         p['Dr Wednesday Hours'] || p['Dr Thursday Hours'] || 
                         p['Dr Friday Hours']);
            
            profilesData.push({
                full_name: p.full_name,
                role: p.role || 'Staff',
                is_gp: isGP
            });
        }
    });
    
    // Add profiles from bookings
    bookings.forEach(b => {
        if (b.staff_name && !profileMap[b.staff_name]) {
            profileMap[b.staff_name] = true;
            profilesData.push({
                full_name: b.staff_name,
                role: 'Staff',
                is_gp: false
            });
        }
    });
    
    const { data: insertedProfiles, error: profileError } = await supabase
        .from('staff_holiday_profiles')
        .upsert(profilesData, { onConflict: 'full_name' })
        .select();
    
    if (profileError) {
        console.error('Error creating profiles:', profileError);
        return;
    }
    
    console.log(`✅ Created ${insertedProfiles.length} staff profiles`);
    
    // Get all profiles with IDs
    const { data: allProfiles } = await supabase
        .from('staff_holiday_profiles')
        .select('id, full_name');
    
    const profileIdMap = {};
    allProfiles.forEach(p => {
        profileIdMap[p.full_name] = p.id;
    });
    
    // Step 2: Create working patterns
    console.log('Creating working patterns...');
    const workingPatterns = [];
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    profiles.forEach(p => {
        if (!profileIdMap[p.full_name]) return;
        
        const staffId = profileIdMap[p.full_name];
        const isGP = p.role === 'GP';
        
        days.forEach(day => {
            if (isGP) {
                const drCol = `Dr ${day} Hours`;
                if (p[drCol]) {
                    const sessions = typeof p[drCol] === 'number' ? p[drCol] : 1;
                    workingPatterns.push({
                        staff_profile_id: staffId,
                        day_of_week: day,
                        sessions_worked: sessions
                    });
                }
            } else {
                const staffCol = `Staff ${day} Hours (HH:MM)`;
                if (p[staffCol]) {
                    workingPatterns.push({
                        staff_profile_id: staffId,
                        day_of_week: day,
                        hours_worked: p[staffCol]
                    });
                }
            }
        });
    });
    
    if (workingPatterns.length > 0) {
        await supabase.from('staff_working_patterns').upsert(workingPatterns);
        console.log(`✅ Created ${workingPatterns.length} working patterns`);
    }
    
    // Step 3: Create entitlements
    console.log('Creating entitlements...');
    const entitlements = [];
    
    profiles.forEach(p => {
        if (!profileIdMap[p.full_name] || !p.entitlement) return;
        
        const staffId = profileIdMap[p.full_name];
        const isGP = p.role === 'GP';
        
        if (isGP) {
            const sessions = typeof p.entitlement === 'number' ? p.entitlement : 44;
            entitlements.push({
                staff_profile_id: staffId,
                year: 2025,
                annual_sessions: sessions,
                entitlement_sessions: sessions
            });
        } else {
            // Parse entitlement for regular staff
            let hours = 0;
            if (typeof p.entitlement === 'string' && p.entitlement.includes('days')) {
                // Parse "X days, HH:MM:SS" format
                const match = p.entitlement.match(/(\d+) days?, (\d+):(\d+):(\d+)/);
                if (match) {
                    hours = parseInt(match[1]) * 24 + parseInt(match[2]) + parseInt(match[3])/60;
                }
            } else if (typeof p.entitlement === 'number') {
                hours = p.entitlement;
            }
            
            if (hours > 0) {
                const totalMinutes = Math.round(hours * 60);
                const hoursInt = Math.floor(totalMinutes / 60);
                const minutesInt = totalMinutes % 60;
                
                entitlements.push({
                    staff_profile_id: staffId,
                    year: 2025,
                    annual_hours: hours,
                    entitlement_hours: `${hoursInt}:${minutesInt.toString().padStart(2, '0')}:00`
                });
            }
        }
    });
    
    if (entitlements.length > 0) {
        await supabase.from('holiday_entitlements').upsert(entitlements);
        console.log(`✅ Created ${entitlements.length} entitlements`);
    }
    
    // Step 4: Create holiday bookings
    console.log('Creating holiday bookings...');
    const bookingsData = [];
    
    // Create a set of GP names
    const gpNames = new Set(profiles.filter(p => p.role === 'GP').map(p => p.full_name));
    
    bookings.forEach(b => {
        if (!profileIdMap[b.staff_name]) return;
        
        const staffId = profileIdMap[b.staff_name];
        const isGP = gpNames.has(b.staff_name);
        
        const booking = {
            staff_profile_id: staffId,
            booking_date: b.date.split('T')[0],
            booking_type: 'annual_leave',
            imported_from_excel: true
        };
        
        if (isGP) {
            // For GPs, use sessions
            booking.sessions_booked = typeof b.leave_type === 'number' ? b.leave_type : 1;
        } else {
            // For regular staff, parse hours
            if (b.leave_type) {
                if (typeof b.leave_type === 'string' && b.leave_type.includes(':')) {
                    booking.hours_booked = b.leave_type;
                } else if (typeof b.leave_type === 'object' && b.leave_type.hours !== undefined) {
                    const h = b.leave_type.hours || 0;
                    const m = b.leave_type.minutes || 0;
                    booking.hours_booked = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`;
                } else {
                    booking.hours_booked = '08:00:00'; // Default
                }
            }
        }
        
        bookingsData.push(booking);
    });
    
    // Insert bookings in batches
    const batchSize = 50;
    for (let i = 0; i < bookingsData.length; i += batchSize) {
        const batch = bookingsData.slice(i, i + batchSize);
        const { error } = await supabase.from('holiday_bookings').insert(batch);
        
        if (error) {
            console.error(`Error inserting batch ${Math.floor(i/batchSize) + 1}:`, error);
        } else {
            console.log(`  Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} bookings`);
        }
    }
    
    console.log(`✅ Created ${bookingsData.length} holiday bookings`);
    
    // Step 5: Link existing users
    console.log('\nLinking existing user accounts...');
    
    // Try to link Ben Howard
    const { data: users } = await supabase.auth.admin.listUsers();
    
    if (users && users.users) {
        const benUser = users.users.find(u => 
            u.email === 'ben.howard@stoke.nhs.uk' || 
            u.email === 'magic@hotmail.com'
        );
        
        if (benUser && profileIdMap['Ben Howard']) {
            const { error } = await supabase.from('staff_profile_user_links').upsert({
                staff_profile_id: profileIdMap['Ben Howard'],
                user_id: benUser.id
            });
            
            if (!error) {
                console.log('✅ Linked Ben Howard to user account');
            }
        }
        
        // Try to link Tom Donlan
        const tomUser = users.users.find(u => 
            u.user_metadata?.full_name === 'Tom Donlan'
        );
        
        if (tomUser && profileIdMap['Tom Donlan']) {
            await supabase.from('staff_profile_user_links').upsert({
                staff_profile_id: profileIdMap['Tom Donlan'],
                user_id: tomUser.id
            });
            console.log('✅ Linked Tom Donlan to user account');
        }
    }
    
    // Verify the import
    console.log('\n📊 Import Summary:');
    
    const { data: finalProfiles } = await supabase.from('staff_holiday_profiles').select('id');
    const { data: finalBookings } = await supabase.from('holiday_bookings').select('id');
    const { data: finalEntitlements } = await supabase.from('holiday_entitlements').select('id');
    const { data: finalLinks } = await supabase.from('staff_profile_user_links').select('id');
    
    console.log(`  Staff Profiles: ${finalProfiles?.length || 0}`);
    console.log(`  Holiday Bookings: ${finalBookings?.length || 0}`);
    console.log(`  Entitlements: ${finalEntitlements?.length || 0}`);
    console.log(`  Linked Users: ${finalLinks?.length || 0}`);
    
    console.log('\n🎉 Holiday data import completed successfully!');
    console.log('\nThe data is now available in Supabase and will automatically link to users when they sign up.');
}

async function main() {
    try {
        // First clear existing data
        await clearExistingData();
        
        // Then import new data
        await importData();
        
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    }
}

// Run the import
main();