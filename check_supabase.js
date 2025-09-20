import { createClient } from '@supabase/supabase-js';

// Service credentials
const SUPABASE_URL = "https://unveoqnlqnobufhublyw.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc";

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkBenHoward() {
    console.log('\n=== CHECKING BEN HOWARD\'S ACCOUNT ===\n');

    // 1. Check auth.users table
    console.log('1. Checking auth.users...');
    const { data: authUser, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
        console.error('Error fetching users:', authError);
    } else {
        const ben = authUser.users.find(u => u.email === 'benhowardmagic@hotmail.com');
        if (ben) {
            console.log('✓ Found Ben Howard in auth.users');
            console.log('  User ID:', ben.id);
            console.log('  Email:', ben.email);
            console.log('  Created:', ben.created_at);
        } else {
            console.log('✗ Ben Howard not found in auth.users');
            return;
        }
    }

    // 2. Check master_users table
    console.log('\n2. Checking master_users table...');
    const { data: profiles, error: profileError } = await supabase
        .from('master_users')
        .select('*')
        .or('full_name.ilike.%Ben Howard%,user_id.eq.' + (authUser?.users?.find(u => u.email === 'benhowardmagic@hotmail.com')?.id || 'none'));

    if (profileError) {
        console.error('Error fetching profiles:', profileError);
    } else if (profiles && profiles.length > 0) {
        console.log('✓ Found', profiles.length, 'profile(s) for Ben Howard:');
        profiles.forEach((p, i) => {
            console.log(`\n  Profile ${i + 1}:`);
            console.log('    user_id:', p.user_id);
            console.log('    site_id:', p.site_id);
            console.log('    full_name:', p.full_name);
            console.log('    kiosk_user_id:', p.kiosk_user_id || 'NULL ❌');
            console.log('    role:', p.role);
            console.log('    role_detail:', p.role_detail);
            console.log('    pin_hash exists:', p.pin_hash ? 'Yes' : 'No');
            console.log('    pin_hmac exists:', p.pin_hmac ? 'Yes' : 'No');
            console.log('    active:', p.active);
        });
    } else {
        console.log('✗ No profiles found for Ben Howard');
    }

    // 3. Check master_users table
    console.log('\n3. Checking master_users table...');
    const { data: kioskUsers, error: kioskError } = await supabase
        .from('master_users')
        .select('*')
        .ilike('full_name', '%Ben Howard%');

    if (kioskError) {
        console.error('Error fetching kiosk_users:', kioskError);
    } else if (kioskUsers && kioskUsers.length > 0) {
        console.log('✓ Found', kioskUsers.length, 'kiosk user(s) for Ben Howard:');
        kioskUsers.forEach((k, i) => {
            console.log(`\n  Kiosk User ${i + 1}:`);
            console.log('    id:', k.id);
            console.log('    site_id:', k.site_id);
            console.log('    full_name:', k.full_name);
            console.log('    role:', k.role);
            console.log('    pin_hash exists:', k.pin_hash ? 'Yes' : 'No');
            console.log('    pin_hmac exists:', k.pin_hmac ? 'Yes' : 'No');
            console.log('    active:', k.active);
        });
    } else {
        console.log('✗ No kiosk_users found for Ben Howard');
    }

    // 4. Check all profiles at the site
    if (profiles && profiles.length > 0 && profiles[0].site_id) {
        console.log('\n4. Checking all profiles at site', profiles[0].site_id, '...');
        const { data: siteProfiles, error: siteError } = await supabase
            .from('master_users')
            .select('auth_user_id, full_name, kiosk_auth_user_id, role, active')
            .eq('site_id', profiles[0].site_id);

        if (siteError) {
            console.error('Error fetching site profiles:', siteError);
        } else if (siteProfiles) {
            console.log('Found', siteProfiles.length, 'profiles at this site:');
            const withKiosk = siteProfiles.filter(p => p.kiosk_user_id);
            const withoutKiosk = siteProfiles.filter(p => !p.kiosk_user_id);
            console.log('  With kiosk_user_id:', withKiosk.length);
            console.log('  Without kiosk_user_id:', withoutKiosk.length);

            if (withoutKiosk.length > 0) {
                console.log('\nProfiles missing kiosk_user_id:');
                withoutKiosk.forEach(p => {
                    console.log('  -', p.full_name, '(role:', p.role, ')');
                });
            }
        }
    }

    // 5. Check max kiosk_user id
    console.log('\n5. Checking kiosk_users ID range...');
    const { data: maxId, error: maxError } = await supabase
        .from('master_users')
        .select('id')
        .order('id', { ascending: false })
        .limit(1);

    if (maxError) {
        console.error('Error fetching max ID:', maxError);
    } else if (maxId && maxId.length > 0) {
        console.log('Highest kiosk_user ID:', maxId[0].id);
        console.log('Next available ID would be:', maxId[0].id + 1);
    } else {
        console.log('No kiosk_users exist yet');
        console.log('First ID would be: 1000');
    }

    console.log('\n=== SUMMARY ===');
    if (profiles && profiles.length > 0) {
        const benProfile = profiles[0];
        if (!benProfile.kiosk_user_id) {
            console.log('❌ Ben Howard needs a kiosk_user_id assigned');
            console.log('→ Run the SQL migration to fix this');
        } else {
            console.log('✓ Ben Howard has kiosk_user_id:', benProfile.kiosk_user_id);
            if (!benProfile.pin_hmac) {
                console.log('❌ But no PIN is set yet');
                console.log('→ Use the PIN setup screen to set a PIN');
            } else {
                console.log('✓ PIN is set - should be able to authenticate');
            }
        }
    }
}

// Run the check
checkBenHoward().catch(console.error);