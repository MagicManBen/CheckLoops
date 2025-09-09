// Simple authentication test to run in browser console
// Open http://localhost:8001/staff.html and run this in the browser console after logging in

(async function testAuth() {
  try {
    console.log('🔍 Testing authentication for ben.howard@stoke.nhs.uk...');
    
    // Import the functions
    const { initSupabase, requireStaffSession } = await import('./staff-common.js');
    const supabase = await initSupabase();
    
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    console.log('📧 Current user email:', session?.user?.email);
    console.log('🆔 Current user ID:', session?.user?.id);
    
    // Raw meta data
    console.log('📋 Raw user meta data:', session?.user?.raw_user_meta_data);
    
    // Get profile data
    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();
    
    console.log('👤 Profile data:', profileRow);
    if (profileError) console.log('❌ Profile error:', profileError);
    
    // Get staff_app_welcome data
    const { data: sawRow, error: sawError } = await supabase
      .from('staff_app_welcome')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle();
    
    console.log('👋 Staff App Welcome data:', sawRow);
    if (sawError) console.log('❌ SAW error:', sawError);
    
    // Test requireStaffSession
    try {
      const staffSession = await requireStaffSession(supabase);
      console.log('✅ requireStaffSession succeeded');
      console.log('   - Profile role:', staffSession.profileRow?.role);
      console.log('   - Profile full name:', staffSession.profileRow?.full_name);
    } catch (error) {
      console.log('❌ requireStaffSession failed:', error.message);
    }
    
    // Test role resolution logic
    const role = profileRow?.role || session.user?.raw_user_meta_data?.role || null;
    const allowed = ['staff', 'admin', 'owner', 'manager'];
    console.log('🔐 Resolved role:', role);
    console.log('✅ Role allowed:', allowed.includes(String(role).toLowerCase()));
    
    // Test admin nav logic
    const r = String(role || '').toLowerCase();
    const shouldShowAdmin = (r === 'admin' || r === 'owner');
    console.log('🔧 Should show admin nav:', shouldShowAdmin);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
})();
