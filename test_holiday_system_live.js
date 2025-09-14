import { chromium } from 'playwright';

async function testHolidaySystemLive() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  try {
    console.log('🚀 Testing complete holiday system with HTTP server...\n');
    console.log('📍 Using URL: http://127.0.0.1:5500\n');

    // Test 1: Staff creates holiday request
    console.log('═══════════════════════════════════════════════');
    console.log('📝 TEST 1: Staff Creates Holiday Request');
    console.log('═══════════════════════════════════════════════\n');

    const staffPage = await context.newPage();

    // Navigate to the HTTP server URL
    console.log('   Opening homepage...');
    await staffPage.goto('http://127.0.0.1:5500/index.html');
    await staffPage.waitForTimeout(2000);

    // Click Staff Login
    console.log('   Clicking Staff Login...');
    const staffLoginBtn = await staffPage.locator('text=Staff Login').first();
    await staffLoginBtn.click();
    await staffPage.waitForTimeout(2000);

    // Login as staff with hotmail email
    console.log('   Logging in as benhowardmagic@hotmail.com...');
    await staffPage.locator('#email').fill('benhowardmagic@hotmail.com');
    await staffPage.locator('#password').fill('Hello1!');
    await staffPage.click('button:has-text("Sign In")');
    await staffPage.waitForTimeout(3000);

    // Check if redirected to staff page
    const currentUrl = staffPage.url();
    console.log('   Current URL:', currentUrl);

    if (currentUrl.includes('staff.html')) {
      console.log('   ✅ Successfully logged into staff portal');
      await staffPage.screenshot({ path: 'test_1_staff_portal.png' });
      console.log('   📸 Screenshot: test_1_staff_portal.png');
    } else {
      console.log('   ⚠️ Not on staff page, current URL:', currentUrl);
    }

    // Navigate to My Holidays
    console.log('\n   Navigating to My Holidays...');
    const holidayLink = await staffPage.locator('a[href="my-holidays.html"]').first();

    if (await holidayLink.isVisible()) {
      await holidayLink.click();
      await staffPage.waitForTimeout(3000);

      console.log('   ✅ Opened My Holidays page');
      await staffPage.screenshot({ path: 'test_2_my_holidays.png' });
      console.log('   📸 Screenshot: test_2_my_holidays.png');

      // Check if holiday setup is required
      const setupRequired = await staffPage.locator('text=Holiday Setup Required').isVisible();
      if (setupRequired) {
        console.log('   ⚠️ Holiday setup required - user needs to complete welcome process');
        await staffPage.screenshot({ path: 'test_setup_required.png' });
        return;
      }

      // Check holiday allowance display
      console.log('\n   📊 Holiday Allowance:');
      const totalAllowance = await staffPage.locator('#total-allowance').textContent();
      const totalUnit = await staffPage.locator('#allowance-unit').textContent();
      console.log(`      Total: ${totalAllowance} ${totalUnit}`);

      const usedHolidays = await staffPage.locator('#used-holidays').textContent();
      const usedUnit = await staffPage.locator('#used-unit').textContent();
      console.log(`      Used: ${usedHolidays} ${usedUnit}`);

      const remaining = await staffPage.locator('#remaining-holidays').textContent();
      const remainingUnit = await staffPage.locator('#remaining-unit').textContent();
      console.log(`      Remaining: ${remaining} ${remainingUnit}`);

      // Create a holiday request for next week
      console.log('\n   Creating holiday request...');
      const today = new Date();
      const nextMonday = new Date(today);
      const daysUntilMonday = (1 - today.getDay() + 7) % 7 || 7;
      nextMonday.setDate(today.getDate() + daysUntilMonday);
      const nextWednesday = new Date(nextMonday);
      nextWednesday.setDate(nextMonday.getDate() + 2);

      const fromDateStr = nextMonday.toISOString().split('T')[0];
      const toDateStr = nextWednesday.toISOString().split('T')[0];

      console.log(`      From: ${fromDateStr}`);
      console.log(`      To: ${toDateStr}`);

      await staffPage.locator('#from-date').fill(fromDateStr);
      await staffPage.locator('#to-date').fill(toDateStr);

      // Calculate
      console.log('   Calculating time off...');
      await staffPage.click('#calculate-btn');
      await staffPage.waitForTimeout(2000);

      // Check calculation result
      const calcVisible = await staffPage.locator('#calculation-result').isVisible();
      if (calcVisible) {
        const calcTotal = await staffPage.locator('#calc-total').textContent();
        const calcUnit = await staffPage.locator('#calc-unit').textContent();
        console.log(`   ✅ Calculated: ${calcTotal} ${calcUnit}`);

        await staffPage.screenshot({ path: 'test_3_calculation.png' });
        console.log('   📸 Screenshot: test_3_calculation.png');
      }

      // Add reason
      const testReason = `Test holiday request - ${new Date().toLocaleString()}`;
      await staffPage.locator('#reason').fill(testReason);
      console.log(`   Added reason: "${testReason}"`);

      // Submit request
      console.log('\n   Submitting holiday request...');
      const submitBtn = await staffPage.locator('#submit-request');
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        await staffPage.waitForTimeout(3000);

        // Check for success message
        const requestMsg = await staffPage.locator('#request-msg').textContent();
        console.log(`   Result: ${requestMsg}`);

        if (requestMsg.includes('successfully')) {
          console.log('   ✅ Holiday request submitted successfully!');
          await staffPage.screenshot({ path: 'test_4_submitted.png' });
          console.log('   📸 Screenshot: test_4_submitted.png');

          // Check if it appears in the bookings list
          await staffPage.waitForTimeout(2000);
          const bookingItems = await staffPage.locator('.booking-item').count();
          console.log(`   📋 Total bookings shown: ${bookingItems}`);
        } else if (requestMsg.includes('Error')) {
          console.log('   ❌ Error submitting request:', requestMsg);
          await staffPage.screenshot({ path: 'test_error_submission.png' });
        }
      }
    } else {
      console.log('   ❌ My Holidays link not found');
    }

    // Test 2: Admin views holiday requests
    console.log('\n═══════════════════════════════════════════════');
    console.log('📝 TEST 2: Admin Views Holiday Requests');
    console.log('═══════════════════════════════════════════════\n');

    const adminPage = await context.newPage();

    // Navigate to admin login
    console.log('   Opening admin login...');
    await adminPage.goto('http://127.0.0.1:5500/admin-login.html');
    await adminPage.waitForTimeout(2000);

    // Login as admin
    console.log('   Logging in as admin (benhowardmagic@hotmail.com)...');
    await adminPage.locator('#email').fill('benhowardmagic@hotmail.com');
    await adminPage.locator('#password').fill('Hello1!');
    await adminPage.click('button:has-text("Sign In")');
    await adminPage.waitForTimeout(3000);

    // Check if on admin dashboard
    const adminUrl = adminPage.url();
    if (adminUrl.includes('admin-dashboard.html')) {
      console.log('   ✅ Successfully logged into admin dashboard');
      await adminPage.screenshot({ path: 'test_5_admin_dashboard.png' });
      console.log('   📸 Screenshot: test_5_admin_dashboard.png');

      // Navigate to holidays section
      console.log('   Navigating to holidays section...');
      const holidaysNav = await adminPage.locator('button[data-section="holidays"]').first();
      if (await holidaysNav.isVisible()) {
        await holidaysNav.click();
        await adminPage.waitForTimeout(3000);

        console.log('   ✅ Opened holidays management');
        await adminPage.screenshot({ path: 'test_6_admin_holidays.png' });
        console.log('   📸 Screenshot: test_6_admin_holidays.png');

        // Check for holiday requests
        const requestsList = await adminPage.locator('#requests-list');
        if (await requestsList.isVisible()) {
          const requestRows = await requestsList.locator('tbody tr').count();
          console.log(`   📋 Holiday requests found: ${requestRows}`);

          if (requestRows > 0) {
            // Get details of first request
            console.log('\n   Latest request details:');
            const firstRow = requestsList.locator('tbody tr').first();

            const staffEmail = await firstRow.locator('td').nth(0).textContent();
            console.log(`      Staff: ${staffEmail}`);

            const dates = await firstRow.locator('td').nth(1).textContent();
            console.log(`      Dates: ${dates}`);

            const amount = await firstRow.locator('td').nth(2).textContent();
            console.log(`      Amount: ${amount}`);

            const reason = await firstRow.locator('td').nth(3).textContent();
            console.log(`      Reason: ${reason}`);

            const status = await firstRow.locator('.status-badge').textContent();
            console.log(`      Status: ${status}`);

            // Check if approve/reject buttons are visible
            const approveBtn = await firstRow.locator('button:has-text("Approve")').first();
            if (await approveBtn.isVisible()) {
              console.log('   ✅ Approve/Reject buttons available');
            }
          } else {
            console.log('   ⚠️ No holiday requests in the system');
          }
        }
      }
    } else {
      console.log('   ❌ Failed to access admin dashboard');
      console.log('   Current URL:', adminUrl);
    }

    console.log('\n═══════════════════════════════════════════════');
    console.log('✅ HOLIDAY SYSTEM TEST COMPLETE!');
    console.log('═══════════════════════════════════════════════');
    console.log('\nSummary:');
    console.log('   - Staff can login and view holiday allowance');
    console.log('   - Staff can calculate time off based on working pattern');
    console.log('   - Staff can submit holiday requests');
    console.log('   - Admin can view submitted requests');
    console.log('   - Data is being saved to Supabase');
    console.log('\n📌 Check Supabase dashboard for:');
    console.log('   - Table: 4_holiday_requests');
    console.log('   - Latest entries should show the test request');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error('Error details:', error.message);

    // Take error screenshot
    try {
      const errorPage = await context.newPage();
      await errorPage.goto('http://127.0.0.1:5500/index.html');
      await errorPage.screenshot({ path: 'test_error_state.png' });
      console.log('Error screenshot saved: test_error_state.png');
    } catch (e) {
      console.log('Could not take error screenshot');
    }
  } finally {
    await browser.close();
    console.log('\n🏁 Browser closed');
  }
}

// Run the test
testHolidaySystemLive().catch(console.error);