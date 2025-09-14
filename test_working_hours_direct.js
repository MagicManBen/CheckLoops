import { chromium } from 'playwright';

async function testWorkingHoursDirect() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Going directly to staff-welcome.html...');
    await page.goto('http://127.0.0.1:58156/staff-welcome.html');
    await page.waitForTimeout(1000);

    // Check if we need to log in
    const hasEmailField = await page.locator('#email').count() > 0;
    if (hasEmailField) {
      console.log('2. Logging in...');
      await page.fill('#email', 'benhowardmagic@hotmail.com');
      await page.fill('input[type="password"]', 'Hello1!');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(2000);
    }

    // Navigate through the steps quickly
    console.log('3. Navigating through onboarding steps...');

    // Step 1: Nickname
    if (await page.isVisible('#welcome-step1')) {
      console.log('  - Filling nickname...');
      await page.fill('#nickname', 'Ben');
      await page.click('#continue-nickname');
      await page.waitForTimeout(1000);
    }

    // Step 2: Role and Team
    if (await page.isVisible('#welcome-step2')) {
      console.log('  - Selecting role and team...');
      // Select first available role
      const roleInputs = await page.locator('input[name="role"]');
      if (await roleInputs.count() > 0) {
        await roleInputs.first().check();
      }
      // Select first available team if any
      const teamInputs = await page.locator('input[name="team"]');
      if (await teamInputs.count() > 0) {
        await teamInputs.first().check();
      }
      await page.click('#to-avatar-btn');
      await page.waitForTimeout(1000);
    }

    // Step 3: Avatar - this is where we test the navigation
    if (await page.isVisible('#welcome-step3')) {
      console.log('4. On avatar step. Testing Continue to Working Hours...');

      // Take a screenshot before
      await page.screenshot({ path: 'test_before_continue.png' });

      // Open browser console to see logs
      page.on('console', msg => {
        console.log(`Browser console [${msg.type()}]:`, msg.text());
      });

      // Click Continue to Working Hours
      const continueBtn = await page.locator('#finish-avatar-btn');
      if (await continueBtn.isVisible()) {
        console.log('5. Clicking Continue to Working Hours button...');
        await continueBtn.click();

        // Wait for potential navigation
        await page.waitForTimeout(3000);

        // Check what's visible now
        const step3StillVisible = await page.isVisible('#welcome-step3');
        const step4Visible = await page.isVisible('#step4');
        const workingFormVisible = await page.isVisible('#working-form');

        console.log('\n6. Results after clicking Continue:');
        console.log('   Avatar step still visible:', step3StillVisible);
        console.log('   Working hours step visible:', step4Visible);
        console.log('   Working form visible:', workingFormVisible);

        // Get any error message
        const msgElement = await page.locator('#finish-avatar-msg');
        if (await msgElement.count() > 0) {
          const message = await msgElement.textContent();
          console.log('   Message displayed:', message);
        }

        // Take a screenshot after
        await page.screenshot({ path: 'test_after_continue.png' });

        if (step4Visible) {
          console.log('\n✅ SUCCESS: Working hours page is now visible!');

          // Check what's in the working hours form
          const workingFormContent = await page.locator('#working-form').innerHTML();
          console.log('Working form has content:', workingFormContent.length > 0);

          // Try the back button
          const backBtn = await page.locator('#working-back');
          if (await backBtn.isVisible()) {
            console.log('\n7. Testing back button...');
            await backBtn.click();
            await page.waitForTimeout(1000);

            const backToAvatar = await page.isVisible('#welcome-step3');
            console.log('   Back to avatar step:', backToAvatar);
          }
        } else {
          console.log('\n❌ FAILED: Working hours page is not visible');
        }
      } else {
        console.log('❌ Continue button not found');
      }
    } else {
      console.log('Not on avatar step. Current page state:');
      console.log('  Step 1 visible:', await page.isVisible('#welcome-step1'));
      console.log('  Step 2 visible:', await page.isVisible('#welcome-step2'));
      console.log('  Step 3 visible:', await page.isVisible('#welcome-step3'));
      console.log('  Step 4 visible:', await page.isVisible('#step4'));
    }

    console.log('\nTest completed. Check screenshots.');

  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'test_error_state.png' });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

// Run the test
testWorkingHoursDirect().catch(console.error);