import { chromium } from 'playwright';

async function testAvatarComplete() {
  console.log('🧪 Testing Complete Avatar Generation & Save Flow');
  console.log('=' . repeat(50));
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500 // Slow down for visibility
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Add console listener to capture errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Browser error:', msg.text());
    } else if (msg.text().includes('avatar') || msg.text().includes('AI') || msg.text().includes('Edge Function')) {
      console.log('📝 Browser log:', msg.text());
    }
  });
  
  // Add response listener to track API calls
  page.on('response', response => {
    if (response.url().includes('generate-avatar')) {
      console.log(`🔄 API Call to generate-avatar: ${response.status()} ${response.statusText()}`);
      if (response.status() !== 200) {
        response.text().then(text => console.log('Response body:', text));
      }
    }
  });
  
  try {
    // Step 1: Navigate to the live site
    console.log('\n1️⃣ Navigating to live site...');
    await page.goto('https://magicmanben.github.io/CheckLoops/staff.html');
    await page.waitForTimeout(2000);
    
    // Step 2: Login
    console.log('2️⃣ Logging in...');
    
    // Wait for and fill email
    await page.waitForSelector('#email', { timeout: 10000 });
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    
    // Fill password - be specific about which password field
    const passwordField = page.locator('#password').first();
    await passwordField.fill('Hello1!');
    
    // Click sign in
    await page.click('button:has-text("Sign In")');
    
    // Wait for navigation
    await page.waitForTimeout(5000);
    
    // Check if we're on the dashboard
    const url = page.url();
    console.log('Current URL:', url);
    
    // Step 3: Navigate to Welcome page
    console.log('3️⃣ Navigating to Welcome page...');
    
    // Click the Welcome button if visible
    const welcomeBtn = page.locator('button:has-text("Welcome")').first();
    if (await welcomeBtn.isVisible()) {
      await welcomeBtn.click();
      await page.waitForTimeout(3000);
    } else {
      // Direct navigation
      await page.goto('https://magicmanben.github.io/CheckLoops/staff-welcome.html');
      await page.waitForTimeout(3000);
    }
    
    // Step 4: Handle welcome flow
    console.log('4️⃣ Handling welcome flow...');
    
    // Check if we need to enter nickname
    const nicknameField = page.locator('#nickname');
    if (await nicknameField.isVisible()) {
      console.log('   Entering nickname...');
      await nicknameField.fill('TestUser' + Date.now());
      await page.click('#save-btn');
      await page.waitForTimeout(2000);
    }
    
    // Check if we're on step 2 (role/team selection)
    const toAvatarBtn = page.locator('#to-avatar-btn');
    if (await toAvatarBtn.isVisible()) {
      console.log('   Selecting role and team...');
      
      // Select a role
      const roleRadio = page.locator('input[name="role"]').first();
      if (await roleRadio.isVisible()) {
        await roleRadio.check();
      }
      
      // Select a team
      const teamSelect = page.locator('#team-select');
      if (await teamSelect.isVisible()) {
        const options = await teamSelect.locator('option').count();
        if (options > 1) {
          await teamSelect.selectOption({ index: 1 });
        }
      }
      
      // Continue to avatar
      await toAvatarBtn.click();
      await page.waitForTimeout(2000);
    }
    
    // Step 5: Test AI Avatar Generation
    console.log('5️⃣ Testing AI Avatar Generation...');
    
    // Fill in description
    const promptField = page.locator('#avatarPrompt');
    await promptField.fill('Professional doctor with short brown hair, glasses, serious expression, blue background');
    
    // Click generate
    console.log('   Clicking Generate with AI...');
    await page.click('#avatar-ai-generate');
    
    // Wait for generation (max 15 seconds)
    console.log('   Waiting for AI generation...');
    await page.waitForTimeout(15000);
    
    // Check result
    const aiMsg = await page.locator('#avatar-ai-msg').textContent();
    console.log('   AI Message:', aiMsg);
    
    if (aiMsg.includes('✅')) {
      console.log('✅ Avatar generation succeeded!');
      
      // Take screenshot of generated avatar
      await page.screenshot({ 
        path: 'avatar_generated.png', 
        fullPage: false,
        clip: { x: 0, y: 0, width: 1200, height: 800 }
      });
      console.log('📸 Screenshot saved: avatar_generated.png');
      
      // Step 6: Test saving
      console.log('\n6️⃣ Testing avatar save...');
      await page.click('#avatar-save');
      await page.waitForTimeout(3000);
      
      const saveMsg = await page.locator('#avatar-save-msg').textContent();
      console.log('   Save message:', saveMsg);
      
      if (saveMsg.includes('✅')) {
        console.log('✅ Avatar saved successfully!');
        
        // Step 7: Complete setup
        console.log('\n7️⃣ Completing setup...');
        await page.click('#finish-avatar-btn');
        await page.waitForTimeout(3000);
        
        const finishMsg = await page.locator('#finish-avatar-msg').textContent();
        console.log('   Finish message:', finishMsg);
        
        if (finishMsg.includes('All set') || page.url().includes('staff.html')) {
          console.log('✅ Setup completed successfully!');
        }
      }
      
    } else if (aiMsg.includes('❌')) {
      console.log('❌ Avatar generation failed');
      console.log('Error message:', aiMsg);
      
      // Take screenshot of error
      await page.screenshot({ 
        path: 'avatar_error.png', 
        fullPage: true 
      });
      console.log('📸 Error screenshot saved: avatar_error.png');
      
      // Try to get more error details
      const consoleErrors = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.meta-note')).map(el => el.textContent);
      });
      console.log('Page errors:', consoleErrors);
    }
    
    // Final status check
    console.log('\n📊 Final Status:');
    console.log('   Current URL:', page.url());
    console.log('   Test completed');
    
  } catch (error) {
    console.error('❌ Test error:', error);
    
    // Take error screenshot
    await page.screenshot({ 
      path: 'test_error.png', 
      fullPage: true 
    });
    console.log('📸 Error screenshot saved: test_error.png');
    
  } finally {
    console.log('\n🎬 Test finished. Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

// Run the test
console.log('Starting avatar test...\n');
testAvatarComplete().catch(console.error);