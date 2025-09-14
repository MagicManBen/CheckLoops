import { chromium } from 'playwright';

async function testAvatarManualSave() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const page = await browser.newPage();

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Avatar') || text.includes('Profile') || text.includes('save')) {
      console.log('[Browser]', text);
    }
  });

  try {
    console.log('=== AVATAR MANUAL SAVE TEST ===\n');

    // 1. Login
    console.log('1. Logging in...');
    await page.goto('http://127.0.0.1:5500/Home.html');
    await page.waitForTimeout(1000);
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('input[type="password"]', 'Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);

    // 2. Go directly to welcome page
    console.log('\n2. Going directly to welcome page...');
    await page.goto('http://127.0.0.1:5500/staff-welcome.html');
    await page.waitForTimeout(2000);

    // 3. Navigate to avatar step
    console.log('\n3. Navigating to avatar step...');

    // Check current step
    const step1Visible = await page.locator('#welcome-step1').isVisible().catch(() => false);
    const step2Visible = await page.locator('#welcome-step2').isVisible().catch(() => false);
    const step3Visible = await page.locator('#welcome-step3').isVisible().catch(() => false);

    console.log('   Step 1 visible:', step1Visible);
    console.log('   Step 2 visible:', step2Visible);
    console.log('   Step 3 visible:', step3Visible);

    if (step1Visible) {
      // Fill nickname if needed
      const nicknameField = await page.locator('#nickname');
      if (await nicknameField.isVisible()) {
        const existingNickname = await nicknameField.inputValue();
        if (!existingNickname) {
          await nicknameField.fill('TestUser_' + Date.now());
        }
      }

      // Click Get Started
      const getStartedBtn = await page.locator('button:has-text("Get started")');
      if (await getStartedBtn.isVisible()) {
        console.log('   Clicking Get Started...');
        await getStartedBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    // Now on step 2, click to avatar
    const toAvatarBtn = await page.locator('#to-avatar-btn');
    if (await toAvatarBtn.isVisible()) {
      console.log('   Clicking Continue to Avatar...');
      await toAvatarBtn.click();
      await page.waitForTimeout(2000);
    }

    // 4. Now we should be on avatar step
    console.log('\n4. On avatar step - testing manual save...');

    // Get initial avatar
    const initialAvatar = await page.locator('#avatarPreview').getAttribute('src').catch(() => null);
    console.log('   Initial avatar:', initialAvatar ? initialAvatar.substring(0, 60) + '...' : 'None');

    // Click randomize
    const randomizeBtn = await page.locator('#avatar-randomize');
    if (await randomizeBtn.isVisible()) {
      console.log('   Clicking Randomize...');
      await randomizeBtn.click();
      await page.waitForTimeout(2000);

      // Get new avatar
      const newAvatar = await page.locator('#avatarPreview').getAttribute('src').catch(() => null);
      console.log('   New avatar:', newAvatar ? newAvatar.substring(0, 60) + '...' : 'None');

      // Click manual save
      const saveBtn = await page.locator('#avatar-save-manual');
      if (await saveBtn.isVisible()) {
        console.log('   Clicking Save Avatar button...');
        await saveBtn.click();
        await page.waitForTimeout(3000);

        // Check save message
        const saveMsg = await page.locator('#avatar-save-msg').textContent().catch(() => '');
        console.log('   Save message:', saveMsg);

        // Take screenshot
        await page.screenshot({ path: 'test_avatar_saved.png' });
      } else {
        console.log('   ❌ Save button not found');
      }
    } else {
      console.log('   ❌ Randomize button not found');
    }

    // 5. Go back to homepage to verify
    console.log('\n5. Returning to homepage to verify...');
    await page.goto('http://127.0.0.1:5500/staff.html');
    await page.waitForTimeout(3000);

    // Get avatar on homepage
    const homepageAvatar = await page.locator('#ring-avatar').getAttribute('src').catch(() => null);
    console.log('   Homepage avatar:', homepageAvatar ? homepageAvatar.substring(0, 60) + '...' : 'None');

    // Take final screenshot
    await page.screenshot({ path: 'test_avatar_homepage_after_save.png' });

    console.log('\n=== TEST COMPLETE ===');
    console.log('Screenshots saved:');
    console.log('  - test_avatar_saved.png');
    console.log('  - test_avatar_homepage_after_save.png');

  } catch (error) {
    console.error('\n❌ Test error:', error);
    await page.screenshot({ path: 'test_avatar_error.png' });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testAvatarManualSave().catch(console.error);