import { chromium } from 'playwright';

async function testFullOnboarding() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300  // Slow down to see the changes
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture console messages
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error' && !text.includes('404') && !text.includes('400')) {
      console.error('[Browser Error]', text);
    } else if (text.includes('Successfully')) {
      console.log('[Browser Success]', text);
    }
  });

  try {
    console.log('=== FULL ONBOARDING TEST ===\n');

    // Step 1: Login
    console.log('1. Logging in as benhowardmagic@hotmail.com...');
    await page.goto('http://127.0.0.1:58156/Home.html');
    await page.waitForTimeout(1000);

    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('input[type="password"]', 'Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(2000);

    // Navigate to Welcome page with force flag to ensure we see onboarding
    console.log('2. Going to Welcome page with force flag...');
    await page.goto('http://127.0.0.1:58156/staff-welcome.html?force=1');
    await page.waitForTimeout(2000);

    // STEP 1: Change Nickname
    if (await page.isVisible('#welcome-step1')) {
      console.log('\n3. STEP 1 - Changing nickname...');
      const oldNickname = await page.inputValue('#nickname');
      console.log('   Old nickname:', oldNickname || '(empty)');

      const newNickname = 'TestUser_' + Date.now().toString().slice(-4);
      await page.fill('#nickname', newNickname);
      console.log('   New nickname:', newNickname);

      await page.click('#save-btn');
      await page.waitForTimeout(1500);

      // Check if saved
      const saveMsg = await page.locator('#save-msg').textContent();
      console.log('   Save message:', saveMsg);
    }

    // STEP 2: Change Role and Team
    if (await page.isVisible('#welcome-step2')) {
      console.log('\n4. STEP 2 - Changing role and team...');

      // Select a different role
      const roleInputs = await page.locator('input[name="role"]');
      const roleCount = await roleInputs.count();
      console.log('   Available roles:', roleCount);

      if (roleCount > 1) {
        // Select the second role (different from default)
        await roleInputs.nth(1).check();
        const selectedRole = await roleInputs.nth(1).inputValue();
        console.log('   Selected role:', selectedRole);
      }

      // Select a team
      const teamInputs = await page.locator('input[name="team"]');
      const teamCount = await teamInputs.count();
      console.log('   Available teams:', teamCount);

      if (teamCount > 0) {
        await teamInputs.first().check();
        const selectedTeam = await teamInputs.first().getAttribute('data-name');
        console.log('   Selected team:', selectedTeam);
      }

      await page.click('#to-avatar-btn');
      await page.waitForTimeout(1500);
    }

    // STEP 3: Change Avatar
    if (await page.isVisible('#welcome-step3')) {
      console.log('\n5. STEP 3 - Modifying avatar...');

      // Change some avatar settings
      const skinSelect = await page.locator('#opt-skin');
      if (await skinSelect.count() > 0) {
        await skinSelect.selectOption({ index: 2 }); // Select third skin option
        console.log('   Changed skin color');
      }

      const eyesSelect = await page.locator('#opt-eyes');
      if (await eyesSelect.count() > 0) {
        await eyesSelect.selectOption({ index: 1 }); // Select second eyes option
        console.log('   Changed eyes');
      }

      // Take screenshot of avatar
      await page.screenshot({ path: 'test_avatar_changed.png' });

      // Click Continue to Working Hours
      console.log('   Clicking Continue to Working Hours...');
      await page.click('#finish-avatar-btn');
      await page.waitForTimeout(2000);

      // Check for any messages
      const finishMsg = await page.locator('#finish-avatar-msg').textContent();
      if (finishMsg) {
        console.log('   Message:', finishMsg);
      }
    }

    // STEP 4: Set Working Hours
    if (await page.isVisible('#step4')) {
      console.log('\n6. STEP 4 - Setting working hours...');

      // Fill in some working hours
      const mondayStart = await page.locator('input[name="monday_start"]');
      const mondayEnd = await page.locator('input[name="monday_end"]');

      if (await mondayStart.count() > 0) {
        await mondayStart.fill('09:00');
        await mondayEnd.fill('17:00');
        console.log('   Set Monday: 09:00 - 17:00');
      }

      const tuesdayStart = await page.locator('input[name="tuesday_start"]');
      const tuesdayEnd = await page.locator('input[name="tuesday_end"]');

      if (await tuesdayStart.count() > 0) {
        await tuesdayStart.fill('08:30');
        await tuesdayEnd.fill('16:30');
        console.log('   Set Tuesday: 08:30 - 16:30');
      }

      // Take screenshot of working hours
      await page.screenshot({ path: 'test_working_hours_set.png' });

      // Click Finish Setup
      console.log('   Clicking Finish Setup...');
      await page.click('#complete-setup');
      await page.waitForTimeout(2000);

      // Check message
      const workingMsg = await page.locator('#working-msg').textContent();
      if (workingMsg) {
        console.log('   Message:', workingMsg);
      }
    }

    // STEP 5: Check Completion Screen
    if (await page.isVisible('#step5')) {
      console.log('\n7. STEP 5 - Completion screen visible!');
      console.log('   ✅ Confetti and celebration showing!');

      // Take screenshot of celebration
      await page.screenshot({ path: 'test_completion_celebration.png' });

      // Wait a bit to see the celebration
      await page.waitForTimeout(2000);

      // Check if it redirects
      console.log('   Waiting for redirect to staff.html...');
      await page.waitForTimeout(3000);

      const finalUrl = page.url();
      console.log('   Final URL:', finalUrl);

      if (finalUrl.includes('staff.html')) {
        console.log('   ✅ Successfully redirected to staff dashboard!');
      }
    } else {
      // If step5 not visible, check where we are
      const currentUrl = page.url();
      console.log('\n❌ Completion screen not shown. Current URL:', currentUrl);

      // Check which step is visible
      console.log('Checking visible steps:');
      console.log('  Step 1:', await page.isVisible('#welcome-step1'));
      console.log('  Step 2:', await page.isVisible('#welcome-step2'));
      console.log('  Step 3:', await page.isVisible('#welcome-step3'));
      console.log('  Step 4:', await page.isVisible('#step4'));
      console.log('  Step 5:', await page.isVisible('#step5'));
    }

    console.log('\n=== TEST COMPLETE ===');
    console.log('Check the screenshots:');
    console.log('  - test_avatar_changed.png');
    console.log('  - test_working_hours_set.png');
    console.log('  - test_completion_celebration.png');

  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'test_error_final.png' });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

// Run the test
testFullOnboarding().catch(console.error);