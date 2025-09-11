// Test generate-avatar function directly
async function testGenerateAvatar() {
  console.log('🎨 Testing generate-avatar function...\n');
  
  try {
    // Prepare test data similar to what staff-welcome.html sends
    const testPayload = {
      description: "A friendly healthcare professional with short brown hair and glasses",
      options: {
        "opt-eyes": ["variant01", "variant02", "variant03", "variant04", "variant05"],
        "opt-mouth": ["variant01", "variant02", "variant03", "variant04", "variant05"],
        "opt-hairColor": ["auburn", "black", "blonde", "brown", "gray", "red"],
        "opt-skinColor": ["light", "medium", "dark"],
        "opt-backgroundColor": ["b6e3f4", "c7d2fe", "ddd6fe", "f3e8ff", "fecaca"]
      },
      seedHint: "TestUser"
    };

    console.log('📡 Calling generate-avatar function...');
    console.log('📦 Payload:', JSON.stringify(testPayload, null, 2));

    // Test without auth first to see the specific error
    const response = await fetch('http://127.0.0.1:54321/functions/v1/generate-avatar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: No Authorization header to test the error
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`📊 Response status: ${response.status}`);
    const result = await response.text();
    
    console.log('📋 Raw response:', result);
    
    try {
      const jsonResult = JSON.parse(result);
      console.log('📋 Parsed response:', jsonResult);
      
      if (response.ok && jsonResult.seed) {
        console.log('\n✅ SUCCESS: Avatar generation working');
        console.log('🎯 Generated avatar parameters:', Object.keys(jsonResult));
      } else {
        console.log('\n❌ FAILED: Avatar generation failed');
        if (jsonResult.error) {
          console.log('🔍 Error:', jsonResult.error);
          
          if (jsonResult.error.includes('authorization')) {
            console.log('💡 This is expected - function requires authentication');
          } else if (jsonResult.error.includes('CheckLoopsAI')) {
            console.log('🔧 CheckLoopsAI configuration issue detected');
          }
        }
      }
    } catch (parseError) {
      console.log('📋 Non-JSON response:', result);
      
      if (result.includes('CheckLoopsAI key not configured')) {
        console.log('❌ CheckLoopsAI secret not accessible');
      } else if (result.includes('authorization')) {
        console.log('🔒 Authentication required (expected)');
      } else {
        console.log('🤔 Unexpected response format');
      }
    }

    return { status: response.status, body: result };

  } catch (error) {
    console.error('💥 Network error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure Supabase is running: supabase start');
    }
    
    return null;
  }
}

// Test with mock auth header
async function testGenerateAvatarWithAuth() {
  console.log('\n🔐 Testing with auth header...\n');
  
  try {
    const testPayload = {
      description: "A professional doctor with a warm smile",
      options: {
        "opt-eyes": ["variant01", "variant02", "variant03"],
        "opt-mouth": ["variant01", "variant02", "variant03"],
        "opt-hairColor": ["brown", "black", "blonde"],
        "opt-skinColor": ["light", "medium", "dark"]
      },
      seedHint: "Doctor"
    };

    const response = await fetch('http://127.0.0.1:54321/functions/v1/generate-avatar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token-for-testing'
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`📊 Response status: ${response.status}`);
    const result = await response.text();
    console.log('📋 Response:', result.substring(0, 200) + '...');
    
  } catch (error) {
    console.error('💥 Auth test error:', error.message);
  }
}

// Run tests
console.log('🚀 Starting generate-avatar function tests...\n');
testGenerateAvatar()
  .then(() => testGenerateAvatarWithAuth())
  .then(() => {
    console.log('\n🏁 Tests completed!');
    console.log('\n🔧 If issues found:');
    console.log('   1. Check function logs: supabase start (look for logs in terminal)');
    console.log('   2. Verify CheckLoopsAI secret: supabase secrets list');
    console.log('   3. Test in browser with actual auth token');
  });