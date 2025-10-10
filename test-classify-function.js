// Test script to verify the classify-slot-types Edge Function
// Run with: node test-classify-function.js

const SUPABASE_URL = 'https://unveoqnlqnobufhublyw.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

async function testClassifyFunction() {
  console.log('🧪 Testing classify-slot-types Edge Function\n');
  console.log('URL:', `${SUPABASE_URL}/functions/v1/classify-slot-types`);
  console.log('Testing with sample slot types...\n');

  // Sample slot types similar to what EMIS would have
  const testSlotTypes = [
    'Urgent on day',
    'Emergency appointment',
    'Same day appointment',
    'Routine appointment',
    'GP appointment',
    'Follow-up 1 week',
    'Follow-up 2 weeks',
    'Review in 10 days',
    'Nurse appointment',
    'Telephone consultation'
  ];

  console.log('Sample slot types:', testSlotTypes);
  console.log('\n📤 Sending request...\n');

  const startTime = Date.now();

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/classify-slot-types`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      },
      body: JSON.stringify({ slotTypes: testSlotTypes })
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️  Response time: ${duration}ms`);
    console.log(`📊 Status: ${response.status} ${response.statusText}\n`);

    const responseText = await response.text();
    console.log('📥 Raw response:', responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('❌ Failed to parse response as JSON:', e.message);
      return;
    }

    if (response.ok) {
      console.log('\n✅ SUCCESS!\n');
      
      if (data.classification) {
        console.log('Classification results:');
        console.log('  on_the_day:', data.classification.on_the_day || []);
        console.log('  within_1_week:', data.classification.within_1_week || []);
        console.log('  within_2_weeks:', data.classification.within_2_weeks || []);
        
        const total = (data.classification.on_the_day?.length || 0) + 
                     (data.classification.within_1_week?.length || 0) + 
                     (data.classification.within_2_weeks?.length || 0);
        console.log(`\n📊 Total classified: ${total} out of ${testSlotTypes.length} slot types`);
        
        if (total !== testSlotTypes.length) {
          console.log('⚠️  Warning: Not all slot types were classified!');
        }
      }

      if (data.debug) {
        console.log('\n🔍 Debug info available:');
        console.log('  Prompt length:', data.debug.prompt?.length || 0, 'chars');
        console.log('  AI response length:', data.debug.aiRaw?.length || 0, 'chars');
      }
    } else {
      console.log('\n❌ ERROR:\n');
      console.log(JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('\n💥 Request failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Also test with empty array to see error handling
async function testErrorHandling() {
  console.log('\n\n🧪 Testing error handling with empty array\n');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/classify-slot-types`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      },
      body: JSON.stringify({ slotTypes: [] })
    });

    const data = await response.json();
    
    if (!response.ok && data.error) {
      console.log('✅ Error handling works correctly:', data.error);
    } else {
      console.log('⚠️  Unexpected response:', data);
    }
  } catch (error) {
    console.error('❌ Error test failed:', error.message);
  }
}

// Run tests
(async () => {
  await testClassifyFunction();
  await testErrorHandling();
  console.log('\n✨ Tests complete\n');
})();
