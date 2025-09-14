import { chromium } from 'playwright';

async function testWorkingHoursNavigation() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500  // Slow down for visibility
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('1. Navigating to home page...');
    await page.goto('http://127.0.0.1:58156/Home.html');
    await page.waitForTimeout(2000);

    console.log('2. Logging in as staff...');
    // Fill in login form
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('input[type="password"]', 'Hello1!');

    // Click sign in
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);

    console.log('3. Clicking Welcome in navigation...');
    // Click Welcome in nav
    await page.click('button[data-section="welcome"]');
    await page.waitForTimeout(2000);

    // Check if we're on the welcome page
    const url = page.url();
    console.log('Current URL:', url);

    // Check if the navigation is visible
    const navVisible = await page.isVisible('.nav.seg-nav');
    console.log('Navigation visible:', navVisible);

    // Check which step is visible
    const step1Visible = await page.isVisible('#welcome-step1');
    const step2Visible = await page.isVisible('#welcome-step2');
    const step3Visible = await page.isVisible('#welcome-step3');
    const step4Visible = await page.isVisible('#step4');

    console.log('Step visibility:');
    console.log('  Step 1 (nickname):', step1Visible);
    console.log('  Step 2 (role/team):', step2Visible);
    console.log('  Step 3 (avatar):', step3Visible);
    console.log('  Step 4 (working hours):', step4Visible);

    // If we're on step 3 (avatar), try to continue to working hours
    if (step3Visible) {
      console.log('4. On avatar step, clicking Continue to Working Hours...');

      // Take screenshot before clicking
      await page.screenshot({ path: 'test_before_working_hours.png' });

      // Click the Continue to Working Hours button
      const continueBtn = await page.locator('#finish-avatar-btn');
      if (await continueBtn.isVisible()) {
        console.log('Found Continue button, clicking...');
        await continueBtn.click();

        // Wait for navigation/transition
        await page.waitForTimeout(3000);

        // Check if step 4 is now visible
        const step4NowVisible = await page.isVisible('#step4');
        console.log('Step 4 visible after click:', step4NowVisible);

        // Take screenshot after clicking
        await page.screenshot({ path: 'test_after_working_hours.png' });

        // Check for any error messages
        const errorMsg = await page.locator('#finish-avatar-msg').textContent();
        if (errorMsg) {
          console.log('Message displayed:', errorMsg);
        }

        // Check console for errors
        page.on('console', msg => {
          if (msg.type() === 'error') {
            console.error('Browser console error:', msg.text());
          }
        });

      } else {
        console.log('Continue button not found/visible');
      }
    } else {
      console.log('Not on avatar step. Need to navigate through the flow first.');

      // If on step 1, fill nickname and continue
      if (step1Visible) {
        console.log('Filling nickname...');
        await page.fill('#nickname', 'TestUser');
        await page.click('#continue-nickname');
        await page.waitForTimeout(2000);
      }

      // If on step 2, select role and continue
      if (await page.isVisible('#welcome-step2')) {
        console.log('Selecting role and team...');
        const roleRadio = await page.locator('input[name="role"][value="staff"]');
        if (await roleRadio.count() > 0) {
          await roleRadio.first().check();
        }
        await page.click('#to-avatar-btn');
        await page.waitForTimeout(2000);
      }

      // Now try the Continue to Working Hours button again
      if (await page.isVisible('#welcome-step3')) {
        console.log('Now on avatar step, clicking Continue to Working Hours...');
        await page.screenshot({ path: 'test_avatar_step.png' });

        const continueBtn = await page.locator('#finish-avatar-btn');
        if (await continueBtn.isVisible()) {
          await continueBtn.click();
          await page.waitForTimeout(3000);

          const step4NowVisible = await page.isVisible('#step4');
          console.log('Step 4 visible after navigation:', step4NowVisible);
          await page.screenshot({ path: 'test_working_hours_final.png' });
        }
      }
    }

    console.log('Test completed. Check screenshots for results.');

  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'test_error.png' });
  } finally {
    await page.waitForTimeout(5000); // Keep browser open for inspection
    await browser.close();
  }
}

// Run the test
testWorkingHoursNavigation().catch(console.error);