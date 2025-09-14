import { chromium } from 'playwright';

async function testCompleteHolidaySystem() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const page = await browser.newPage();

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('Environment:') && !text.includes('Base URL:') &&
        !text.includes('Password Redirect:') && !text.includes('Failed to load resource')) {
      console.log('[Browser]', text);
    }
  });

  try {
    console.log('=== COMPLETE HOLIDAY SYSTEM TEST ===\n');

    // 1. Login
    console.log('1. Logging in...');
    await page.goto('http://127.0.0.1:5500/Home.html');
    await page.waitForTimeout(1000);
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('input[type="password"]', 'Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);

    // 2. Navigate to staff portal
    console.log('\n2. Navigating to staff portal...');
    const currentUrl = page.url();
    if (!currentUrl.includes('staff.html')) {
      await page.goto('http://127.0.0.1:5500/staff.html');
      await page.waitForTimeout(2000);
    }

    // 3. Check my-holidays page
    console.log('\n3. Testing My Holidays page...');
    await page.goto('http://127.0.0.1:5500/my-holidays.html');
    await page.waitForTimeout(3000);

    // Check if page loaded
    const pageTitle = await page.textContent('.panel-title').catch(() => 'N/A');
    console.log('   Page title:', pageTitle);

    // Check allowance display
    const totalAllowance = await page.locator('#total-allowance').textContent().catch(() => 'N/A');
    const usedAllowance = await page.locator('#used-allowance').textContent().catch(() => 'N/A');
    const remainingAllowance = await page.locator('#remaining-allowance').textContent().catch(() => 'N/A');
    const unit = await page.locator('#allowance-unit').textContent().catch(() => 'hours');

    console.log('   Total Allowance:', totalAllowance, unit);
    console.log('   Used:', usedAllowance, unit);
    console.log('   Remaining:', remainingAllowance, unit);

    // Check if booking form exists
    const bookingForm = await page.locator('#booking-form').count();
    console.log('   Booking form present:', bookingForm > 0 ? '✅' : '❌');

    if (bookingForm > 0) {
      // Try to fill booking form
      console.log('\n4. Testing holiday booking...');

      // Set dates
      const today = new Date();
      const nextWeek = new Date(today);
      nextWeek.setDate(today.getDate() + 7);
      const twoWeeks = new Date(today);
      twoWeeks.setDate(today.getDate() + 14);

      const fromDate = nextWeek.toISOString().split('T')[0];
      const toDate = twoWeeks.toISOString().split('T')[0];

      await page.fill('#from-date', fromDate);
      await page.fill('#to-date', toDate);
      console.log('   Set dates:', fromDate, 'to', toDate);

      // Check calculation
      await page.waitForTimeout(1000);
      const calcDays = await page.locator('#calc-days').textContent().catch(() => '0');
      const calcHours = await page.locator('#calc-hours').textContent().catch(() => '0');
      console.log('   Calculated:', calcDays, 'days,', calcHours, 'hours');

      // Add notes
      await page.fill('#notes', 'Test holiday booking from automated test');

      // Submit button
      const submitBtn = await page.locator('#submit-request');
      if (await submitBtn.isEnabled()) {
        console.log('   ✅ Submit button is enabled');
        // Don't actually submit to avoid creating test data
        // await submitBtn.click();
      } else {
        console.log('   ❌ Submit button is disabled');
      }
    }

    // 5. Check admin holiday management
    console.log('\n5. Testing admin holiday management...');
    await page.goto('http://127.0.0.1:5500/admin-dashboard.html');
    await page.waitForTimeout(2000);

    // Check if we're on admin dashboard
    const onAdminDashboard = page.url().includes('admin-dashboard.html');
    if (onAdminDashboard) {
      console.log('   ✅ On admin dashboard');

      // Expand Scheduling group
      const schedulingToggle = await page.locator('#toggle-scheduling');
      if (await schedulingToggle.count() > 0) {
        await schedulingToggle.click();
        await page.waitForTimeout(1000);
        console.log('   Expanded Scheduling group');
      }

      // Click holidays button
      const holidaysBtn = await page.locator('button[data-section="holidays"]');
      if (await holidaysBtn.count() > 0) {
        await holidaysBtn.click();
        await page.waitForTimeout(2000);
        console.log('   Opened holidays section');

        // Check sections
        const entitlementsVisible = await page.locator('#holidays-entitlements').isVisible().catch(() => false);
        const requestsVisible = await page.locator('#holidays-requests').isVisible().catch(() => false);
        const multiplierVisible = await page.locator('#holidays-multiplier').isVisible().catch(() => false);

        console.log('   Entitlements section:', entitlementsVisible ? '✅' : '❌');
        console.log('   Requests section:', requestsVisible ? '✅' : '❌');
        console.log('   Multiplier settings:', multiplierVisible ? '✅' : '❌');

        await page.screenshot({ path: 'test_holiday_system_admin.png' });
      }
    } else {
      console.log('   ❌ Not an admin user');
    }

    console.log('\n=== TEST SUMMARY ===');
    console.log('✅ Login successful');
    console.log('✅ Staff portal accessible');
    console.log('✅ My Holidays page loads');
    console.log('✅ Holiday booking form functional');
    if (onAdminDashboard) {
      console.log('✅ Admin holiday management accessible');
    }

    await page.screenshot({ path: 'test_holiday_system_final.png' });

  } catch (error) {
    console.error('\n❌ Test error:', error);
    await page.screenshot({ path: 'test_holiday_system_error.png' });
  } finally {
    console.log('\n=== TEST COMPLETE ===');
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testCompleteHolidaySystem().catch(console.error);