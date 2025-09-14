import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

async function testWithProperSession() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const page = await browser.newPage();

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    if (!text.includes('Environment:') && !text.includes('Base URL:') &&
        !text.includes('Password Redirect:') && !text.includes('Failed to load resource')) {
      console.log('[Browser]', text);
    }
  });

  try {
    console.log('=== WELCOME FLOW WITH PROPER SESSION ===\n');

    // 1. Start fresh - go to home page and sign out if needed
    console.log('1. Starting fresh session...');
    await page.goto('http://127.0.0.1:5500/Home.html');
    await page.waitForTimeout(2000);

    // Check if we're already logged in
    const pageText = await page.textContent('body');
    if (pageText.includes('benhowardmagic@hotmail.com') || pageText.includes('Sign Out')) {
      console.log('   Already logged in, signing out first...');

      // Try to find and click sign out button
      const signOutBtn = await page.locator('button:has-text("Sign Out")').first();
      if (await signOutBtn.count() > 0) {
        await signOutBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    // 2. Fresh login
    console.log('\n2. Signing in fresh...');
    await page.goto('http://127.0.0.1:5500/Home.html');
    await page.waitForTimeout(1000);

    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('input[type="password"]', 'Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);

    // 3. Verify we're logged in
    console.log('\n3. Verifying login...');
    const afterLoginText = await page.textContent('body');
    if (!afterLoginText.includes('benhowardmagic@hotmail.com')) {
      console.log('   ⚠️ Email not visible on page - may not be logged in properly');
      console.log('   Looking for user info...');

      // Check if we're on admin or staff page
      const currentUrl = page.url();
      console.log('   Current URL:', currentUrl);

      // Take screenshot to see what's happening
      await page.screenshot({ path: 'test_login_state.png' });
    } else {
      console.log('   ✅ Logged in as benhowardmagic@hotmail.com');
    }

    // 4. Navigate to staff portal
    console.log('\n4. Navigating to staff portal...');
    const currentUrl = page.url();
    if (currentUrl.includes('admin-dashboard.html')) {
      console.log('   On admin dashboard, going to staff portal...');
      await page.goto('http://127.0.0.1:5500/staff.html');
    } else if (!currentUrl.includes('staff.html')) {
      console.log('   Navigating directly to staff portal...');
      await page.goto('http://127.0.0.1:5500/staff.html');
    }
    await page.waitForTimeout(2000);

    // Verify we're on staff page and logged in
    const staffPageText = await page.textContent('body');
    if (!staffPageText.includes('benhowardmagic@hotmail.com')) {
      console.log('   ⚠️ Not showing email on staff page - session may be lost');

      // Try logging in again from staff page
      console.log('   Attempting to re-authenticate...');
      await page.goto('http://127.0.0.1:5500/Home.html');
      await page.waitForTimeout(1000);
      await page.fill('#email', 'benhowardmagic@hotmail.com');
      await page.fill('input[type="password"]', 'Hello1!');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);

      // Go back to staff
      await page.goto('http://127.0.0.1:5500/staff.html');
      await page.waitForTimeout(2000);
    }

    // 5. Open Welcome page
    console.log('\n5. Opening Welcome page...');
    const welcomeBtn = await page.locator('button[data-section="welcome"]');
    if (await welcomeBtn.count() > 0) {
      await welcomeBtn.click();
      await page.waitForTimeout(3000);
      console.log('   Clicked welcome button');
    } else {
      console.log('   ❌ Welcome button not found');
      await page.screenshot({ path: 'test_no_welcome_button.png' });
      return;
    }

    // 6. Complete welcome flow
    console.log('\n6. Starting welcome flow...');

    // Step 1: Nickname
    const nicknameField = await page.locator('#nickname');
    if (await nicknameField.isVisible()) {
      console.log('   Step 1: Setting nickname...');
      await nicknameField.clear();
      const nickname = 'Session_' + Date.now();
      await nicknameField.fill(nickname);
      console.log('   Nickname:', nickname);

      const getStartedBtn = await page.locator('button:has-text("Get started")');
      if (await getStartedBtn.isVisible()) {
        await getStartedBtn.click();
        console.log('   Clicked Get Started');
        await page.waitForTimeout(4000);
      }
    }

    // Check if we moved to step 2
    const step2Visible = await page.isVisible('#welcome-step2');
    const roleGridVisible = await page.isVisible('#role-grid');

    console.log('\n7. Checking step progression...');
    console.log('   Step 2 visible:', step2Visible);
    console.log('   Role grid visible:', roleGridVisible);

    if (step2Visible || roleGridVisible) {
      console.log('   ✅ Progressed to Step 2!');

      // Try to select role and team
      await page.waitForTimeout(2000);

      // Check role options
      const roleButtons = await page.locator('#role-grid button, #role-grid label');
      const roleCount = await roleButtons.count();
      console.log('   Found', roleCount, 'role options');

      if (roleCount > 0) {
        await roleButtons.first().click();
        console.log('   Selected first role');
      }

      // Check team options
      const teamButtons = await page.locator('#team-grid button, #team-grid label');
      const teamCount = await teamButtons.count();
      console.log('   Found', teamCount, 'team options');

      if (teamCount > 0) {
        await teamButtons.first().click();
        console.log('   Selected first team');
      }

      // Continue to avatar
      const toAvatarBtn = await page.locator('#to-avatar-btn');
      if (await toAvatarBtn.isVisible()) {
        await toAvatarBtn.click();
        console.log('   Clicked Continue to Avatar');
        await page.waitForTimeout(3000);
      }
    } else {
      console.log('   ❌ Still on Step 1 - nickname save may have failed');
      await page.screenshot({ path: 'test_stuck_step1.png' });
    }

    // Continue with remaining steps if we progressed...
    const avatarRandomize = await page.locator('#avatar-randomize');
    if (await avatarRandomize.isVisible()) {
      console.log('\n8. Step 3: Creating avatar...');
      for (let i = 0; i < 3; i++) {
        await avatarRandomize.click();
        await page.waitForTimeout(800);
      }
      console.log('   Avatar randomized');

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);

      const finishAvatarBtn = await page.locator('#finish-avatar-btn');
      if (await finishAvatarBtn.isVisible()) {
        await finishAvatarBtn.click();
        console.log('   Clicked Finish Avatar');
        await page.waitForTimeout(3000);
      }
    }

    // Working hours
    const mondayInput = await page.locator('#monday-val');
    if (await mondayInput.isVisible()) {
      console.log('\n9. Step 4: Setting working hours...');
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
      for (const day of days) {
        const input = await page.locator(`#${day}-val`);
        if (await input.count() > 0) {
          await input.clear();
          await input.fill('08:00');
        }
      }
      console.log('   Set 40 hours/week');

      const completeBtn = await page.locator('#complete-setup');
      if (await completeBtn.isVisible()) {
        await completeBtn.click();
        console.log('   Clicked Complete Setup');
        await page.waitForTimeout(5000);
      }
    }

    // Check if completed
    const step5Visible = await page.isVisible('#step5');
    if (step5Visible) {
      console.log('\n✅ WELCOME PROCESS COMPLETED!');
      await page.screenshot({ path: 'test_complete_final.png' });
    }

    // 10. Verify holiday data
    console.log('\n10. Checking holiday data...');
    await page.goto('http://127.0.0.1:5500/my-holidays.html');
    await page.waitForTimeout(3000);

    const totalAllowance = await page.locator('#total-allowance').textContent().catch(() => '0');
    const unit = await page.locator('#allowance-unit').textContent().catch(() => 'hours');
    console.log('   Total Allowance:', totalAllowance, unit);

    if (totalAllowance === '400' && unit === 'hours') {
      console.log('   ✅ CALCULATION CORRECT: 40 hours/week * 10 = 400 hours/year');
    }

    console.log('\n=== TEST COMPLETE ===');

  } catch (error) {
    console.error('\n❌ Test error:', error);
    await page.screenshot({ path: 'test_error_session.png' });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testWithProperSession().catch(console.error);
