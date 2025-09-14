import { chromium } from 'playwright';

async function testDebugWelcome() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const page = await browser.newPage();

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    console.log('[Browser]', text);
  });

  try {
    console.log('=== DEBUG WELCOME FLOW ===\n');

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
    console.log('\n2. Opening Welcome page...');
    await page.click('button[data-section="welcome"]');
    await page.waitForTimeout(3000);

    // Check what's visible
    console.log('\n3. Checking visible elements...');

    // Check all possible steps
    const elements = {
      'nickname field': '#nickname',
      'get started button': 'button:has-text("Get started")',
      'step 1 container': '#welcome-step1',
      'step 2 container': '#welcome-step2',
      'role select': '#role',
      'team input': '#team',
      'to avatar button': '#to-avatar-btn',
      'step 3 container': '#welcome-step3',
      'avatar container': '#avatar-container',
      'randomize button': '#avatar-randomize',
      'finish avatar button': '#finish-avatar-btn',
      'step 4 container': '#step4',
      'monday input': '#monday-val',
      'complete setup button': '#complete-setup',
      'step 5 container': '#step5'
    };

    for (const [name, selector] of Object.entries(elements)) {
      const isVisible = await page.locator(selector).isVisible().catch(() => false);
      console.log(`   ${name}: ${isVisible ? '✅ VISIBLE' : '❌ NOT VISIBLE'}`);
    }

    // Take screenshot of current state
    await page.screenshot({ path: 'test_debug_welcome_state.png' });

    // Try to check HTML structure
    console.log('\n4. Checking HTML structure...');
    const welcomeHTML = await page.evaluate(() => {
      const welcome = document.querySelector('#welcome');
      if (!welcome) return 'No #welcome element found';

      // Get all visible step containers
      const visibleSteps = [];
      for (let i = 1; i <= 5; i++) {
        const step = document.querySelector(`#welcome-step${i}`) ||
                    document.querySelector(`#step${i}`);
        if (step && step.style.display !== 'none') {
          visibleSteps.push(`step${i}`);
        }
      }

      return {
        hasWelcome: true,
        visibleSteps: visibleSteps,
        currentDisplay: welcome.style.display || 'block'
      };
    });

    console.log('   Welcome structure:', JSON.stringify(welcomeHTML, null, 2));

    // If nickname is visible, try to complete the flow
    const nicknameVisible = await page.locator('#nickname').isVisible();
    if (nicknameVisible) {
      console.log('\n5. Starting from Step 1 (Nickname)...');

      // Fill nickname
      await page.fill('#nickname', 'TestDebug_' + Date.now());
      await page.waitForTimeout(500);

      // Click get started
      const getStartedBtn = await page.locator('button:has-text("Get started")');
      if (await getStartedBtn.isVisible()) {
        console.log('   Clicking Get Started...');
        await getStartedBtn.click();
        await page.waitForTimeout(3000);

        // Check what's visible after clicking
        console.log('\n6. After Get Started - checking visibility:');
        for (const [name, selector] of Object.entries(elements)) {
          const isVisible = await page.locator(selector).isVisible().catch(() => false);
          if (isVisible) {
            console.log(`   ${name}: ✅ VISIBLE`);
          }
        }

        await page.screenshot({ path: 'test_debug_after_step1.png' });
      }
    }

    // Check if we're on step 2
    const roleVisible = await page.locator('#role').isVisible();
    if (roleVisible) {
      console.log('\n7. On Step 2 (Role/Team)...');

      await page.selectOption('#role', 'nurse');
      await page.fill('#team', 'Debug Team');
      await page.waitForTimeout(500);

      const toAvatarBtn = await page.locator('#to-avatar-btn');
      if (await toAvatarBtn.isVisible()) {
        console.log('   Clicking Continue to Avatar...');
        await toAvatarBtn.click();
        await page.waitForTimeout(3000);

        await page.screenshot({ path: 'test_debug_after_step2.png' });
      }
    }

    // Check if we're on step 3
    const avatarRandomizeVisible = await page.locator('#avatar-randomize').isVisible();
    if (avatarRandomizeVisible) {
      console.log('\n8. On Step 3 (Avatar)...');

      // Click randomize
      await page.click('#avatar-randomize');
      await page.waitForTimeout(1000);
      await page.click('#avatar-randomize');
      await page.waitForTimeout(1000);

      // Scroll down
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);

      const finishAvatarBtn = await page.locator('#finish-avatar-btn');
      if (await finishAvatarBtn.isVisible()) {
        console.log('   Clicking Finish Avatar...');
        await finishAvatarBtn.click();
        await page.waitForTimeout(3000);

        await page.screenshot({ path: 'test_debug_after_step3.png' });
      }
    }

    // Check if we're on step 4
    const mondayVisible = await page.locator('#monday-val').isVisible();
    if (mondayVisible) {
      console.log('\n9. On Step 4 (Working Hours)...');

      // Fill working hours
      await page.fill('#monday-val', '08:00');
      await page.fill('#tuesday-val', '08:00');
      await page.fill('#wednesday-val', '08:00');
      await page.fill('#thursday-val', '08:00');
      await page.fill('#friday-val', '08:00');

      console.log('   Set 40 hours/week');
      await page.screenshot({ path: 'test_debug_working_hours.png' });

      const completeBtn = await page.locator('#complete-setup');
      if (await completeBtn.isVisible()) {
        console.log('   Clicking Complete Setup...');
        await completeBtn.click();
        await page.waitForTimeout(5000);

        await page.screenshot({ path: 'test_debug_after_complete.png' });
      }
    }

    // Final check
    console.log('\n10. Final state check:');
    const step5Visible = await page.locator('#step5').isVisible();
    if (step5Visible) {
      console.log('   ✅ REACHED COMPLETION SCREEN!');
    } else {
      console.log('   ❌ Did not reach completion');

      // Check what's visible now
      for (const [name, selector] of Object.entries(elements)) {
        const isVisible = await page.locator(selector).isVisible().catch(() => false);
        if (isVisible) {
          console.log(`   ${name}: ✅ STILL VISIBLE`);
        }
      }
    }

  } catch (error) {
    console.error('\n❌ Test error:', error);
    await page.screenshot({ path: 'test_debug_error.png' });
  } finally {
    console.log('\n=== DEBUG COMPLETE ===');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testDebugWelcome().catch(console.error);
