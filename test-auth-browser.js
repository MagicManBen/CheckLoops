import { chromium } from 'playwright';

async function testAuthentication() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== Browser Authentication Test ===\n');

  try {
    // 1. Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('file:///Users/benhoward/Desktop/CheckLoop/CheckLoops/home.html');
    await page.waitForTimeout(1000);

    // 2. Fill in login credentials
    console.log('2. Entering credentials...');
    await page.fill('input[type="email"]', 'benhowardmagic@hotmail.com');
    await page.fill('input[type="password"]', 'Hello1!');

    // 3. Click login button
    console.log('3. Clicking login button...');
    await page.click('button:has-text("Sign In")');

    // 4. Wait for navigation
    console.log('4. Waiting for navigation...');
    await page.waitForTimeout(3000);

    // 5. Check current URL
    const currentURL = page.url();
    console.log('5. Current URL:', currentURL);

    // 6. Check if we're on staff page
    if (currentURL.includes('staff.html')) {
      console.log('✅ Redirected to staff page');

      // Check for role badge
      const roleBadge = await page.locator('#role-pill').textContent();
      console.log('   Role badge displays:', roleBadge);

      if (roleBadge === 'Admin') {
        console.log('✅ Admin badge correctly displayed!');
      } else {
        console.log('❌ Badge shows:', roleBadge, 'instead of Admin');
      }

      // Check for Admin Portal button
      const adminPortalButton = await page.locator('button[data-section="admin-portal"]').count();
      if (adminPortalButton > 0) {
        console.log('✅ Admin Portal button is visible');

        // Try clicking it
        console.log('7. Clicking Admin Portal button...');
        await page.click('button[data-section="admin-portal"]');
        await page.waitForTimeout(3000);

        const finalURL = page.url();
        if (finalURL.includes('admin-dashboard.html')) {
          console.log('✅ Successfully navigated to admin dashboard!');
        } else {
          console.log('❌ Did not navigate to admin dashboard. Current URL:', finalURL);
        }
      } else {
        console.log('❌ Admin Portal button is NOT visible');
      }
    } else if (currentURL.includes('admin-dashboard.html')) {
      console.log('✅ Directly redirected to admin dashboard!');
    } else {
      console.log('❌ Unexpected redirect. Current URL:', currentURL);
    }

    console.log('\n=== Test Summary ===');
    console.log('Login successful:', currentURL !== 'file:///Users/benhoward/Desktop/CheckLoop/CheckLoops/home.html');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await page.waitForTimeout(5000); // Keep browser open for observation
    await browser.close();
  }
}

testAuthentication().catch(console.error);