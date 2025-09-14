import { chromium } from 'playwright';

async function testHolidaySubmission() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🚀 Testing Holiday Request Submission to Supabase...\n');
    console.log('📍 URL: http://127.0.0.1:5500\n');

    // Login flow
    console.log('Step 1: Logging in...');
    await page.goto('http://127.0.0.1:5500/index.html');
    await page.waitForTimeout(2000);
    await page.click('text=Staff Login');
    await page.waitForTimeout(2000);
    await page.locator('#email').fill('benhowardmagic@hotmail.com');
    await page.locator('#password').fill('Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);

    // Navigate directly to My Holidays
    console.log('Step 2: Navigating to My Holidays...');
    await page.goto('http://127.0.0.1:5500/my-holidays.html');
    await page.waitForTimeout(3000);

    // Check current state
    console.log('\n📊 Current Holiday Status:');
    const totalAllowance = await page.locator('#total-allowance').textContent();
    const totalUnit = await page.locator('#allowance-unit').textContent();
    console.log(`   Total Allowance: ${totalAllowance} ${totalUnit}`);

    const usedHolidays = await page.locator('#used-holidays').textContent();
    console.log(`   Used: ${usedHolidays}`);

    const remaining = await page.locator('#remaining-holidays').textContent();
    console.log(`   Remaining: ${remaining}`);

    // Create a test holiday request
    console.log('\n📅 Creating Holiday Request:');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(today.getDate() + 2);

    const fromDateStr = tomorrow.toISOString().split('T')[0];
    const toDateStr = dayAfter.toISOString().split('T')[0];

    console.log(`   From: ${fromDateStr}`);
    console.log(`   To: ${toDateStr}`);

    await page.locator('#from-date').fill(fromDateStr);
    await page.locator('#to-date').fill(toDateStr);

    // Calculate
    console.log('\nStep 3: Calculating time off...');
    await page.click('#calculate-btn');
    await page.waitForTimeout(2000);

    // Check calculation result
    const calcResult = await page.locator('#calculation-result');
    if (await calcResult.isVisible()) {
      const calcTotal = await page.locator('#calc-total').textContent();
      const calcUnit = await page.locator('#calc-unit').textContent();
      console.log(`   ✅ Calculated: ${calcTotal} ${calcUnit}`);

      await page.screenshot({ path: 'submission_1_calculated.png' });
      console.log('   📸 Screenshot: submission_1_calculated.png');
    } else {
      console.log('   ⚠️ Calculation result not visible');
    }

    // Add reason
    const uniqueId = Date.now();
    const testReason = `Test submission ${uniqueId} - ${new Date().toLocaleString()}`;
    await page.locator('#reason').fill(testReason);
    console.log(`   Reason: "${testReason}"`);

    // Submit request
    console.log('\nStep 4: Submitting holiday request...');
    const submitBtn = await page.locator('#submit-request');
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(3000);

      // Check for response
      const requestMsg = await page.locator('#request-msg').textContent();
      console.log(`   Response: ${requestMsg}`);

      if (requestMsg.includes('successfully')) {
        console.log('   ✅ Request submitted successfully!');
        await page.screenshot({ path: 'submission_2_success.png' });
        console.log('   📸 Screenshot: submission_2_success.png');

        // Wait for bookings list to update
        await page.waitForTimeout(2000);

        // Check bookings list
        const bookingItems = await page.locator('.booking-item').count();
        console.log(`   📋 Total bookings in list: ${bookingItems}`);

        if (bookingItems > 0) {
          // Check if our test reason appears
          const testBooking = await page.locator(`text="${testReason}"`);
          if (await testBooking.isVisible()) {
            console.log('   ✅ New booking appears in the list with test reason!');
          }

          // Get first booking details
          const firstBooking = await page.locator('.booking-item').first();
          const bookingDates = await firstBooking.locator('.booking-dates').textContent();
          const bookingAmount = await firstBooking.locator('.hours-display').textContent();
          const bookingStatus = await firstBooking.locator('.booking-status').textContent();

          console.log('\n   Latest Booking Details:');
          console.log(`      Dates: ${bookingDates}`);
          console.log(`      Amount: ${bookingAmount}`);
          console.log(`      Status: ${bookingStatus}`);
        }
      } else if (requestMsg.includes('Error')) {
        console.log('   ❌ Error submitting request');
        console.log('   Error message:', requestMsg);
        await page.screenshot({ path: 'submission_error.png' });
      }
    } else {
      console.log('   ⚠️ Submit button not visible');
      console.log('   Note: You may need to complete the welcome process first');
    }

    console.log('\n═══════════════════════════════════════════════');
    console.log('📊 SUBMISSION TEST COMPLETE');
    console.log('═══════════════════════════════════════════════');
    console.log('\n✅ What to check in Supabase:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Navigate to Table Editor');
    console.log('   3. Open table: 4_holiday_requests');
    console.log('   4. Look for entry with:');
    console.log(`      - Reason containing: "${uniqueId}"`);
    console.log(`      - Start date: ${fromDateStr}`);
    console.log(`      - End date: ${toDateStr}`);
    console.log('      - Status: pending');
    console.log('\nIf the entry exists, the submission is working correctly!');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await page.screenshot({ path: 'submission_error_state.png' });
  } finally {
    await browser.close();
    console.log('\n🏁 Browser closed');
  }
}

testHolidaySubmission().catch(console.error);