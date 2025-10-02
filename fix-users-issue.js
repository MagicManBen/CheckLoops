// User Loading Fix Script
// Add this to the browser console on admin-dashboard.html to diagnose and fix user loading issues

(async function fixUsersIssue() {
    console.log('🔧 User Loading Fix Script Starting...');

    // Check if Supabase is available
    if (!window.supabase) {
        console.error('❌ Supabase client not found');
        return;
    }

    const sb = window.supabase;

    // Step 1: Check authentication
    console.log('🔍 Step 1: Checking authentication...');
    const { data: session, error: sessionError } = await sb.auth.getSession();

    if (sessionError) {
        console.error('❌ Session error:', sessionError);
        return;
    }

    if (!session?.session?.user) {
        console.error('❌ No authenticated user found. Please log in.');
        return;
    }

    const user = session.session.user;
    console.log('✅ Authenticated user:', user.email, 'ID:', user.id);

    // Step 2: Check if user exists in master_users table
    console.log('🔍 Step 2: Checking user profile in master_users...');
    const { data: profile, error: profileError } = await sb
        .from('master_users')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();

    if (profileError) {
        console.error('❌ Profile query error:', profileError);
        return;
    }

    if (!profile) {
        console.warn('⚠️ User not found in master_users table. Creating profile...');

        // Step 3: Create user profile
        const newProfile = {
            auth_user_id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name ||
                      user.user_metadata?.name ||
                      user.email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            access_type: 'admin',
            role: 'admin',
            site_id: 'MAIN_SITE', // Default site ID
            active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        const { data: created, error: createError } = await sb
            .from('master_users')
            .insert(newProfile)
            .select()
            .single();

        if (createError) {
            console.error('❌ Failed to create user profile:', createError);

            // Try with service role key if available
            console.log('🔄 Trying alternative approach...');
            console.log('Please run this SQL in Supabase SQL Editor:');
            console.log(`
INSERT INTO master_users (auth_user_id, email, full_name, access_type, role, site_id, active)
VALUES ('${user.id}', '${user.email}', '${newProfile.full_name}', 'admin', 'admin', 'MAIN_SITE', true);
            `);
            return;
        }

        console.log('✅ User profile created:', created);
    } else {
        console.log('✅ User profile found:', profile);

        // Step 4: Check if site_id is set
        if (!profile.site_id) {
            console.warn('⚠️ User profile missing site_id. Updating...');

            const { data: updated, error: updateError } = await sb
                .from('master_users')
                .update({ site_id: 'MAIN_SITE' })
                .eq('auth_user_id', user.id)
                .select()
                .single();

            if (updateError) {
                console.error('❌ Failed to update site_id:', updateError);
                console.log('Please run this SQL in Supabase SQL Editor:');
                console.log(`UPDATE master_users SET site_id = 'MAIN_SITE' WHERE auth_user_id = '${user.id}';`);
                return;
            }

            console.log('✅ Site ID updated:', updated);
        }
    }

    // Step 5: Reload context and users
    console.log('🔄 Step 5: Reloading context...');

    if (window.loadContext) {
        try {
            await window.loadContext();
            console.log('✅ Context reloaded successfully');
            console.log('Current context:', window.ctx);
        } catch (e) {
            console.error('❌ Failed to reload context:', e);
        }
    }

    // Step 6: Reload practice users
    console.log('🔄 Step 6: Reloading practice users...');

    if (window.loadPracticeUsers) {
        try {
            await window.loadPracticeUsers();
            console.log('✅ Practice users reloaded successfully');
        } catch (e) {
            console.error('❌ Failed to reload practice users:', e);
        }
    }

    // Step 7: Check if users are now loading
    console.log('🔍 Step 7: Checking if users are now loading...');
    const tbody = document.getElementById('practice-users-tbody');
    if (tbody) {
        const content = tbody.innerHTML;
        if (content.includes('No site selected') || content.includes('Loading users...')) {
            console.warn('⚠️ Users still not loading. Additional debugging needed.');
            console.log('Current tbody content:', content);
        } else {
            console.log('✅ Users appear to be loading now!');
        }
    }

    console.log('🔧 Fix script completed');
})();