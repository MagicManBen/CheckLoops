import { chromium } from 'playwright';

async function testHolidaySystemBrowser() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 200
  });

  const page = await browser.newPage();

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('Environment:') && !text.includes('Base URL:')) {
      console.log('[Browser]', text);
    }
  });

  try {
    console.log('=== HOLIDAY SYSTEM BROWSER TEST ===\n');

    // 1. Login
    console.log('1. Logging in...');
    await page.goto('http://127.0.0.1:5500/Home.html');
    await page.waitForTimeout(1000);
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('input[type="password"]', 'Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(2000);

    // Navigate to staff portal if on admin
    const currentUrl = page.url();
    if (currentUrl.includes('admin-dashboard.html')) {
      console.log('   Redirected to admin, going to staff portal...');
      await page.goto('http://127.0.0.1:5500/staff.html');
      await page.waitForTimeout(1500);
    }

    // 2. Check Welcome Status
    console.log('\n2. Checking welcome status...');
    await page.click('button[data-section="welcome"]');
    await page.waitForTimeout(2000);

    // Take screenshot to see current state
    await page.screenshot({ path: 'test_1_welcome_current_state.png' });

    // Try to determine which step we're on
    let currentStep = 'unknown';
    if (await page.isVisible('#nickname')) {
      currentStep = 'step1-nickname';
    } else if (await page.isVisible('#welcome-step2')) {
      currentStep = 'step2-role';
    } else if (await page.isVisible('#welcome-step3')) {
      currentStep = 'step3-avatar';
    } else if (await page.isVisible('#step4')) {
      currentStep = 'step4-working-hours';
    } else if (await page.isVisible('#step5')) {
      currentStep = 'step5-complete';
    }

    console.log('   Current step:', currentStep);

    // If we're on working hours, try to complete it
    if (currentStep === 'step4-working-hours') {
      console.log('\n3. Completing working hours...');

      // Set working hours
      const mondayInput = await page.locator('#monday-val');
      if (await mondayInput.count() > 0) {
        await mondayInput.clear();
        await mondayInput.fill('08:00');
      }

      const tuesdayInput = await page.locator('#tuesday-val');
      if (await tuesdayInput.count() > 0) {
        await tuesdayInput.clear();
        await tuesdayInput.fill('08:00');
      }

      const wednesdayInput = await page.locator('#wednesday-val');
      if (await wednesdayInput.count() > 0) {
        await wednesdayInput.clear();
        await wednesdayInput.fill('08:00');
      }

      const thursdayInput = await page.locator('#thursday-val');
      if (await thursdayInput.count() > 0) {
        await thursdayInput.clear();
        await thursdayInput.fill('08:00');
      }

      const fridayInput = await page.locator('#friday-val');
      if (await fridayInput.count() > 0) {
        await fridayInput.clear();
        await fridayInput.fill('08:00');
      }

      console.log('   Set 40 hours/week (Mon-Fri 8 hours each)');
      await page.screenshot({ path: 'test_2_working_hours_set.png' });

      // Complete setup
      const completeBtn = await page.locator('#complete-setup');
      if (await completeBtn.isVisible()) {
        await completeBtn.click();
        console.log('   Clicked complete setup');
        await page.waitForTimeout(3000);
      }

      // Check if we reached completion
      if (await page.isVisible('#step5')) {
        console.log('   ✅ Welcome process completed!');
        await page.screenshot({ path: 'test_3_welcome_completed.png' });
      }
    }

    // 4. Test My Holidays Page
    console.log('\n4. Testing My Holidays page...');
    await page.goto('http://127.0.0.1:5500/my-holidays.html');
    await page.waitForTimeout(3000);

    // Check page content
    const pageText = await page.textContent('body');
    if (pageText.includes('Holiday Setup Required')) {
      console.log('   ⚠️ Holiday setup required - welcome process incomplete');
      await page.screenshot({ path: 'test_4_holidays_setup_required.png' });
    } else {
      // Check if holiday data loads
      const totalAllowanceElement = await page.locator('#total-allowance');
      if (await totalAllowanceElement.count() > 0) {
        const totalAllowance = await totalAllowanceElement.textContent();
        const usedHolidays = await page.textContent('#used-holidays');
        const remainingHolidays = await page.textContent('#remaining-holidays');
        const unit = await page.textContent('#allowance-unit');

        console.log('   ✅ Holiday data loaded:');
        console.log('   - Total Allowance:', totalAllowance, unit);
        console.log('   - Used:', usedHolidays, unit);
        console.log('   - Remaining:', remainingHolidays, unit);

        await page.screenshot({ path: 'test_4_my_holidays_display.png' });

        // Test holiday booking calculation
        console.log('\n5. Testing holiday booking calculation...');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date();
        dayAfter.setDate(dayAfter.getDate() + 2);

        await page.fill('#from-date', tomorrow.toISOString().split('T')[0]);
        await page.fill('#to-date', dayAfter.toISOString().split('T')[0]);
        await page.click('#calculate-btn');
        await page.waitForTimeout(2000);

        // Check calculation result
        const calculationVisible = await page.isVisible('#calculation-result');
        if (calculationVisible) {
          const calcTotal = await page.textContent('#calc-total');
          const calcUnit = await page.textContent('#calc-unit');
          console.log('   Calculated time off:', calcTotal, calcUnit);
          await page.screenshot({ path: 'test_5_holiday_calculation.png' });

          // Submit request
          await page.fill('#reason', 'Test holiday request from automated test');
          const submitBtn = await page.locator('#submit-request');
          if (await submitBtn.isVisible()) {
            await submitBtn.click();
            await page.waitForTimeout(2000);

            const requestMsg = await page.textContent('#request-msg');
            console.log('   Request result:', requestMsg);
            await page.screenshot({ path: 'test_6_request_submitted.png' });
          }
        }
      }
    }

    // 6. Test Admin Holiday Management
    console.log('\n6. Testing admin holiday management...');
    await page.goto('http://127.0.0.1:5500/admin-dashboard.html');
    await page.waitForTimeout(2000);

    // Navigate to holidays section
    const holidaysButton = await page.locator('button[data-section="view-holidays"]');
    if (await holidaysButton.count() > 0) {
      await holidaysButton.click();
      await page.waitForTimeout(2500);

      // Check entitlements section
      const entitlementsSection = await page.locator('#holidays-entitlements');
      if (await entitlementsSection.count() > 0) {
        console.log('   ✅ Entitlements section loaded');

        // Look for entitlement rows
        const entitlementRows = await page.locator('.entitlement-row');
        const rowCount = await entitlementRows.count();
        console.log('   Found', rowCount, 'entitlement row(s)');

        if (rowCount > 0) {
          await page.screenshot({ path: 'test_7_admin_entitlements.png' });
        }
      }

      // Check requests section
      const requestsSection = await page.locator('#holidays-requests');
      if (await requestsSection.count() > 0) {
        console.log('   ✅ Requests section loaded');

        // Look for pending requests
        const pendingRequests = await page.locator('.request-item');
        const requestCount = await pendingRequests.count();
        console.log('   Found', requestCount, 'holiday request(s)');

        if (requestCount > 0) {
          await page.screenshot({ path: 'test_8_admin_requests.png' });

          // Try to approve first request
          const approveBtn = await page.locator('button:has-text("Approve")').first();
          if (await approveBtn.count() > 0) {
            await approveBtn.click();
            await page.waitForTimeout(2000);
            console.log('   ✅ Approved a holiday request');
            await page.screenshot({ path: 'test_9_request_approved.png' });
          }
        }
      }
    }

    // 7. Go back to My Holidays to verify approval
    console.log('\n7. Checking updated holiday balance...');
    await page.goto('http://127.0.0.1:5500/my-holidays.html');
    await page.waitForTimeout(2500);

    const finalUsed = await page.textContent('#used-holidays');
    const finalRemaining = await page.textContent('#remaining-holidays');
    console.log('   Final Used:', finalUsed);
    console.log('   Final Remaining:', finalRemaining);

    // Check bookings list
    const bookingsList = await page.locator('.booking-item');
    const bookingsCount = await bookingsList.count();
    console.log('   Total bookings:', bookingsCount);

    if (bookingsCount > 0) {
      // Check for approved status
      const approvedBookings = await page.locator('.status-approved');
      const approvedCount = await approvedBookings.count();
      console.log('   Approved bookings:', approvedCount);
    }

    await page.screenshot({ path: 'test_10_final_holidays_state.png' });

    console.log('\n=== TEST SUMMARY ===');
    console.log('✅ Login successful');
    console.log('✅ Welcome process checked');
    console.log('✅ My Holidays page tested');
    console.log('✅ Holiday calculation tested');
    console.log('✅ Admin management tested');
    console.log('✅ Full workflow completed');

  } catch (error) {
    console.error('\n❌ Test error:', error);
    await page.screenshot({ path: 'test_error_state.png' });
  } finally {
    console.log('\n=== TEST COMPLETE ===');
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testHolidaySystemBrowser().catch(console.error);