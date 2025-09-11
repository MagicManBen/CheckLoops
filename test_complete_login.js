import { chromium } from 'playwright';

async function testCompleteLogin() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log(`[Browser ${msg.type()}]:`, msg.text());
  });
  
  console.log('Testing complete login flow...\n');
  
  try {
    // Step 1: Navigate to Home.html
    console.log('1. Navigating to Home.html...');
    await page.goto('http://127.0.0.1:5500/Home.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    
    // Step 2: Fill in credentials
    console.log('2. Filling in credentials...');
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    
    // Step 3: Submit login
    console.log('3. Submitting login form...');
    await page.click('button:has-text("Sign In")');
    
    // Step 4: Wait and observe
    console.log('4. Waiting for authentication and redirect...');
    await page.waitForTimeout(8000);
    
    // Step 5: Check final state
    const finalUrl = page.url();
    console.log(`\n5. Final URL: ${finalUrl}`);
    
    if (finalUrl.includes('staff.html')) {
      console.log('✅ SUCCESS: Redirected to staff.html');
      
      // Check if staff page loaded without errors
      const bodyVisible = await page.locator('body').isVisible();
      console.log(`   Staff page body visible: ${bodyVisible}`);
      
      // Check for any error messages
      const errorElements = await page.locator('.error, [role="alert"]').count();
      console.log(`   Error elements found: ${errorElements}`);
      
      // Take screenshot of staff page
      await page.screenshot({ path: 'staff_page_loaded.png' });
      console.log('   Screenshot saved as staff_page_loaded.png');
      
    } else if (finalUrl.includes('Home.html')) {
      console.log('❌ FAILED: Still on Home.html');
      
      // Check for error messages
      const authError = await page.locator('#auth-error').isVisible();
      if (authError) {
        const errorText = await page.locator('#auth-error').textContent();
        console.log(`   Error message: ${errorText}`);
      }
      
      // Check if there's a redirect parameter (indicating it came back from staff.html)
      if (finalUrl.includes('?_=')) {
        console.log('   ⚠️ Detected redirect back from staff.html (authentication issue)');
      }
      
      // Take screenshot
      await page.screenshot({ path: 'login_failed.png' });
      console.log('   Screenshot saved as login_failed.png');
      
    } else {
      console.log(`⚠️ UNEXPECTED: Redirected to ${finalUrl}`);
      await page.screenshot({ path: 'unexpected_redirect.png' });
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testCompleteLogin();