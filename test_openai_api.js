#!/usr/bin/env node

// Test OpenAI API key and DALL-E image generation
const API_KEY = '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';

async function testOpenAI() {
    console.log('🔧 Testing OpenAI API key...\n');
    
    const destination = 'Paris';
    const prompt = `Create a fun, cartoon-style image of a happy person on holiday in ${destination}. The person should be relaxed and cheerful, wearing vacation attire appropriate for ${destination}. Include the Eiffel Tower and other recognizable Paris landmarks in the background. The person should be taking a selfie or posing for a vacation photo. Style: friendly, colorful, vacation vibes, digital illustration, vibrant and cheerful.`;
    
    console.log('📝 Prompt being sent to DALL-E 3:');
    console.log(prompt);
    console.log('\n🎨 Generating image...\n');
    
    try {
        const response = await fetch('https://api.openai.com/v1/images/generations', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: prompt,
                n: 1,
                size: "1024x1024",
                quality: "standard",
                style: "vivid"
            })
        });
        
        console.log('📡 Response status:', response.status);
        
        const responseText = await response.text();
        console.log('\n📋 Raw response:');
        console.log(responseText);
        
        if (response.ok) {
            const data = JSON.parse(responseText);
            if (data.data && data.data[0] && data.data[0].url) {
                console.log('\n✅ SUCCESS! Image generated successfully!');
                console.log('🖼️ Image URL:', data.data[0].url);
                console.log('\n📌 Revised prompt used by DALL-E:');
                console.log(data.data[0].revised_prompt || 'Not provided');
            } else {
                console.log('\n❌ Unexpected response structure:', data);
            }
        } else {
            console.log('\n❌ API Error:', responseText);
            const errorData = JSON.parse(responseText);
            if (errorData.error) {
                console.log('Error type:', errorData.error.type);
                console.log('Error message:', errorData.error.message);
            }
        }
    } catch (error) {
        console.error('\n💥 Request failed:', error);
    }
}

// Run the test
testOpenAI();