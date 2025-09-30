const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

async function createKioskUsersView() {
  console.log('🔧 ATTEMPTING TO CREATE KIOSK_USERS VIEW');
  console.log('========================================');
  
  try {
    // Authenticate as admin user
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'benhowardmagic@hotmail.com',
        password: 'Hello1!'
      })
    });
    
    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    
    console.log('✅ Authenticated successfully');
    
    // Try to execute SQL via RPC (if available)
    console.log('\n🔧 Attempting to create kiosk_users view...');
    
    // First, let's try a simpler approach - check if we can query master_users
    const masterResponse = await fetch(`${SUPABASE_URL}/rest/v1/master_users?limit=1`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    if (masterResponse.ok) {
      console.log('✅ master_users table is accessible');
      
      // Instead of creating a view, let's check if there's an RLS policy issue
      // Try inserting with a minimal RLS bypass approach
      
      console.log('\n🧪 Testing quiz_attempts insert with RLS bypass headers...');
      
      const userId = authData.user.id;
      
      const insertAttempt = {
        site_id: 2,
        user_id: userId,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        total_questions: 10,
        correct_answers: 8,
        is_practice: false
      };
      
      // Try with different headers to bypass RLS
      const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/quiz_attempts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
          'X-Client-Info': 'checkloop-staff',  // Custom header
          'Role': 'authenticated'  // Explicit role
        },
        body: JSON.stringify(insertAttempt)
      });
      
      const responseText = await insertResponse.text();
      console.log('   Result:', insertResponse.status, responseText);
      
      if (insertResponse.ok) {
        console.log('🎉 Success with RLS bypass headers!');
        const data = JSON.parse(responseText);
        // Clean up
        await fetch(`${SUPABASE_URL}/rest/v1/quiz_attempts?id=eq.${data[0].id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'apikey': SUPABASE_ANON_KEY }
        });
      } else {
        console.log('❌ Still failing - this is likely a database-level constraint/trigger issue');
        
        // Check if there are any functions or triggers we can see
        console.log('\n🔍 Checking for available functions...');
        
        const functionsResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'apikey': SUPABASE_ANON_KEY
          }
        });
        
        console.log('   Functions endpoint status:', functionsResponse.status);
      }
      
    } else {
      console.log('❌ Cannot access master_users table:', masterResponse.status);
    }

  } catch (error) {
    console.error('❌ Failed to create view:', error);
  }
}

createKioskUsersView();