import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = 'https://unveoqnlqnobufhublyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVudmVvcW5scW5vYnVmaHVibHl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMTcyNzYsImV4cCI6MjA3MDU5MzI3Nn0.g93OsXDpO3V9DToU7s-Z3SwBBnB84rBv0JMv-idgSME';

async function testAvatarGeneration() {
  console.log('🔧 Testing Avatar Generation Fix');
  
  // Initialize Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // First, test with direct API call
  console.log('\n1️⃣ Testing Direct API Call with Authentication');
  
  try {
    // Login first
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'benhowardmagic@hotmail.com',
      password: 'Hello1!'
    });
    
    if (authError) {
      console.error('❌ Login failed:', authError);
      return;
    }
    
    console.log('✅ Logged in successfully as:', authData.user.email);
    console.log('Session token:', authData.session.access_token.substring(0, 50) + '...');
    
    // Test the Edge Function directly
    console.log('\n2️⃣ Calling Edge Function directly');
    
    const testDescription = 'Professional doctor with short brown hair, glasses, and a serious expression';
    
    const { data, error } = await supabase.functions.invoke('generate-avatar', {
      body: {
        description: testDescription,
        seedHint: 'TestUser',
        options: {
          'opt-backgroundType': ['solid', 'gradientLinear'],
          'opt-backgroundColor': ['transparent', 'f2d3b1', 'ecad80', '9e5622'],
          'opt-eyes': ['variant01', 'variant02', 'variant03'],
          'opt-mouth': ['variant01', 'variant02', 'variant03'],
          'opt-hair': ['short01', 'short02', 'long01'],
          'opt-hairColor': ['ac6511', 'cb6820', '0e0e0e'],
          'opt-skinColor': ['f2d3b1', 'ecad80', '9e5622', '763900'],
          'opt-glassesProbability': [0, 50, 100],
          'opt-hairProbability': [0, 50, 100],
          'opt-featuresProbability': [0, 50, 100]
        }
      }
    });
    
    if (error) {
      console.error('❌ Edge Function error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
    } else {
      console.log('✅ Edge Function returned data:', data);
      console.log('Generated avatar parameters:', JSON.stringify(data, null, 2));
    }
    
  } catch (e) {
    console.error('❌ Unexpected error:', e);
  }
  
  // Now test via browser
  console.log('\n3️⃣ Testing via Browser Interface');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Navigate to login page
    await page.goto('http://127.0.0.1:5500/index.html');
    await page.waitForTimeout(2000);
    
    // Login
    console.log('Logging in via browser...');
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('input[type="password"]').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Navigate to Welcome page
    console.log('Navigating to Welcome page...');
    await page.goto('http://127.0.0.1:5500/staff-welcome.html');
    await page.waitForTimeout(2000);
    
    // Enter nickname if needed
    const nicknameInput = await page.locator('#nickname');
    if (await nicknameInput.isVisible()) {
      console.log('Entering nickname...');
      await nicknameInput.fill('TestUser');
      await page.click('#save-btn');
      await page.waitForTimeout(2000);
    }
    
    // If on step 2, continue to avatar
    const toAvatarBtn = await page.locator('#to-avatar-btn');
    if (await toAvatarBtn.isVisible()) {
      console.log('Continuing to avatar builder...');
      await toAvatarBtn.click();
      await page.waitForTimeout(2000);
    }
    
    // Test AI generation
    console.log('Testing AI generation...');
    await page.locator('#avatarPrompt').fill('Friendly nurse with curly red hair, freckles, and a warm smile');
    
    // Listen for console messages
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🔴 Browser console error:', msg.text());
      } else if (msg.text().includes('Edge Function') || msg.text().includes('avatar')) {
        console.log('📝 Browser console:', msg.text());
      }
    });
    
    // Click generate button
    await page.click('#avatar-ai-generate');
    
    // Wait for result
    await page.waitForTimeout(10000);
    
    // Check for error messages
    const aiMsg = await page.locator('#avatar-ai-msg').textContent();
    console.log('AI Message:', aiMsg);
    
    if (aiMsg.includes('✅')) {
      console.log('✅ Avatar generation succeeded!');
      
      // Test saving
      console.log('Testing save functionality...');
      await page.click('#avatar-save');
      await page.waitForTimeout(3000);
      
      const saveMsg = await page.locator('#avatar-save-msg').textContent();
      console.log('Save message:', saveMsg);
      
      // Take screenshot of success
      await page.screenshot({ path: 'avatar_generation_success.png', fullPage: true });
      console.log('📸 Screenshot saved: avatar_generation_success.png');
    } else {
      console.log('❌ Avatar generation failed');
      
      // Take screenshot of error
      await page.screenshot({ path: 'avatar_generation_error.png', fullPage: true });
      console.log('📸 Screenshot saved: avatar_generation_error.png');
    }
    
  } catch (error) {
    console.error('❌ Browser test error:', error);
    await page.screenshot({ path: 'test_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
  
  // Sign out from Supabase
  await supabase.auth.signOut();
  console.log('\n✅ Test complete');
}

// Run the test
testAvatarGeneration().catch(console.error);