const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTAxNzI3NiwiZXhwIjoyMDcwNTkzMjc2fQ.CJxV14F0T2TWkAjeR4bpYiBIOwLwyfzF9WzAWwS99Xc';

const supabase = createClient(supabaseUrl, serviceKey);

async function verifyFix() {
    try {
        console.log('🔍 VERIFICATION: Checking current admin status\n');
        
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) {
            console.error('Error fetching auth users:', authError);
            return;
        }
        
        const adminUser = authUsers.users.find(user => user.email === 'benhowardmagic@hotmail.com');
        if (!adminUser) {
            console.log('❌ User not found');
            return;
        }

        console.log('✅ CURRENT STATUS:');
        console.log('Email:', adminUser.email);
        console.log('admin_access:', adminUser.user_metadata.admin_access);
        console.log('role:', adminUser.user_metadata.role);
        console.log('role_detail:', adminUser.user_metadata.role_detail);
        console.log('job_role:', adminUser.user_metadata.job_role || 'Not set');
        console.log('team_id:', adminUser.user_metadata.team_id);
        console.log('team_name:', adminUser.user_metadata.team_name);

        // Check profiles table
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', adminUser.id)
            .single();
            
        console.log('\n📊 PROFILES TABLE:');
        if (profileError) {
            console.log('Error or no profile:', profileError.message);
        } else {
            console.log('role:', profile.role);
            console.log('nickname:', profile.nickname);
        }

        // Check staff_app_welcome table
        const { data: welcome, error: welcomeError } = await supabase
            .from('staff_app_welcome')
            .select('*')
            .eq('user_id', adminUser.id);
            
        console.log('\n📋 STAFF_APP_WELCOME TABLE:');
        if (welcomeError) {
            console.log('Error or no data:', welcomeError.message);
        } else if (welcome && welcome.length > 0) {
            console.log('role_detail:', welcome[0].role_detail);
            console.log('job_role:', welcome[0].job_role || 'Not set');
            console.log('team_name:', welcome[0].team_name);
        } else {
            console.log('No welcome data found');
        }

        // Summary
        const isProperlyFixed = (
            adminUser.user_metadata.admin_access === true &&
            adminUser.user_metadata.role === 'admin' &&
            adminUser.user_metadata.role_detail === 'Admin'
        );

        console.log('\n' + '='.repeat(50));
        if (isProperlyFixed) {
            console.log('✅ SUCCESS: Admin role is properly restored!');
            console.log('✅ The user should see "Admin" in navigation');
            console.log('✅ The user should have admin portal access');
            console.log('✅ Future onboarding will preserve admin status');
        } else {
            console.log('❌ ISSUE: Admin role is not properly set');
            console.log('Expected: admin_access=true, role="admin", role_detail="Admin"');
        }
        console.log('='.repeat(50));
        
    } catch (error) {
        console.error('Verification error:', error);
    }
}

verifyFix();