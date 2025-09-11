import { chromium } from 'playwright';

async function testLoginAfterFix() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing login functionality after redirect loop fix...');
  
  try {
    // Navigate to Home.html
    console.log('Navigating to Home.html...');
    await page.goto('http://127.0.0.1:5500/Home.html', { waitUntil: 'networkidle' });
    
    // Wait for login form to be visible
    await page.waitForSelector('#signin-form', { timeout: 5000 });
    console.log('Login form loaded successfully');
    
    // Fill in test credentials
    console.log('Filling in test credentials...');
    await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
    await page.locator('#password').fill('Hello1!');
    
    // Take screenshot before login
    await page.screenshot({ path: 'before_login_test.png' });
    console.log('Screenshot before login saved');
    
    // Submit the form
    console.log('Submitting login form...');
    await page.click('button:has-text("Sign In")');
    
    // Wait for potential redirect (either to staff.html or staying on login with error)
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log(`Current URL after login attempt: ${currentUrl}`);
    
    // Take screenshot after login attempt
    await page.screenshot({ path: 'after_login_test.png' });
    console.log('Screenshot after login saved');
    
    // Check if we successfully redirected to staff page
    if (currentUrl.includes('staff.html')) {
      console.log('✅ SUCCESS: Login worked and redirected to staff page');
      
      // Check if staff page is loading properly
      const staffContent = await page.locator('body').isVisible();
      console.log(`Staff page content visible: ${staffContent}`);
      
    } else if (currentUrl.includes('Home.html')) {
      // Check for error messages on login page
      const errorVisible = await page.locator('#auth-error').isVisible();
      if (errorVisible) {
        const errorText = await page.locator('#auth-error').textContent();
        console.log(`❌ Login failed with error: ${errorText}`);
      } else {
        console.log('⚠️  Stayed on login page but no error message visible');
      }
    } else {
      console.log(`⚠️  Unexpected redirect to: ${currentUrl}`);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testLoginAfterFix();