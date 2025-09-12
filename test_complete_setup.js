import { chromium } from 'playwright';

async function testCompleteSetup() {
  console.log('🧪 Testing Complete Setup button functionality...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Login flow
    console.log('📱 Navigating to login page...');
    await page.goto('http://127.0.0.1:58156/index.html');
    
    console.log('🔐 Logging in...');
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('input[type="password"]').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Navigate to welcome page 
    console.log('📋 Navigating to staff welcome page...');
    await page.goto('http://127.0.0.1:58156/staff-welcome.html');
    await page.waitForTimeout(2000);
    
    // Skip to step 4 (working pattern) by simulating completion of previous steps
    console.log('⏭️ Navigating to working pattern step...');
    
    // Set some basic data that might be needed
    await page.evaluate(() => {
      window.selectedRole = 'Reception Staff'; // Non-GP role for testing
    });
    
    // Show step 4 directly
    await page.evaluate(() => {
      document.getElementById('welcome-step1').style.display = 'none';
      document.getElementById('welcome-step2').style.display = 'none'; 
      document.getElementById('welcome-step3').style.display = 'none';
      document.getElementById('welcome-step4').style.display = '';
      
      // Call setupWorkingPatternForm to populate the form
      if (typeof setupWorkingPatternForm === 'function') {
        setupWorkingPatternForm();
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Take screenshot before clicking
    await page.screenshot({ path: 'before_complete_setup.png' });
    console.log('📸 Screenshot taken: before_complete_setup.png');
    
    // Check if button exists and is visible
    const button = await page.locator('#finish-setup-btn');
    const buttonExists = await button.count() > 0;
    console.log(`🔍 Complete Setup button exists: ${buttonExists}`);
    
    if (buttonExists) {
      const buttonVisible = await button.isVisible();
      console.log(`👁️ Complete Setup button visible: ${buttonVisible}`);
      
      if (buttonVisible) {
        console.log('🖱️ Clicking Complete Setup button...');
        
        // Listen for console logs to catch any errors
        page.on('console', msg => {
          console.log(`📝 Browser console: ${msg.text()}`);
        });
        
        // Click the button
        await button.click();
        
        // Wait and check for navigation or error messages
        await page.waitForTimeout(3000);
        
        // Check if we're on staff.html or if there's an error message
        const currentUrl = page.url();
        console.log(`🌐 Current URL after click: ${currentUrl}`);
        
        const errorMsg = await page.locator('#finish-setup-msg').textContent();
        console.log(`💬 Status message: "${errorMsg}"`);
        
        // Take screenshot after clicking
        await page.screenshot({ path: 'after_complete_setup.png' });
        console.log('📸 Screenshot taken: after_complete_setup.png');
        
        if (currentUrl.includes('staff.html')) {
          console.log('✅ SUCCESS: Navigated to staff.html successfully!');
        } else if (errorMsg && errorMsg.includes('Could not save')) {
          console.log('❌ ERROR: Failed to save working pattern');
        } else {
          console.log('⚠️ UNCLEAR: Button clicked but unclear result');
        }
      } else {
        console.log('❌ ERROR: Button exists but not visible');
      }
    } else {
      console.log('❌ ERROR: Complete Setup button not found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'test_error.png' });
  } finally {
    await browser.close();
  }
}

testCompleteSetup();