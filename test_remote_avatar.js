// Test remote generate-avatar function
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

async function testRemoteAvatar() {
  console.log('🎨 Testing remote generate-avatar function...\n');
  
  // Simple test payload
  const payload = {
    description: "A friendly doctor with glasses",
    options: {
      "opt-eyes": ["variant01"],
      "opt-mouth": ["variant01"],
      "opt-hairColor": ["brown"],
      "opt-skinColor": ["light"]
    },
    seedHint: "Doctor"
  };

  try {
    // Direct API call to the Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-avatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify(payload)
    });

    console.log(`📊 Response status: ${response.status}`);
    const result = await response.text();
    
    try {
      const jsonResult = JSON.parse(result);
      console.log('📋 Response:', JSON.stringify(jsonResult, null, 2));
      
      if (response.ok && jsonResult.seed) {
        console.log('\n✅ SUCCESS: Remote avatar generation is working!');
      } else if (jsonResult.error) {
        console.log('\n❌ ERROR:', jsonResult.error);
        
        if (jsonResult.error.includes('CheckLoopsAI')) {
          console.log('🔧 Issue: CheckLoopsAI secret not accessible on remote');
        } else if (jsonResult.error.includes('authorization')) {
          console.log('🔒 Issue: Need proper authentication');
        }
      }
    } catch (e) {
      console.log('📋 Non-JSON response:', result);
    }
    
  } catch (error) {
    console.error('💥 Network error:', error.message);
  }
}

testRemoteAvatar();