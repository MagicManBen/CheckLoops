import { chromium } from 'playwright';

async function testAvatarGeneration() {
  console.log('🚀 Starting avatar generation test...\n');
  
  const browser = await chromium.launch({ 
    headless: false,
    devtools: true // Open devtools to see console errors
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Listen for console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console error:', msg.text());
    } else if (msg.text().includes('Edge Function') || msg.text().includes('avatar')) {
      console.log('📝 Console:', msg.text());
    }
  });
  
  // Listen for page errors
  page.on('pageerror', error => {
    console.log('❌ Page error:', error.message);
  });
  
  try {
    // Step 1: Login via home.html
    console.log('📍 Step 1: Navigating to home.html...');
    await page.goto('http://127.0.0.1:61024/home.html');
    await page.waitForTimeout(2000);
    
    // Take screenshot
    await page.screenshot({ path: 'test_1_home.png' });
    console.log('📸 Screenshot saved: test_1_home.png');
    
    // Login as staff user
    console.log('📍 Step 2: Logging in as staff user...');
    await page.fill('#email', 'ben.howard@stoke.nhs.uk');
    await page.fill('input[type="password"]', 'Hello1!');
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation to staff.html
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test_2_staff.png' });
    console.log('📸 Screenshot saved: test_2_staff.png');
    console.log('✅ Logged in successfully, now at:', page.url());
    
    // Step 3: Navigate to Welcome page
    console.log('📍 Step 3: Navigating to Welcome page...');
    
    // Check if we're on staff.html and find the Welcome button
    if (page.url().includes('staff.html')) {
      // Look for the Welcome button in the navigation
      const welcomeButton = await page.locator('button:has-text("Welcome")').first();
      if (await welcomeButton.isVisible()) {
        await welcomeButton.click();
        console.log('✅ Clicked Welcome button');
      } else {
        // Try direct navigation
        await page.goto('http://127.0.0.1:61024/staff-welcome.html');
        console.log('📍 Navigated directly to staff-welcome.html');
      }
    } else {
      await page.goto('http://127.0.0.1:61024/staff-welcome.html');
    }
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test_3_welcome.png' });
    console.log('📸 Screenshot saved: test_3_welcome.png');
    
    // Step 4: Test avatar generation
    console.log('📍 Step 4: Testing avatar generation...');
    
    // Look for the AI description input
    const aiInput = await page.locator('#avatar-ai-input, input[placeholder*="Describe"], input[placeholder*="avatar"]').first();
    if (await aiInput.isVisible()) {
      console.log('✅ Found AI input field');
      await aiInput.fill('A friendly doctor with glasses and brown hair');
      
      // Find and click the generate button
      const generateButton = await page.locator('button:has-text("Generate"), button:has-text("Create"), button:has-text("AI")').first();
      if (await generateButton.isVisible()) {
        console.log('🎨 Clicking generate button...');
        
        // Set up response listener before clicking
        const responsePromise = page.waitForResponse(response => 
          response.url().includes('generate-avatar') || 
          response.url().includes('functions/v1')
        );
        
        await generateButton.click();
        
        // Wait for the response
        console.log('⏳ Waiting for Edge Function response...');
        const response = await Promise.race([
          responsePromise,
          page.waitForTimeout(10000).then(() => null)
        ]);
        
        if (response) {
          console.log('📡 Edge Function response status:', response.status());
          const responseBody = await response.text();
          console.log('📡 Response body:', responseBody.substring(0, 200));
          
          if (response.status() === 200) {
            console.log('✅ Avatar generation successful!');
          } else {
            console.log('❌ Avatar generation failed with status:', response.status());
          }
        } else {
          console.log('⏱️ Request timed out or no response captured');
        }
        
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'test_4_after_generate.png' });
        console.log('📸 Screenshot saved: test_4_after_generate.png');
        
        // Check for any error messages on the page
        const errorMessage = await page.locator('.error, [class*="error"], [id*="error"], :has-text("failed"), :has-text("error")').first();
        if (await errorMessage.isVisible()) {
          const errorText = await errorMessage.textContent();
          console.log('❌ Error message on page:', errorText);
        }
        
      } else {
        console.log('❌ Generate button not found');
      }
    } else {
      console.log('❌ AI input field not found');
      
      // Take a screenshot to see what's on the page
      await page.screenshot({ path: 'test_debug_page_state.png' });
      console.log('📸 Debug screenshot saved: test_debug_page_state.png');
    }
    
  } catch (error) {
    console.error('💥 Test error:', error);
    await page.screenshot({ path: 'test_error.png' });
    console.log('📸 Error screenshot saved: test_error.png');
  } finally {
    console.log('\n📊 Test Summary:');
    console.log('- Check test_1_home.png for login page');
    console.log('- Check test_2_staff.png for staff page after login');
    console.log('- Check test_3_welcome.png for welcome page');
    console.log('- Check test_4_after_generate.png for result');
    
    await browser.close();
    console.log('\n✅ Test completed');
  }
}

testAvatarGeneration().catch(console.error);