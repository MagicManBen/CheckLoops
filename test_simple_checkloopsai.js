// Super simple test to verify CheckLoopsAI secret works
async function testCheckLoopsAISecret() {
  console.log('🔑 Testing CheckLoopsAI secret...\n');
  
  try {
    // Call the dedicated test-checkloopsai function
    const response = await fetch('http://127.0.0.1:54321/functions/v1/test-checkloopsai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
      },
      body: JSON.stringify({})
    });

    console.log(`📊 Response status: ${response.status}`);
    
    const result = await response.json();
    console.log('📋 Response:', JSON.stringify(result, null, 2));

    if (response.ok && result.success) {
      console.log('\n✅ SUCCESS: CheckLoopsAI secret is working!');
      console.log(`🤖 OpenAI response: "${result.message}"`);
      console.log('🔑 API key found:', result.apiKeyFound);
      return true;
    } else {
      console.log('\n❌ FAILED: CheckLoopsAI test failed');
      
      if (result.error && result.error.includes('CheckLoopsAI secret not found')) {
        console.log('🔐 Issue: CheckLoopsAI secret not configured in Supabase');
      } else if (result.error && result.error.includes('OpenAI API error')) {
        console.log('🔑 Issue: CheckLoopsAI secret may be invalid or expired');
      } else {
        console.log('🤔 Unexpected error:', result.error || 'Unknown error');
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
console.log('🚀 Starting CheckLoopsAI secret test...\n');
testCheckLoopsAISecret().then(success => {
  if (success) {
    console.log('\n🎉 CheckLoopsAI secret is properly configured and working!');
  } else {
    console.log('\n📝 Next steps to fix:');
    console.log('   1. Check secret exists: supabase secrets list');
    console.log('   2. Set the secret: supabase secrets set CheckLoopsAI=your_openai_key_here');
    console.log('   3. Redeploy function: supabase functions deploy test-checkloopsai');
    console.log('   4. Re-run this test: node test_simple_checkloopsai.js');
  }
});