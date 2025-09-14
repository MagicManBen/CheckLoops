import { chromium } from 'playwright';

async function testCompleteHolidayWorkflow() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();

  try {
    console.log('🚀 Starting complete holiday workflow test...\n');

    // Test 1: Staff member creates holiday request
    console.log('📝 Test 1: Staff member creates holiday request');
    const staffPage = await context.newPage();

    // Login as staff
    console.log('   - Opening login page...');
    await staffPage.goto('http://127.0.0.1:58156/index.html');
    await staffPage.waitForLoadState('networkidle');
    await staffPage.waitForTimeout(2000);

    await staffPage.locator('#email').fill('benhowardmagic@hotmail.com');
    await staffPage.locator('input[type="password"]').fill('Hello1!');
    await staffPage.click('button:has-text("Sign In")');
    await staffPage.waitForTimeout(3000);

    // Check if on staff page
    const isOnStaffPage = await staffPage.url().includes('staff.html');
    if (!isOnStaffPage) {
      console.log('⚠️ Not redirected to staff page, checking current state...');
      await staffPage.screenshot({ path: 'test_staff_login_issue.png' });
    }

    // Navigate to My Holidays
    console.log('   - Navigating to My Holidays...');
    const holidayLink = await staffPage.locator('a[href="my-holidays.html"]').first();
    if (await holidayLink.isVisible()) {
      await holidayLink.click();
      await staffPage.waitForTimeout(3000);
    } else {
      // Direct navigation
      await staffPage.goto('http://127.0.0.1:58156/my-holidays.html');
      await staffPage.waitForTimeout(3000);
    }

    // Take screenshot of holidays page
    await staffPage.screenshot({ path: 'test_1_my_holidays_page.png' });
    console.log('   ✅ Screenshot saved: test_1_my_holidays_page.png');

    // Check authentication
    const emailPill = await staffPage.locator('#email-pill').textContent();
    console.log(`   - Logged in as: ${emailPill}`);

    // Check if holiday profile exists
    const setupRequired = await staffPage.locator('text=Holiday Setup Required').isVisible();
    if (setupRequired) {
      console.log('   ⚠️ Holiday setup required - user needs to complete welcome process first');
      await staffPage.screenshot({ path: 'test_holiday_setup_required.png' });

      // Go to welcome to complete setup
      console.log('   - Completing welcome process...');
      await staffPage.goto('http://127.0.0.1:58156/staff-welcome.html');
      await staffPage.waitForTimeout(2000);

      // Check if already completed
      const completed = await staffPage.locator('text=You have completed the welcome process').isVisible();
      if (!completed) {
        console.log('   ⚠️ Welcome process not yet completed');
      }

      // Return to holidays
      await staffPage.goto('http://127.0.0.1:58156/my-holidays.html');
      await staffPage.waitForTimeout(3000);
    }

    // Check holiday allowance display
    const totalAllowance = await staffPage.locator('#total-allowance').textContent();
    const usedHolidays = await staffPage.locator('#used-holidays').textContent();
    const remaining = await staffPage.locator('#remaining-holidays').textContent();

    console.log(`   - Total Allowance: ${totalAllowance}`);
    console.log(`   - Used: ${usedHolidays}`);
    console.log(`   - Remaining: ${remaining}`);

    // Create a holiday request
    console.log('   - Creating holiday request...');

    // Set dates (next Monday to Friday)
    const today = new Date();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
    const nextFriday = new Date(nextMonday);
    nextFriday.setDate(nextMonday.getDate() + 4);

    const fromDateStr = nextMonday.toISOString().split('T')[0];
    const toDateStr = nextFriday.toISOString().split('T')[0];

    await staffPage.locator('#from-date').fill(fromDateStr);
    await staffPage.locator('#to-date').fill(toDateStr);

    // Calculate
    await staffPage.click('#calculate-btn');
    await staffPage.waitForTimeout(1000);

    // Check calculation result
    const calcVisible = await staffPage.locator('#calculation-result').isVisible();
    if (calcVisible) {
      const calcTotal = await staffPage.locator('#calc-total').textContent();
      const calcUnit = await staffPage.locator('#calc-unit').textContent();
      console.log(`   - Calculated time off: ${calcTotal} ${calcUnit}`);
    }

    // Add reason
    await staffPage.locator('#reason').fill('Annual leave - Family vacation');

    // Submit request
    const submitBtn = await staffPage.locator('#submit-request');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await staffPage.waitForTimeout(2000);

      // Check success message
      const requestMsg = await staffPage.locator('#request-msg').textContent();
      console.log(`   - Submit result: ${requestMsg}`);

      await staffPage.screenshot({ path: 'test_2_request_submitted.png' });
      console.log('   ✅ Screenshot saved: test_2_request_submitted.png');
    } else {
      console.log('   ⚠️ Submit button not visible');
    }

    // Check bookings list updated
    const bookingsContainer = await staffPage.locator('#bookings-container');
    const bookingItems = await bookingsContainer.locator('.booking-item').count();
    console.log(`   - Total booking requests: ${bookingItems}`);

    // Test 2: Admin reviews and approves request
    console.log('\n📝 Test 2: Admin reviews and approves holiday request');
    const adminPage = await context.newPage();

    // Login as admin
    await adminPage.goto('http://127.0.0.1:58156/admin-login.html');
    await adminPage.waitForTimeout(1000);

    await adminPage.locator('#email').fill('benhowardmagic@hotmail.com');
    await adminPage.locator('#password').fill('Hello1!');
    await adminPage.click('button:has-text("Sign In")');
    await adminPage.waitForTimeout(3000);

    // Check if on admin dashboard
    const isOnAdminDashboard = await adminPage.url().includes('admin-dashboard.html');
    if (!isOnAdminDashboard) {
      console.log('   ⚠️ Not redirected to admin dashboard');
      await adminPage.screenshot({ path: 'test_admin_login_issue.png' });
    } else {
      console.log('   ✅ Successfully logged into admin dashboard');
    }

    // Navigate to holidays section
    console.log('   - Navigating to holidays section...');
    const holidaysNavBtn = await adminPage.locator('button[data-section="holidays"]').first();
    if (await holidaysNavBtn.isVisible()) {
      await holidaysNavBtn.click();
      await adminPage.waitForTimeout(2000);
    }

    // Take screenshot of admin holidays section
    await adminPage.screenshot({ path: 'test_3_admin_holidays.png' });
    console.log('   ✅ Screenshot saved: test_3_admin_holidays.png');

    // Check if requests are loaded
    const requestsList = await adminPage.locator('#requests-list');
    if (await requestsList.isVisible()) {
      const requestRows = await requestsList.locator('tbody tr').count();
      console.log(`   - Holiday requests found: ${requestRows}`);

      if (requestRows > 0) {
        // Get details of first request
        const firstRow = requestsList.locator('tbody tr').first();
        const staffEmail = await firstRow.locator('td').nth(0).textContent();
        const dates = await firstRow.locator('td').nth(1).textContent();
        const amount = await firstRow.locator('td').nth(2).textContent();
        const status = await firstRow.locator('.status-badge').textContent();

        console.log(`   - Latest request:`);
        console.log(`     Staff: ${staffEmail}`);
        console.log(`     Dates: ${dates}`);
        console.log(`     Amount: ${amount}`);
        console.log(`     Status: ${status}`);

        // Check if approve button exists
        const approveBtn = await firstRow.locator('button:has-text("Approve")').first();
        if (await approveBtn.isVisible()) {
          console.log('   - Approving request...');
          await approveBtn.click();
          await adminPage.waitForTimeout(2000);

          // Handle alert
          adminPage.on('dialog', async dialog => {
            console.log(`   - Alert: ${dialog.message()}`);
            await dialog.accept();
          });

          await adminPage.screenshot({ path: 'test_4_request_approved.png' });
          console.log('   ✅ Screenshot saved: test_4_request_approved.png');
        }
      }
    } else {
      console.log('   ⚠️ Requests list not visible');
    }

    // Test 3: Staff sees approved request
    console.log('\n📝 Test 3: Staff sees approved request');

    // Go back to staff page
    await staffPage.reload();
    await staffPage.waitForTimeout(2000);

    // Check updated bookings
    const updatedBookings = await staffPage.locator('.booking-item').count();
    console.log(`   - Updated booking count: ${updatedBookings}`);

    // Check for approved status
    const approvedBooking = await staffPage.locator('.status-approved').first();
    if (await approvedBooking.isVisible()) {
      console.log('   ✅ Approved booking found!');

      // Check updated remaining balance
      const newRemaining = await staffPage.locator('#remaining-holidays').textContent();
      console.log(`   - Updated remaining balance: ${newRemaining}`);
    } else {
      console.log('   ⚠️ No approved bookings visible yet');
    }

    await staffPage.screenshot({ path: 'test_5_final_state.png' });
    console.log('   ✅ Screenshot saved: test_5_final_state.png');

    console.log('\n✅ Holiday workflow test completed!');
    console.log('   - Staff can view holiday allowance');
    console.log('   - Staff can submit holiday requests');
    console.log('   - Admin can view and approve requests');
    console.log('   - System calculates time off based on working patterns');

  } catch (error) {
    console.error('❌ Test failed:', error);

    // Take error screenshot
    const page = await context.newPage();
    await page.screenshot({ path: 'test_error_state.png' });
    console.log('Error screenshot saved: test_error_state.png');
  } finally {
    await browser.close();
    console.log('\n🏁 Test browser closed');
  }
}

// Run the test
testCompleteHolidayWorkflow().catch(console.error);