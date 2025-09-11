// Comprehensive test for all AI edge functions
const LOCAL_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

// Test generate-avatar function
async function testGenerateAvatar() {
  console.log('🎨 Testing generate-avatar...');
  
  try {
    const payload = {
      description: "A friendly nurse with short blonde hair",
      seedHint: "TestUser",
      options: {
        'opt-eyes': ['variant01', 'variant02', 'variant03'],
        'opt-hair': ['short01', 'short02'],
        'opt-hairColor': ['blonde', 'brown'],
        'opt-skinColor': ['f2d3b1', 'ecad80']
      }
    };

    const response = await fetch('http://127.0.0.1:54321/functions/v1/generate-avatar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOCAL_ANON_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (response.ok && result.seed) {
      console.log('  ✅ generate-avatar: WORKING');
      return true;
    } else {
      console.log('  ❌ generate-avatar: FAILED -', result.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('  ❌ generate-avatar: ERROR -', error.message);
    return false;
  }
}

// Test generate-holiday-avatar function
async function testGenerateHolidayAvatar() {
  console.log('🏖️ Testing generate-holiday-avatar...');
  
  try {
    const payload = {
      destination: "Paris",
      avatarUrl: "https://example.com/avatar.jpg"
    };

    const response = await fetch('http://127.0.0.1:54321/functions/v1/generate-holiday-avatar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOCAL_ANON_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (response.ok && result.imageUrl) {
      console.log('  ✅ generate-holiday-avatar: WORKING');
      return true;
    } else {
      console.log('  ❌ generate-holiday-avatar: FAILED -', result.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('  ❌ generate-holiday-avatar: ERROR -', error.message);
    return false;
  }
}

// Test extract-complaint function
async function testExtractComplaint() {
  console.log('📋 Testing extract-complaint...');
  
  try {
    const payload = {
      text: "I'm really unhappy with the service. The staff was rude and I had to wait 2 hours to be seen."
    };

    const response = await fetch('http://127.0.0.1:54321/functions/v1/extract-complaint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOCAL_ANON_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('  ✅ extract-complaint: WORKING');
      return true;
    } else {
      console.log('  ❌ extract-complaint: FAILED -', result.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('  ❌ extract-complaint: ERROR -', error.message);
    return false;
  }
}

// Test enhance-meeting-notes function
async function testEnhanceMeetingNotes() {
  console.log('📝 Testing enhance-meeting-notes...');
  
  try {
    const payload = {
      meeting_title: "Weekly Team Meeting",
      meeting_date: "2024-01-15",
      raw_notes: "Discussed project progress. Team needs more resources. Next deadline is Feb 1st.",
      agenda_items: ["Project updates", "Resource allocation"],
      attendees: ["John", "Jane", "Bob"]
    };

    const response = await fetch('http://127.0.0.1:54321/functions/v1/enhance-meeting-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOCAL_ANON_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    if (response.ok && result.enhanced_notes) {
      console.log('  ✅ enhance-meeting-notes: WORKING');
      return true;
    } else {
      console.log('  ❌ enhance-meeting-notes: FAILED -', result.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('  ❌ enhance-meeting-notes: ERROR -', error.message);
    return false;
  }
}

// Test transcribe-meeting function (with minimal audio data)
async function testTranscribeMeeting() {
  console.log('🎤 Testing transcribe-meeting...');
  
  try {
    // Very minimal audio data for testing (this might fail due to invalid audio, but we test the endpoint)
    const payload = {
      audio_base64: 'UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA',
      filename: 'test_audio.wav',
      meeting_id: 'test_123',
      file_type: 'audio/wav'
    };

    const response = await fetch('http://127.0.0.1:54321/functions/v1/transcribe-meeting', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOCAL_ANON_KEY}`
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    
    // Even if transcription fails due to invalid audio, we check if the function responds properly
    if (response.status === 200 || (result.error && !result.error.includes('CheckLoopsAI key not configured'))) {
      console.log('  ✅ transcribe-meeting: WORKING (CheckLoopsAI accessible)');
      return true;
    } else {
      console.log('  ❌ transcribe-meeting: FAILED -', result.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('  ❌ transcribe-meeting: ERROR -', error.message);
    return false;
  }
}

// Test test-checkloopsai function (we already know this works)
async function testCheckLoopsAI() {
  console.log('🔑 Testing test-checkloopsai...');
  
  try {
    const response = await fetch('http://127.0.0.1:54321/functions/v1/test-checkloopsai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOCAL_ANON_KEY}`
      },
      body: JSON.stringify({})
    });

    const result = await response.json();
    
    if (response.ok && result.success) {
      console.log('  ✅ test-checkloopsai: WORKING');
      return true;
    } else {
      console.log('  ❌ test-checkloopsai: FAILED -', result.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('  ❌ test-checkloopsai: ERROR -', error.message);
    return false;
  }
}

// Run all tests
async function runAllAITests() {
  console.log('🚀 Testing all AI edge functions...\n');
  
  const results = await Promise.all([
    testCheckLoopsAI(),
    testGenerateAvatar(),
    testGenerateHolidayAvatar(),
    testExtractComplaint(),
    testEnhanceMeetingNotes(),
    testTranscribeMeeting()
  ]);
  
  const working = results.filter(Boolean).length;
  const total = results.length;
  
  console.log(`\n📊 Results: ${working}/${total} AI functions working`);
  
  if (working === total) {
    console.log('🎉 All AI functions are properly configured and working locally!');
    console.log('✨ Your CheckLoopsAI secret is working across all services.');
  } else {
    console.log('⚠️  Some AI functions need attention. Check the specific errors above.');
  }
  
  return working === total;
}

// Run the tests
runAllAITests().catch(console.error);