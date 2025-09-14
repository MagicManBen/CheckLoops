import { chromium } from 'playwright';

async function testWelcomeFlow() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 200
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Listen to console messages
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('Browser ERROR:', msg.text());
    } else if (msg.type() === 'log') {
      console.log('Browser LOG:', msg.text());
    }
  });

  try {
    console.log('1. Navigating to Home.html...');
    await page.goto('http://127.0.0.1:58156/Home.html');
    await page.waitForTimeout(1000);

    console.log('2. Logging in as staff (benhowardmagic@hotmail.com)...');
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('input[type="password"]', 'Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);

    // Check where we landed
    const currentUrl = page.url();
    console.log('3. Current URL after login:', currentUrl);

    // If we're on the staff home page, navigate to Welcome
    if (currentUrl.includes('staff.html')) {
      console.log('4. On staff home. Clicking Welcome button...');
      const welcomeBtn = await page.locator('button[data-section="welcome"]');
      if (await welcomeBtn.count() > 0) {
        await welcomeBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    // Now we should be on staff-welcome.html
    console.log('5. Checking current state of welcome page...');
    const onWelcomePage = page.url().includes('staff-welcome');
    console.log('   On welcome page:', onWelcomePage);

    if (onWelcomePage) {
      // Try to navigate to avatar step directly via console
      console.log('\n6. Showing avatar step directly...');
      await page.evaluate(() => {
        // Hide all steps
        ['welcome-step1', 'welcome-step2', 'welcome-step3', 'step4', 'step5'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.style.display = 'none';
        });
        // Show avatar step
        const avatarStep = document.getElementById('welcome-step3');
        if (avatarStep) {
          avatarStep.style.display = 'block';
          console.log('Avatar step shown');
        } else {
          console.log('Avatar step not found!');
        }
      });

      await page.waitForTimeout(1000);

      // Check if avatar step is now visible
      const avatarVisible = await page.isVisible('#welcome-step3');
      console.log('7. Avatar step visible:', avatarVisible);

      if (avatarVisible) {
        await page.screenshot({ path: 'welcome_avatar_step.png' });

        // Now try clicking Continue to Working Hours
        console.log('8. Clicking Continue to Working Hours...');
        const continueBtn = await page.locator('#finish-avatar-btn');
        if (await continueBtn.isVisible()) {
          await continueBtn.click();
          await page.waitForTimeout(3000);

          // Check results
          const workingHoursVisible = await page.isVisible('#step4');
          console.log('9. Working hours visible:', workingHoursVisible);

          // Get any messages
          const msgEl = await page.locator('#finish-avatar-msg');
          if (await msgEl.count() > 0) {
            const msg = await msgEl.textContent();
            console.log('   Message:', msg);
          }

          await page.screenshot({ path: 'welcome_after_continue.png' });

          if (workingHoursVisible) {
            console.log('✅ SUCCESS! Working hours step is visible.');
            await page.screenshot({ path: 'welcome_working_hours.png' });
          } else {
            console.log('❌ Working hours step is NOT visible.');
          }
        }
      }
    }

    console.log('\nTest completed.');

  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'welcome_test_error.png' });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

// Run the test
testWelcomeFlow().catch(console.error);
