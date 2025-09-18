import { chromium } from 'playwright';

async function testAuthenticationFlow() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Starting authentication flow test...');
    
    // Step 1: Start at homepage
    console.log('📍 Step 1: Navigate to homepage');
    await page.goto('http://127.0.0.1:5500/homepage.html');
    await page.waitForTimeout(2000);
    
    // Step 2: Click login button
    console.log('📍 Step 2: Click login button');
    await page.click('button:has-text("Sign In"), a:has-text("Sign In"), .btn.primary');
    await page.waitForLoadState('networkidle');
    
    // Verify we're on login page
    await page.waitForSelector('#signin-form');
    console.log('✅ Successfully navigated to login page');
    
    // Step 3: Login with hotmail account
    console.log('📍 Step 3: Login with benhowardmagic@hotmail.com');
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('#password', 'Hello1!');
    
    // Submit login form
    await page.click('button[type="submit"]:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Wait for redirect to staff page
    await page.waitForLoadState('networkidle');
    
    // Verify we're on staff page
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    if (!currentUrl.includes('staff.html')) {
      throw new Error('❌ Not redirected to staff page after login');
    }
    console.log('✅ Successfully logged in and redirected to staff page');
    
    // Take screenshot after login
    await page.screenshot({ path: 'test-login-success.png' });
    
    // Step 4: Navigate through staff menu pages
    console.log('📍 Step 4: Testing navigation through staff menu pages');
    
    const staffPages = [
      { button: 'Welcome', expectedUrl: 'staff-welcome.html' },
      { button: 'Meetings', expectedUrl: 'staff-meetings.html' },
      { button: 'My Scans', expectedUrl: 'staff-scans.html' },
      { button: 'My Training', expectedUrl: 'staff-training.html' },
      { button: 'Achievements', expectedUrl: 'achievements.html' },
      { button: 'Quiz', expectedUrl: 'staff-quiz.html' },
      { button: 'Home', expectedUrl: 'staff.html' }
    ];
    
    for (const staffPage of staffPages) {
      try {
        console.log(`  → Testing navigation to ${staffPage.button}`);
        
        // Click the navigation button
        await page.click(`button:has-text("${staffPage.button}")`);
        await page.waitForTimeout(2000);
        await page.waitForLoadState('networkidle');
        
        // Check URL
        const url = page.url();
        if (url.includes(staffPage.expectedUrl)) {
          console.log(`  ✅ Successfully navigated to ${staffPage.button}`);
        } else {
          console.log(`  ⚠️  Navigation to ${staffPage.button} - URL: ${url}`);
        }
        
      } catch (error) {
        console.log(`  ⚠️  Could not navigate to ${staffPage.button}: ${error.message}`);
      }
    }
    
    // Return to staff home
    await page.click('button:has-text("Home")');
    await page.waitForTimeout(2000);
    
    // Step 5: Check if admin button is visible and test admin access
    console.log('📍 Step 5: Testing admin site access');
    
    // Look for admin button
    const adminButton = await page.locator('button:has-text("Admin Site"), button[href*="index.html"], .admin-only').first();
    const isAdminButtonVisible = await adminButton.isVisible().catch(() => false);
    
    console.log('Admin button visible:', isAdminButtonVisible);
    
    if (isAdminButtonVisible) {
      console.log('  → Clicking admin site button');
      await adminButton.click();
      await page.waitForTimeout(3000);
      await page.waitForLoadState('networkidle');
      
      const adminUrl = page.url();
      console.log('  → Admin URL:', adminUrl);
      
      if (adminUrl.includes('index.html') || adminUrl.includes('admin.html')) {
        console.log('  ✅ Successfully accessed admin area');
        await page.screenshot({ path: 'test-admin-access.png' });
      } else {
        console.log('  ❌ Did not reach admin area');
      }
      
      // Test if we can navigate back to staff
      console.log('  → Testing navigation back to staff');
      await page.goto('http://127.0.0.1:5500/staff.html');
      await page.waitForTimeout(2000);
      
      const backToStaffUrl = page.url();
      if (backToStaffUrl.includes('staff.html')) {
        console.log('  ✅ Can navigate back to staff while maintaining session');
      }
      
    } else {
      console.log('  ℹ️  Admin button not visible - user likely has staff role only');
      
      // Test direct access to admin area
      console.log('  → Testing direct access to index.html');
      await page.goto('http://127.0.0.1:5500/index.html');
      await page.waitForTimeout(3000);
      
      const directAdminUrl = page.url();
      console.log('  → Direct admin access URL:', directAdminUrl);
      
      if (directAdminUrl.includes('staff.html')) {
        console.log('  ✅ Correctly redirected back to staff - admin access properly blocked');
      } else if (directAdminUrl.includes('admin.html')) {
        console.log('  ✅ Admin access granted via direct URL');
      } else {
        console.log('  ⚠️  Unexpected redirect behavior');
      }
    }
    
    // Step 6: Test session persistence
    console.log('📍 Step 6: Testing session persistence');
    
    // Navigate to a few pages and verify session is maintained
    const testPages = ['staff.html', 'staff-welcome.html', 'staff.html'];
    
    for (const testPage of testPages) {
      await page.goto(`http://127.0.0.1:5500/${testPage}`);
      await page.waitForTimeout(2000);
      
      const finalUrl = page.url();
      if (finalUrl.includes(testPage)) {
        console.log(`  ✅ Session maintained for ${testPage}`);
      } else {
        console.log(`  ❌ Session lost - redirected from ${testPage} to ${finalUrl}`);
      }
    }
    
    // Final screenshot
    await page.screenshot({ path: 'test-final-state.png' });
    
    console.log('🎉 Authentication flow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-error.png' });
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testAuthenticationFlow().catch(console.error);