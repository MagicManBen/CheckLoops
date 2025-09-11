// Simple test to verify CheckLoopsAI functionality via Supabase function
async function testCheckLoopsAI() {
  console.log('🔑 Testing CheckLoopsAI functionality...\n');
  
  try {
    // Test the transcribe-meeting function with a simple audio test
    const testData = {
      // Very small base64 encoded silence (minimal test data)
      audio_base64: 'UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA',
      filename: 'test_audio.wav',
      meeting_id: 'test_meeting_123',
      file_type: 'audio/wav'
    };

    console.log('📡 Calling Supabase function: transcribe-meeting');
    console.log('📦 Test payload prepared\n');

    // Call the Supabase function
    const response = await fetch('http://127.0.0.1:54321/functions/v1/transcribe-meeting', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ANON_KEY_HERE' // This will need to be updated
      },
      body: JSON.stringify(testData)
    });

    console.log(`📊 Response status: ${response.status}`);
    
    const result = await response.text();
    console.log('📋 Response body:', result);

    if (response.ok) {
      console.log('\n✅ CheckLoopsAI is working! Function executed successfully.');
      
      try {
        const jsonResult = JSON.parse(result);
        if (jsonResult.success) {
          console.log('🎯 Transcription completed successfully');
        }
      } catch (e) {
        console.log('📝 Got text response (might be expected for this test)');
      }
    } else {
      console.log('\n❌ Test failed. Checking error message...');
      
      if (result.includes('CheckLoopsAI key not configured')) {
        console.log('🔐 CheckLoopsAI is not set in Supabase environment');
      } else if (result.includes('OpenAI') || result.includes('API') || result.includes('CheckLoopsAI')) {
        console.log('🔑 CheckLoopsAI seems to be set but may be invalid');
      } else {
        console.log('🤔 Different error occurred:', result);
      }
    }

  } catch (error) {
    console.error('💥 Network or other error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Tip: Make sure Supabase is running locally:');
      console.log('   supabase start');
    }
  }
}

// Alternative test using a simpler function call
async function testSimpleCheckLoopsAI() {
  console.log('\n🧪 Alternative test: Simple CheckLoopsAI validation...\n');
  
  try {
    // Test a minimal OpenAI call via enhance-meeting-notes function
    const testNotes = "Test meeting notes for API validation";
    
    const response = await fetch('http://127.0.0.1:54321/functions/v1/enhance-meeting-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ANON_KEY_HERE'
      },
      body: JSON.stringify({
        notes: testNotes,
        meeting_id: 'test_123'
      })
    });

    console.log(`📊 Response status: ${response.status}`);
    const result = await response.text();
    console.log('📋 Response:', result);

    if (response.ok) {
      console.log('\n✅ Alternative test successful - CheckLoopsAI is working!');
    } else {
      console.log('\n❌ Alternative test failed');
      if (result.includes('CheckLoopsAI key not configured')) {
        console.log('🔐 Confirmed: CheckLoopsAI is not set');
      }
    }

  } catch (error) {
    console.error('💥 Alternative test error:', error.message);
  }
}

// Run both tests
console.log('🚀 Starting CheckLoopsAI verification tests...\n');
testCheckLoopsAI().then(() => {
  return testSimpleCheckLoopsAI();
}).then(() => {
  console.log('\n🏁 Test completed!');
  console.log('\n📝 Next steps if key is missing:');
  console.log('   1. Set the secret: supabase secrets set CheckLoopsAI=your_key_here');
  console.log('   2. Redeploy functions: supabase functions deploy');
  console.log('   3. Re-run this test');
});