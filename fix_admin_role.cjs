const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const serviceKey = (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) || '';
if (!serviceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY not set in environment');
}

const supabase = createClient(supabaseUrl, serviceKey);

async function fixAdminRole() {
    try {
        console.log('Restoring admin role for benhowardmagic@hotmail.com...\n');
        
        // Get the user's current state
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
        if (authError) {
            console.error('Error fetching auth users:', authError);
            return;
        }
        
        const adminUser = authUsers.users.find(user => user.email === 'benhowardmagic@hotmail.com');
        if (!adminUser) {
            console.log('User not found');
            return;
        }

        console.log('Current user metadata before fix:');
        console.log('admin_access:', adminUser.user_metadata.admin_access);
        console.log('role:', adminUser.user_metadata.role);
        console.log('role_detail:', adminUser.user_metadata.role_detail);

        // The issue is that the onboarding process is overwriting the role with the selected job role
        // But it should preserve admin_access and set the role to 'admin' for admins
        
        // Fix 1: Update auth user metadata to restore admin role
        const updatedMetadata = {
            ...adminUser.user_metadata,
            role: 'admin', // Restore admin role (this is what shows on the pills)
            role_detail: 'Admin', // Keep this as Admin for display
            admin_access: true // Ensure admin access flag remains true
        };

        console.log('\nUpdating user metadata to:', updatedMetadata);

        const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
            adminUser.id,
            {
                user_metadata: updatedMetadata
            }
        );

        if (updateError) {
            console.error('Error updating user metadata:', updateError);
            return;
        }

        console.log('✅ Successfully updated user metadata');

        // Fix 2: Update profiles table if it exists
        try {
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    role: 'admin',
                    nickname: updatedMetadata.nickname || 'Benjamin'
                })
                .eq('user_id', adminUser.id);

            if (profileError) {
                console.warn('Could not update profiles table:', profileError);
            } else {
                console.log('✅ Successfully updated profiles table');
            }
        } catch (e) {
            console.warn('Profiles table may not exist or have different schema:', e.message);
        }

        // Fix 3: Update staff_app_welcome table if it exists
        try {
            const { error: welcomeError } = await supabase
                .from('staff_app_welcome')
                .update({
                    role_detail: 'Admin'
                })
                .eq('user_id', adminUser.id);

            if (welcomeError) {
                console.warn('Could not update staff_app_welcome table:', welcomeError);
            } else {
                console.log('✅ Successfully updated staff_app_welcome table');
            }
        } catch (e) {
            console.warn('staff_app_welcome table may not exist:', e.message);
        }

        // Verify the fix worked
        console.log('\n--- Verification ---');
        const { data: verifyUsers, error: verifyError } = await supabase.auth.admin.listUsers();
        if (!verifyError) {
            const verifyUser = verifyUsers.users.find(user => user.email === 'benhowardmagic@hotmail.com');
            if (verifyUser) {
                console.log('Updated user metadata:');
                console.log('admin_access:', verifyUser.user_metadata.admin_access);
                console.log('role:', verifyUser.user_metadata.role);
                console.log('role_detail:', verifyUser.user_metadata.role_detail);
                
                if (verifyUser.user_metadata.role === 'admin' && verifyUser.user_metadata.admin_access === true) {
                    console.log('\n🎉 SUCCESS: Admin role has been restored!');
                    console.log('The user should now see "Admin" in the navigation pills and have admin access.');
                } else {
                    console.log('\n❌ Something went wrong - role was not properly restored');
                }
            }
        }
        
    } catch (error) {
        console.error('Unexpected error:', error);
    }
}

fixAdminRole();