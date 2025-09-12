import { chromium } from 'playwright';

async function testAdminAuthFlow() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🚀 Testing ADMIN authentication flow...');
    
    // Step 1: Start at homepage
    console.log('📍 Step 1: Navigate to homepage');
    await page.goto('http://127.0.0.1:5500/homepage.html');
    await page.waitForTimeout(2000);
    
    // Step 2: Click login button
    console.log('📍 Step 2: Click login button');
    await page.click('button:has-text("Sign In"), a:has-text("Sign In"), .btn.primary');
    await page.waitForLoadState('networkidle');
    
    // Step 3: Login with admin account (benhowardmagic@hotmail.com is admin)
    console.log('📍 Step 3: Login with admin account (benhowardmagic@hotmail.com)');
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('#password', 'Hello1!');
    
    await page.click('button[type="submit"]:has-text("Sign In")');
    await page.waitForTimeout(3000);
    
    // Should redirect to index.html -> admin.html
    await page.waitForLoadState('networkidle');
    
    // Wait a bit more for the redirect chain to complete
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    
    if (currentUrl.includes('admin.html')) {
      console.log('✅ Successfully logged in as admin and redirected to admin dashboard');
    } else if (currentUrl.includes('index.html')) {
      console.log('✅ On admin router page - waiting for redirect to admin.html');
      // Wait a bit longer for the redirect
      await page.waitForTimeout(3000);
      const finalUrl = page.url();
      console.log('Final URL:', finalUrl);
    } else {
      console.log('⚠️  Unexpected redirect URL:', currentUrl);
    }
    
    await page.screenshot({ path: 'test-admin-login.png' });
    
    // Step 4: Test navigation to staff site
    console.log('📍 Step 4: Testing admin navigation to staff site');
    
    // If we're on admin page, look for a way to navigate to staff
    if (page.url().includes('admin.html')) {
      // Look for staff navigation button or similar
      const staffButton = await page.locator('button:has-text("Staff"), [data-section="staff-site"], a:has-text("Staff")').first();
      const isStaffButtonVisible = await staffButton.isVisible().catch(() => false);
      
      if (isStaffButtonVisible) {
        console.log('  → Found staff navigation button, clicking');
        await staffButton.click();
        await page.waitForTimeout(3000);
        
        const staffUrl = page.url();
        if (staffUrl.includes('staff.html')) {
          console.log('  ✅ Successfully navigated to staff area from admin');
        }
      } else {
        // Try direct navigation
        console.log('  → Testing direct navigation to staff.html');
        await page.goto('http://127.0.0.1:5500/staff.html');
        await page.waitForTimeout(3000);
        
        if (page.url().includes('staff.html')) {
          console.log('  ✅ Admin can access staff area directly');
        }
      }
    }
    
    // Step 5: Test staff menu navigation from admin perspective
    console.log('📍 Step 5: Testing staff menu from admin perspective');
    
    // Make sure we're on staff page
    await page.goto('http://127.0.0.1:5500/staff.html');
    await page.waitForTimeout(3000);
    
    const staffPages = [
      { button: 'Welcome', expectedUrl: 'staff-welcome.html' },
      { button: 'Meetings', expectedUrl: 'staff-meetings.html' },
      { button: 'Home', expectedUrl: 'staff.html' }
    ];
    
    for (const staffPage of staffPages) {
      try {
        console.log(`  → Testing ${staffPage.button} navigation`);
        await page.click(`button:has-text("${staffPage.button}")`);
        await page.waitForTimeout(2000);
        
        const url = page.url();
        if (url.includes(staffPage.expectedUrl)) {
          console.log(`  ✅ Successfully navigated to ${staffPage.button}`);
        } else {
          console.log(`  ⚠️  Navigation issue for ${staffPage.button} - URL: ${url}`);
        }
      } catch (error) {
        console.log(`  ⚠️  Could not test ${staffPage.button}: ${error.message}`);
      }
    }
    
    // Step 6: Test admin button visibility and access
    console.log('📍 Step 6: Testing admin button visibility for admin user');
    
    await page.goto('http://127.0.0.1:5500/staff.html');
    await page.waitForTimeout(3000);
    
    const adminButton = await page.locator('button:has-text("Admin Site"), button[href*="index.html"], .admin-only').first();
    const isAdminButtonVisible = await adminButton.isVisible().catch(() => false);
    
    console.log('Admin button visible to admin user:', isAdminButtonVisible);
    
    if (isAdminButtonVisible) {
      console.log('  → Clicking admin button');
      await adminButton.click();
      await page.waitForTimeout(5000); // Wait for redirect chain
      
      const adminUrl = page.url();
      console.log('  → Admin access URL:', adminUrl);
      
      if (adminUrl.includes('admin.html') || adminUrl.includes('index.html')) {
        console.log('  ✅ Admin button successfully provides access to admin area');
        await page.screenshot({ path: 'test-admin-button-success.png' });
      }
    }
    
    // Step 7: Test session persistence across multiple navigations
    console.log('📍 Step 7: Testing session persistence');
    
    const testUrls = [
      'http://127.0.0.1:5500/staff.html',
      'http://127.0.0.1:5500/index.html',
      'http://127.0.0.1:5500/staff-welcome.html',
      'http://127.0.0.1:5500/staff.html'
    ];
    
    for (const testUrl of testUrls) {
      await page.goto(testUrl);
      await page.waitForTimeout(2000);
      
      const finalUrl = page.url();
      const expectedPage = testUrl.split('/').pop();
      
      if (finalUrl.includes(expectedPage) || (testUrl.includes('index.html') && finalUrl.includes('admin.html'))) {
        console.log(`  ✅ Session maintained for ${expectedPage}`);
      } else {
        console.log(`  ❌ Session issue - expected ${expectedPage}, got ${finalUrl}`);
      }
    }
    
    await page.screenshot({ path: 'test-admin-final.png' });
    
    console.log('🎉 Admin authentication flow test completed!');
    
  } catch (error) {
    console.error('❌ Admin test failed:', error.message);
    await page.screenshot({ path: 'test-admin-error.png' });
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testAdminAuthFlow().catch(console.error);