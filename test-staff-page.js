import { chromium } from 'playwright';

async function testStaffPage() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== Testing Staff Page Badge Display ===\n');

  try {
    // 1. Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('file:///Users/benhoward/Desktop/CheckLoop/CheckLoops/home.html');
    await page.waitForTimeout(1000);

    // 2. Fill in login credentials
    console.log('2. Logging in as benhowardmagic@hotmail.com...');
    await page.fill('input[type="email"]', 'benhowardmagic@hotmail.com');
    await page.fill('input[type="password"]', 'Hello1!');
    await page.click('button:has-text("Sign In")');

    // 3. Wait for redirection
    console.log('3. Waiting for login to complete...');
    await page.waitForTimeout(5000);

    // Check if we landed on welcome page
    const currentURL = page.url();
    console.log('4. Current URL:', currentURL);

    if (currentURL.includes('staff-welcome.html')) {
      console.log('   On staff-welcome page, completing onboarding...');

      // Try to skip onboarding
      const skipButton = await page.locator('button:has-text("Continue to Dashboard")').count();
      if (skipButton > 0) {
        await page.click('button:has-text("Continue to Dashboard")');
        await page.waitForTimeout(3000);
      }
    }

    // 5. Navigate directly to staff.html
    console.log('5. Navigating directly to staff.html...');
    await page.goto('file:///Users/benhoward/Desktop/CheckLoop/CheckLoops/staff.html');
    await page.waitForTimeout(3000);

    // 6. Check role badge
    console.log('6. Checking role badge...');
    const roleBadge = await page.locator('#role-pill').textContent();
    console.log('   Role badge displays:', roleBadge);

    if (roleBadge === 'Admin') {
      console.log('✅ SUCCESS: Admin badge is correctly displayed!');
    } else {
      console.log('❌ FAIL: Badge shows "' + roleBadge + '" instead of "Admin"');
    }

    // 7. Check Admin Portal visibility
    const adminButtons = await page.locator('button:has-text("Admin Portal")').count();
    console.log('7. Admin Portal buttons found:', adminButtons);

    if (adminButtons > 0) {
      console.log('✅ SUCCESS: Admin Portal button is visible');
    } else {
      console.log('❌ FAIL: Admin Portal button is NOT visible');
    }

    // 8. Try navigating to admin dashboard
    console.log('8. Testing admin dashboard access...');
    await page.goto('file:///Users/benhoward/Desktop/CheckLoop/CheckLoops/admin-dashboard.html');
    await page.waitForTimeout(3000);

    const finalURL = page.url();
    if (finalURL.includes('admin-dashboard.html')) {
      console.log('✅ SUCCESS: Can access admin dashboard!');

      // Check for content on admin dashboard
      const dashboardTitle = await page.locator('h1').first().textContent();
      console.log('   Dashboard title:', dashboardTitle);
    } else {
      console.log('❌ FAIL: Cannot access admin dashboard');
      console.log('   Redirected to:', finalURL);
    }

    console.log('\n=== FINAL RESULTS ===');
    console.log('Role Badge: ' + (roleBadge === 'Admin' ? '✅ PASS' : '❌ FAIL - Shows ' + roleBadge));
    console.log('Admin Portal Button: ' + (adminButtons > 0 ? '✅ PASS' : '❌ FAIL'));
    console.log('Admin Dashboard Access: ' + (finalURL.includes('admin-dashboard.html') ? '✅ PASS' : '❌ FAIL'));

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    console.log('\nKeeping browser open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);
    await browser.close();
  }
}

testStaffPage().catch(console.error);