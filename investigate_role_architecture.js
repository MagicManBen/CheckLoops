import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const serviceKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!serviceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

const supabase = createClient(supabaseUrl, serviceKey);

async function investigateRoleArchitecture() {
    try {
        console.log('🔍 INVESTIGATING ROLE ARCHITECTURE\n');
        
        // Check site_invites table structure and data
        console.log('📋 SITE_INVITES TABLE (The Source of Truth):');
        const { data: invites, error: invitesError } = await supabase
            .from('site_invites')
            .select('*')
            .order('created_at', { ascending: false });
            
        if (invitesError) {
            console.log('❌ Error accessing site_invites:', invitesError.message);
        } else if (!invites || invites.length === 0) {
            console.log('⚠️ No invites found');
        } else {
            console.log('✅ Found invites:');
            invites.forEach((invite, i) => {
                console.log(`   ${i + 1}. ${invite.email}`);
                console.log(`      Access Level: ${invite.role} (security role)`);
                console.log(`      Job Role: ${invite.role_detail || 'Not set'} (clinical role)`);
                console.log(`      Status: ${invite.status}`);
                console.log(`      Site: ${invite.site_id}`);
                console.log('');
            });
        }

        // Check current admin user's invitation record
        console.log('🔍 ADMIN USER INVITATION RECORD:');
        const { data: adminInvite, error: adminInviteError } = await supabase
            .from('site_invites')
            .select('*')
            .eq('email', 'benhowardmagic@hotmail.com')
            .order('created_at', { ascending: false })
            .limit(1);
            
        if (adminInviteError) {
            console.log('❌ Error:', adminInviteError.message);
        } else if (!adminInvite || adminInvite.length === 0) {
            console.log('⚠️ No invitation record found for benhowardmagic@hotmail.com');
            console.log('   This user was likely created manually/directly');
        } else {
            const invite = adminInvite[0];
            console.log('✅ Found invitation record:');
            console.log(`   Access Level: ${invite.role} ← This should be the source of truth`);
            console.log(`   Job Role: ${invite.role_detail}`);
            console.log(`   Status: ${invite.status}`);
            console.log(`   Created: ${invite.created_at}`);
        }

        // Show the problem
        console.log('\n🔥 THE ARCHITECTURE PROBLEM:');
        console.log('1. Admin Dashboard creates invites with:');
        console.log('   - role: "admin/owner/staff" (security level)');
        console.log('   - role_detail: "GP/Nurse/etc" (job role)');
        console.log('');
        console.log('2. But staff-welcome.html onboarding:');
        console.log('   - Overwrites user.metadata.role with the job selection');
        console.log('   - Ignores the original security role from site_invites');
        console.log('');
        console.log('3. Proper flow should be:');
        console.log('   - Security role (admin/owner/staff) = permanent from site_invites');
        console.log('   - Job role (GP/Nurse/etc) = can be updated during onboarding');
        console.log('   - Admin login checks security role, not job role');

        console.log('\n💡 SOLUTION NEEDED:');
        console.log('1. Update staff-welcome.html to preserve security roles');
        console.log('2. Check site_invites.role during onboarding');  
        console.log('3. If site_invites.role is admin/owner, preserve it');
        console.log('4. Only allow job role updates, never security role downgrades');

        
    } catch (error) {
        console.error('Investigation error:', error);
    }
}

investigateRoleArchitecture();