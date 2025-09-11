// Direct test of CheckLoopsAI functionality
async function testCheckLoopsAIDirect() {
  console.log('🔬 Direct CheckLoopsAI Test\n');
  
  try {
    // Test enhance-meeting-notes function (requires raw_notes)
    const testData = {
      meeting_title: "Test Meeting",
      meeting_date: "2025-01-15",
      raw_notes: "This is a test meeting to verify CheckLoopsAI functionality. We discussed AI integration and confirmed the system is working.",
      agenda_items: [
        { title: "AI Testing", description: "Test CheckLoopsAI integration" }
      ],
      attendees: ["Test User"]
    };

    console.log('📡 Testing enhance-meeting-notes function...');
    
    const response = await fetch('http://127.0.0.1:54321/functions/v1/enhance-meeting-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    console.log(`📊 Response status: ${response.status}`);
    const result = await response.text();
    
    try {
      const jsonResult = JSON.parse(result);
      console.log('📋 Response:', jsonResult);
      
      if (response.ok && jsonResult.enhanced_notes) {
        console.log('\n✅ SUCCESS: CheckLoopsAI is working!');
        console.log('🎯 AI enhanced the meeting notes successfully');
        console.log('\n📝 Enhanced Notes Preview:');
        console.log(jsonResult.enhanced_notes.substring(0, 200) + '...');
        return true;
      } else {
        console.log('\n❌ FAILED: CheckLoopsAI not working properly');
        return false;
      }
    } catch (e) {
      console.log('📋 Raw response:', result);
      if (result.includes('CheckLoopsAI key not configured')) {
        console.log('\n❌ CheckLoopsAI secret not accessible by function');
      } else {
        console.log('\n🤔 Unexpected response format');
      }
      return false;
    }

  } catch (error) {
    console.error('💥 Test error:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Make sure Supabase is running: supabase start');
    }
    return false;
  }
}

// Run the test
console.log('🚀 Starting direct CheckLoopsAI test...\n');
testCheckLoopsAIDirect().then(success => {
  if (success) {
    console.log('\n🎉 Test completed successfully!');
    console.log('✅ CheckLoopsAI secret is configured and working');
  } else {
    console.log('\n❌ Test failed');
    console.log('🔧 Troubleshooting steps:');
    console.log('   1. Verify secret: supabase secrets list');
    console.log('   2. Check deployment: supabase functions deploy');
    console.log('   3. Check Supabase logs: supabase functions logs');
  }
});