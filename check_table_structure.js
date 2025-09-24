const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

async function checkTableStructure() {
  console.log('🔍 CHECKING DATABASE STRUCTURE FOR KIOSK_USERS ISSUE');
  console.log('===================================================');
  
  try {
    // Authenticate
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
    
    // Check if kiosk_users table exists
    console.log('\n🔍 Checking if kiosk_users table exists...');
    
    try {
      const kioskResponse = await fetch(`${SUPABASE_URL}/rest/v1/kiosk_users?limit=1`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': SUPABASE_ANON_KEY
        }
      });
      
      if (kioskResponse.ok) {
        console.log('✅ kiosk_users table exists');
      } else if (kioskResponse.status === 404) {
        console.log('❌ kiosk_users table does not exist (404)');
      } else {
        console.log(`❓ kiosk_users check returned status: ${kioskResponse.status}`);
      }
    } catch (e) {
      console.log('❌ Error checking kiosk_users:', e.message);
    }
    
    // Check if quiz_attempts table exists and its structure
    console.log('\n🎯 Checking quiz_attempts table structure...');
    
    try {
      const quizResponse = await fetch(`${SUPABASE_URL}/rest/v1/quiz_attempts?limit=1`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'apikey': SUPABASE_ANON_KEY
        }
      });
      
      if (quizResponse.ok) {
        console.log('✅ quiz_attempts table exists');
        const data = await quizResponse.json();
        if (data.length > 0) {
          console.log('   Sample record structure:', Object.keys(data[0]));
        }
      } else {
        console.log('❌ quiz_attempts table issue:', quizResponse.status);
      }
    } catch (e) {
      console.log('❌ Error checking quiz_attempts:', e.message);
    }
    
    // Try a simple insert with minimal data
    console.log('\n🧪 Testing minimal quiz_attempts insert...');
    
    const userId = authData.user.id;
    
    const minimalRecord = {
      user_id: userId,
      total_questions: 10,
      correct_answers: 8,
      is_practice: false
    };
    
    console.log('   Minimal record:', JSON.stringify(minimalRecord, null, 2));
    
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/quiz_attempts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(minimalRecord)
    });
    
    const responseText = await insertResponse.text();
    console.log('   Insert result:', insertResponse.status, responseText);
    
    if (insertResponse.ok) {
      console.log('🎉 Minimal insert worked! The issue might be with site_id or timestamp fields.');
      // Clean up
      const insertedData = JSON.parse(responseText);
      if (insertedData[0]?.id) {
        await fetch(`${SUPABASE_URL}/rest/v1/quiz_attempts?id=eq.${insertedData[0].id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}`, 'apikey': SUPABASE_ANON_KEY }
        });
      }
    }

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkTableStructure();