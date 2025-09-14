import { chromium } from 'playwright';

async function testAdminLoginFixed() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const page = await browser.newPage();

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('admin') || text.includes('Admin') || text.includes('site invites') || text.includes('Profile role')) {
      console.log('[Browser]', text);
    }
  });

  try {
    console.log('=== ADMIN LOGIN TEST (AFTER FIX) ===\n');

    // 1. Navigate to admin login
    console.log('1. Navigating to admin login...');
    await page.goto('http://127.0.0.1:5500/admin-login.html');
    await page.waitForTimeout(2000);

    // 2. Check for any existing error messages
    const existingError = await page.locator('#error-message').textContent().catch(() => '');
    if (existingError) {
      console.log('   Existing error message:', existingError);
    }

    // 3. Fill in credentials
    console.log('\n2. Filling in admin credentials...');
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('#password', 'Hello1!');

    // 4. Submit login
    console.log('\n3. Submitting admin login...');
    await page.click('button[type="submit"]');

    // Wait for processing
    await page.waitForTimeout(5000);

    // 5. Check the current URL
    const currentUrl = page.url();
    console.log('\n4. Current URL after login:', currentUrl);

    if (currentUrl.includes('admin-dashboard.html')) {
      console.log('   ✅ SUCCESS: Redirected to admin dashboard');

      // Check if page loaded properly
      const pageTitle = await page.title();
      console.log('   Page title:', pageTitle);

      // Check for any user display
      const userName = await page.locator('#user-name').textContent().catch(() => 'Not found');
      console.log('   User name displayed:', userName);

      // Take screenshot
      await page.screenshot({ path: 'test_admin_login_success.png' });

    } else if (currentUrl.includes('admin-login.html')) {
      console.log('   ❌ STILL ON LOGIN PAGE - Check for errors');

      // Check for error messages
      const errorMessage = await page.locator('#error-message').textContent().catch(() => '');
      if (errorMessage) {
        console.log('   Error message:', errorMessage);
      }

      // Take screenshot for debugging
      await page.screenshot({ path: 'test_admin_login_error.png' });

    } else {
      console.log('   ❓ Redirected to unexpected URL:', currentUrl);
      await page.screenshot({ path: 'test_admin_login_unexpected.png' });
    }

    console.log('\n=== TEST COMPLETE ===');
    console.log('Screenshots saved:');
    console.log('  - test_admin_login_success.png (if successful)');
    console.log('  - test_admin_login_error.png (if error)');

  } catch (error) {
    console.error('\n❌ Test error:', error);
    await page.screenshot({ path: 'test_admin_login_exception.png' });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testAdminLoginFixed().catch(console.error);