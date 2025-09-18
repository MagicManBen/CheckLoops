import { chromium } from 'playwright';

async function testCompleteFlow() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 TESTING COMPLETE FLOW: homepage → home → staff');
    
    // Step 1: Start at homepage.html
    console.log('📍 Step 1: Navigate to homepage.html');
    await page.goto('http://127.0.0.1:5500/homepage.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    console.log('✅ On homepage.html');
    
    // Step 2: Click the "Sign In" button in navigation
    console.log('📍 Step 2: Click "Sign In" button to go to login page');
    
    // Look specifically for the Sign In button in the header
    await page.click('button:has-text("Sign In"):visible');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const loginUrl = page.url();
    console.log('After clicking Sign In, URL is:', loginUrl);
    
    if (loginUrl.includes('home.html')) {
      console.log('✅ Successfully navigated to home.html login page');
    } else {
      console.log('❌ Not on home.html - unexpected redirect');
    }
    
    // Step 3: Fill in login credentials
    console.log('📍 Step 3: Login with benhowardmagic@hotmail.com');
    
    // Wait for form elements to be available
    await page.waitForSelector('#email');
    await page.waitForSelector('#password');
    
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('#password', 'Hello1!');
    
    console.log('Credentials filled, submitting form...');
    
    // Submit the form
    await page.click('button[type="submit"]:has-text("Sign In")');
    
    // Wait for redirect
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Give enough time for redirect
    
    const afterLoginUrl = page.url();
    console.log('After login, URL is:', afterLoginUrl);
    
    if (afterLoginUrl.includes('staff.html')) {
      console.log('✅ Successfully redirected to staff.html');
      await page.screenshot({ path: 'staff-home-login-success.png' });
    } else {
      console.log('❌ Not redirected to staff.html');
      await page.screenshot({ path: 'staff-home-login-failed.png' });
      return;
    }
    
    // Step 4: Verify user details are visible
    console.log('📍 Step 4: Checking user details on staff page');
    
    // Look for the email in the page
    const emailVisible = await page.getByText('benhowardmagic@hotmail.com').isVisible().catch(() => false);
    const userInfoVisible = await page.getByText('Ben', { exact: false }).isVisible().catch(() => false);
    
    console.log('Email visible:', emailVisible);
    console.log('User info visible:', userInfoVisible);
    
    // Step 5: Test staff menu navigation
    console.log('📍 Step 5: Testing staff menu navigation');
    
    const menuItems = [
      { name: 'Welcome', url: 'staff-welcome.html' },
      { name: 'Meetings', url: 'staff-meetings.html' },
      { name: 'My Scans', url: 'staff-scans.html' },
      { name: 'My Training', url: 'staff-training.html' },
      { name: 'Quiz', url: 'staff-quiz.html' },
      { name: 'Home', url: 'staff.html' }
    ];
    
    for (let i = 0; i < menuItems.length; i++) {
      const item = menuItems[i];
      try {
        console.log(`  → Testing ${item.name} navigation`);
        
        // Click the menu button
        const menuButton = page.locator(`button:has-text("${item.name}")`).first();
        await menuButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        const currentUrl = page.url();
        
        if (currentUrl.includes(item.url)) {
          console.log(`  ✅ Successfully navigated to ${item.name}`);
          await page.screenshot({ path: `staff-page-${i+1}-${item.name.toLowerCase().replace(' ', '-')}.png` });
        } else {
          console.log(`  ⚠️  ${item.name}: Expected ${item.url}, got ${currentUrl}`);
        }
        
      } catch (error) {
        console.log(`  ❌ Failed to navigate to ${item.name}: ${error.message}`);
      }
    }
    
    // Step 6: Final verification - return to staff home and check admin button
    console.log('📍 Step 6: Final verification on staff home');
    await page.goto('http://127.0.0.1:5500/staff.html');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check for admin button (should be visible for benhowardmagic@hotmail.com)
    const adminButtonVisible = await page.locator('button:has-text("Admin Site")').isVisible().catch(() => false);
    console.log('Admin Site button visible:', adminButtonVisible);
    
    // Take final screenshot
    await page.screenshot({ path: 'staff-final-verification.png' });
    
    console.log('🎉 Complete flow test finished!');
    console.log('📸 Screenshots saved to project directory');
    
  } catch (error) {
    console.error('❌ Flow test failed:', error.message);
    await page.screenshot({ path: 'flow-test-error.png' });
  } finally {
    await browser.close();
  }
}

testCompleteFlow().catch(console.error);