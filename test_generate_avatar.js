// Test the generate-avatar edge function with proper auth
async function testGenerateAvatar() {
  console.log('🎨 Testing generate-avatar edge function...\n');
  
  try {
    // Test payload similar to what staff-welcome.html sends
    const payload = {
      description: "A friendly doctor with glasses and short brown hair",
      seedHint: "TestUser",
      options: {
        'opt-backgroundType': ['solid', 'gradientLinear'],
        'opt-backgroundColor': ['ffffff', 'f0f0f0', 'e0e0e0'],
        'opt-eyes': ['variant01', 'variant02', 'variant03'],
        'opt-mouth': ['variant01', 'variant02', 'variant03'],
        'opt-eyebrows': ['variant01', 'variant02', 'variant03'],
        'opt-glasses': ['variant01', 'variant02', 'variant03'],
        'opt-glassesProbability': [0, 50, 100],
        'opt-hair': ['short01', 'short02', 'short03'],
        'opt-hairColor': ['000000', '9e5622', '6b4226'],
        'opt-skinColor': ['f2d3b1', 'ecad80', 'd78774']
      }
    };

    console.log('📡 Calling local Supabase function: generate-avatar');
    console.log('📦 Test description:', payload.description);

    // Call the local Supabase function with proper auth
    const response = await fetch('http://127.0.0.1:54321/functions/v1/generate-avatar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
        'Origin': 'http://127.0.0.1:50983' // Simulate the origin
      },
      body: JSON.stringify(payload)
    });

    console.log(`\n📊 Response status: ${response.status}`);
    
    const result = await response.json();
    console.log('📋 Response:', JSON.stringify(result, null, 2));

    if (response.ok && !result.error) {
      console.log('\n✅ SUCCESS: Avatar generation is working!');
      console.log('Generated parameters:');
      console.log('- Seed:', result.seed);
      console.log('- Hair:', result.hair);
      console.log('- Glasses:', result.glasses);
      console.log('- Glasses Probability:', result.glassesProbability);
      return true;
    } else {
      console.log('\n❌ FAILED: Avatar generation failed');
      
      if (result.error) {
        if (result.error.includes('CheckLoopsAI')) {
          console.log('🔐 Issue: CheckLoopsAI secret problem');
        } else if (result.error.includes('authorization')) {
          console.log('🔑 Issue: Authorization problem');
        } else {
          console.log('🤔 Error:', result.error);
        }
      }
      return false;
    }

  } catch (error) {
    console.error('💥 Network/connection error:', error.message);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('fetch')) {
      console.log('\n💡 Tip: Make sure Supabase is running locally:');
      console.log('   supabase start');
    }
    return false;
  }
}

// Run the test
console.log('🚀 Starting avatar generation test...\n');
testGenerateAvatar().then(success => {
  if (success) {
    console.log('\n🎉 Avatar generation is properly configured and working!');
    console.log('\n✨ The AI avatar generation should now work on staff-welcome.html');
  } else {
    console.log('\n📝 Next steps to fix:');
    console.log('   1. Check if CheckLoopsAI secret is set: supabase secrets list');
    console.log('   2. Verify the function is deployed: supabase functions list');
    console.log('   3. Check function logs: supabase functions logs generate-avatar');
  }
});