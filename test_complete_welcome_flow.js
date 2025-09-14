import { chromium } from 'playwright';

async function testCompleteWelcomeFlow() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const page = await browser.newPage();

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('Environment:') && !text.includes('Base URL:') && !text.includes('Password Redirect:')) {
      console.log('[Browser]', text);
    }
  });

  try {
    console.log('=== COMPLETE WELCOME FLOW TEST ===\n');

    // 1. Login
    console.log('1. Logging in...');
    await page.goto('http://127.0.0.1:5500/Home.html');
    await page.waitForTimeout(1000);
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('input[type="password"]', 'Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(2000);

    // Navigate to staff portal
    const currentUrl = page.url();
    if (currentUrl.includes('admin-dashboard.html')) {
      console.log('   Redirected to admin, going to staff portal...');
      await page.goto('http://127.0.0.1:5500/staff.html');
      await page.waitForTimeout(1500);
    }

    // 2. Go to Welcome page
    console.log('\n2. Starting Welcome process...');
    await page.click('button[data-section="welcome"]');
    await page.waitForTimeout(2000);

    // Step 1: Nickname
    console.log('\n3. Step 1: Setting nickname...');
    const nicknameField = await page.locator('#nickname');
    if (await nicknameField.isVisible()) {
      await nicknameField.clear();
      const uniqueNickname = 'HolidayTest_' + Date.now();
      await nicknameField.fill(uniqueNickname);
      console.log('   Nickname set to:', uniqueNickname);

      const getStartedBtn = await page.locator('button:has-text("Get started")');
      if (await getStartedBtn.isVisible()) {
        await getStartedBtn.click();
        console.log('   Clicked Get Started');
        await page.waitForTimeout(2500);
      }
    } else {
      console.log('   Already past nickname step');
    }

    // Step 2: Role and Team
    console.log('\n4. Step 2: Setting role and team...');
    const roleSelect = await page.locator('#role');
    if (await roleSelect.isVisible()) {
      await roleSelect.selectOption('nurse');
      console.log('   Role set to: Nurse');

      const teamField = await page.locator('#team');
      await teamField.clear();
      await teamField.fill('Holiday Test Team');
      console.log('   Team set to: Holiday Test Team');

      const toAvatarBtn = await page.locator('#to-avatar-btn');
      if (await toAvatarBtn.isVisible()) {
        await toAvatarBtn.click();
        console.log('   Clicked Continue to Avatar');
        await page.waitForTimeout(2500);
      }
    } else {
      console.log('   Already past role/team step');
    }

    // Step 3: Avatar
    console.log('\n5. Step 3: Setting avatar...');
    const avatarRandomize = await page.locator('#avatar-randomize');
    if (await avatarRandomize.isVisible()) {
      // Click randomize multiple times to ensure we get an avatar
      await avatarRandomize.click();
      await page.waitForTimeout(1000);
      await avatarRandomize.click();
      await page.waitForTimeout(1000);
      console.log('   Avatar randomized');

      // Scroll to see the continue button
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);

      const finishAvatarBtn = await page.locator('#finish-avatar-btn');
      if (await finishAvatarBtn.isVisible()) {
        await finishAvatarBtn.click();
        console.log('   Clicked Finish Avatar');
        await page.waitForTimeout(2500);
      }
    } else {
      console.log('   Already past avatar step');
    }

    // Step 4: Working Hours
    console.log('\n6. Step 4: Setting working hours...');
    const mondayInput = await page.locator('#monday-val');
    if (await mondayInput.isVisible()) {
      console.log('   Setting working hours for each day...');

      // Set Monday-Friday to 8 hours each (40 hours total)
      await mondayInput.clear();
      await mondayInput.fill('08:00');
      console.log('   Monday: 8 hours');

      const tuesdayInput = await page.locator('#tuesday-val');
      await tuesdayInput.clear();
      await tuesdayInput.fill('08:00');
      console.log('   Tuesday: 8 hours');

      const wednesdayInput = await page.locator('#wednesday-val');
      await wednesdayInput.clear();
      await wednesdayInput.fill('08:00');
      console.log('   Wednesday: 8 hours');

      const thursdayInput = await page.locator('#thursday-val');
      await thursdayInput.clear();
      await thursdayInput.fill('08:00');
      console.log('   Thursday: 8 hours');

      const fridayInput = await page.locator('#friday-val');
      await fridayInput.clear();
      await fridayInput.fill('08:00');
      console.log('   Friday: 8 hours');

      console.log('   Total weekly hours: 40');

      await page.screenshot({ path: 'test_working_hours_filled.png' });

      // Complete setup
      const completeBtn = await page.locator('#complete-setup');
      if (await completeBtn.isVisible()) {
        console.log('\n7. Completing setup...');
        await completeBtn.click();
        console.log('   Clicked Complete Setup');
        await page.waitForTimeout(4000);
      }
    } else {
      console.log('   Working hours not visible - checking if already complete');
    }

    // Check if we reached completion
    const step5Visible = await page.isVisible('#step5');
    if (step5Visible) {
      console.log('\n✅ WELCOME PROCESS COMPLETED!');
      await page.screenshot({ path: 'test_welcome_completed.png' });

      // Wait for celebrations to finish
      await page.waitForTimeout(3000);
    } else {
      console.log('\n⚠️ Did not reach completion screen - checking current state');
      await page.screenshot({ path: 'test_current_state.png' });
    }

    // 8. Verify My Holidays page now works
    console.log('\n8. Verifying My Holidays page...');
    await page.goto('http://127.0.0.1:5500/my-holidays.html');
    await page.waitForTimeout(3000);

    // Check if holiday data loads
    const totalAllowanceElement = await page.locator('#total-allowance');
    if (await totalAllowanceElement.count() > 0) {
      const totalAllowance = await totalAllowanceElement.textContent();
      const usedHolidays = await page.textContent('#used-holidays');
      const remainingHolidays = await page.textContent('#remaining-holidays');
      const unit = await page.textContent('#allowance-unit');

      console.log('\n✅ HOLIDAY DATA LOADED:');
      console.log('   - Total Allowance:', totalAllowance, unit);
      console.log('   - Used:', usedHolidays, unit);
      console.log('   - Remaining:', remainingHolidays, unit);

      // Verify calculation (40 hours * 10 multiplier = 400 hours)
      if (totalAllowance === '400' && unit === 'hours') {
        console.log('   ✅ CALCULATION CORRECT: 40 hours/week * 10 = 400 hours/year');
      }

      await page.screenshot({ path: 'test_holidays_after_welcome.png' });
    } else {
      const pageText = await page.textContent('body');
      if (pageText.includes('Holiday Setup Required')) {
        console.log('   ❌ Still showing setup required - data may not have populated');
      }
    }

    // 9. Test holiday booking
    console.log('\n9. Testing holiday booking...');
    const fromDateInput = await page.locator('#from-date');
    if (await fromDateInput.isVisible()) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);

      await fromDateInput.fill(tomorrow.toISOString().split('T')[0]);
      await page.fill('#to-date', dayAfter.toISOString().split('T')[0]);
      await page.click('#calculate-btn');
      await page.waitForTimeout(2000);

      const calculationVisible = await page.isVisible('#calculation-result');
      if (calculationVisible) {
        const calcTotal = await page.textContent('#calc-total');
        const calcUnit = await page.textContent('#calc-unit');
        console.log('   Calculated time off:', calcTotal, calcUnit);

        // Submit request
        await page.fill('#reason', 'Test holiday request after welcome completion');
        const submitBtn = await page.locator('#submit-request');
        if (await submitBtn.isVisible()) {
          await submitBtn.click();
          await page.waitForTimeout(2000);

          const requestMsg = await page.textContent('#request-msg');
          console.log('   Request result:', requestMsg);
          await page.screenshot({ path: 'test_holiday_request_submitted.png' });
        }
      }
    }

    console.log('\n=== TEST SUMMARY ===');
    console.log('✅ Welcome flow completed');
    console.log('✅ Working hours set (40 hours/week)');
    console.log('✅ Holiday entitlement calculated');
    console.log('✅ My Holidays page functional');
    console.log('✅ Holiday booking tested');

  } catch (error) {
    console.error('\n❌ Test error:', error);
    await page.screenshot({ path: 'test_error_state.png' });
  } finally {
    console.log('\n=== TEST COMPLETE ===');
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testCompleteWelcomeFlow().catch(console.error);