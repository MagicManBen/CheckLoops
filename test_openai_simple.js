// Simple test to verify OpenAI API connectivity
// This tests the same API key that's used in the generate-holiday-avatar function

async function testOpenAIAPI() {
    console.log('🧪 Testing OpenAI API connectivity...');
    
    // NOTE: This test file should only be used for testing - API key removed for security
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('❌ OPENAI_API_KEY environment variable not set');
        return { success: false, error: 'No API key configured' };
    }
    
    try {
        console.log('📡 Making API call to OpenAI Chat Completions...');
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "user",
                        content: "Say hello and confirm you're working properly. Keep it brief."
                    }
                ],
                max_tokens: 50
            })
        });

        console.log(`📊 Response status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ API call successful!');
            console.log('🤖 ChatGPT Response:', data.choices[0].message.content);
            console.log('📈 Usage:', data.usage);
            return { success: true, data };
        } else {
            const errorText = await response.text();
            console.error('❌ API call failed:');
            console.error('Status:', response.status);
            console.error('Error:', errorText);
            return { success: false, error: errorText, status: response.status };
        }
        
    } catch (error) {
        console.error('💥 Network or other error:', error.message);
        return { success: false, error: error.message };
    }
}

// Test DALL-E API as well (used in holiday avatar generation)
async function testDALLE() {
    console.log('🎨 Testing DALL-E API connectivity...');
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('❌ OPENAI_API_KEY environment variable not set');
        return { success: false, error: 'No API key configured' };
    }
    
    try {
        console.log('📡 Making API call to DALL-E...');
        
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: "A simple test image: a blue square",
                n: 1,
                size: "1024x1024",
                quality: "standard"
            })
        });

        console.log(`📊 DALL-E Response status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ DALL-E API call successful!');
            console.log('🖼️ Generated image URL:', data.data[0].url);
            return { success: true, data };
        } else {
            const errorText = await response.text();
            console.error('❌ DALL-E API call failed:');
            console.error('Status:', response.status);
            console.error('Error:', errorText);
            return { success: false, error: errorText, status: response.status };
        }
        
    } catch (error) {
        console.error('💥 DALL-E Network or other error:', error.message);
        return { success: false, error: error.message };
    }
}

// Run tests
async function runTests() {
    console.log('🚀 Starting OpenAI API Tests\n');
    
    // Test ChatGPT
    const chatResult = await testOpenAIAPI();
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test DALL-E 
    const dalleResult = await testDALLE();
    
    console.log('\n' + '='.repeat(50));
    console.log('📋 TEST SUMMARY:');
    console.log('ChatGPT API:', chatResult.success ? '✅ Working' : '❌ Failed');
    console.log('DALL-E API:', dalleResult.success ? '✅ Working' : '❌ Failed');
    
    if (!chatResult.success || !dalleResult.success) {
        console.log('\n🔍 DIAGNOSIS:');
        if (!chatResult.success) {
            console.log('- ChatGPT issue:', chatResult.error);
        }
        if (!dalleResult.success) {
            console.log('- DALL-E issue:', dalleResult.error);
        }
    }
}

// Run if called directly
if (typeof window === 'undefined') {
    runTests();
}