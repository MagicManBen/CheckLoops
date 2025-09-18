// Script to clean up benhowardmagic@hotmail.com from all tables
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Load config
const script = document.createElement('script');
script.src = 'config.js';
document.head.appendChild(script);

await new Promise(resolve => {
  script.onload = resolve;
});

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
});

async function cleanupAccount() {
  const email = 'benhowardmagic@hotmail.com';
  console.log('🧹 Starting cleanup for:', email);
  
  try {
    // First, let's find the user_id from auth.users if it exists
    let userId = null;
    
    // Try to get current session to see if we can find the user
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email === email) {
      userId = session.user.id;
      console.log('📍 Found user_id from current session:', userId);
    }
    
    // Clean up tables one by one
    const tablesToClean = [
      'site_invites',
      'profiles', 
      'staff_app_welcome',
      'kiosk_users',
      'team_members',
      'user_permissions',
      'role_permissions'
    ];
    
    for (const tableName of tablesToClean) {
      console.log(`🗑️  Cleaning ${tableName}...`);
      
      try {
        // Try cleaning by email first
        const { data: byEmail, error: emailError } = await supabase
          .from(tableName)
          .delete()
          .eq('email', email)
          .select();
        
        if (!emailError && byEmail && byEmail.length > 0) {
          console.log(`   ✅ Removed ${byEmail.length} record(s) by email from ${tableName}`);
        }
        
        // If we have a user_id, try cleaning by user_id
        if (userId) {
          const { data: byUserId, error: userIdError } = await supabase
            .from(tableName)
            .delete()
            .eq('user_id', userId)
            .select();
          
          if (!userIdError && byUserId && byUserId.length > 0) {
            console.log(`   ✅ Removed ${byUserId.length} record(s) by user_id from ${tableName}`);
          }
        }
        
        // Also try cleaning by full_name if the table has that column
        const { data: byName, error: nameError } = await supabase
          .from(tableName)
          .delete()
          .eq('full_name', 'new name')  // This was the name in the test data
          .select();
        
        if (!nameError && byName && byName.length > 0) {
          console.log(`   ✅ Removed ${byName.length} record(s) by full_name from ${tableName}`);
        }
        
      } catch (tableError) {
        console.log(`   ⚠️  Could not clean ${tableName}:`, tableError.message);
      }
    }
    
    console.log('🎯 Cleanup completed!');
    console.log('📧 You can now invite benhowardmagic@hotmail.com as a fresh user');
    
    // If this is the current user, sign them out
    if (session?.user?.email === email) {
      console.log('🚪 Signing out current user...');
      await supabase.auth.signOut();
      window.location.href = 'Home.html';
    }
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
  }
}

// Run cleanup when page loads
if (typeof window !== 'undefined') {
  window.cleanupAccount = cleanupAccount;
  console.log('Cleanup function ready. Call cleanupAccount() to start.');
} else {
  cleanupAccount();
}