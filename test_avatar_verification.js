import { chromium } from 'playwright';

async function testAvatarVerification() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const page = await browser.newPage();

  try {
    console.log('=== AVATAR VERIFICATION TEST ===\n');

    // 1. Login and go to homepage
    console.log('1. Logging in and checking initial avatar...');
    await page.goto('http://127.0.0.1:5500/Home.html');
    await page.waitForTimeout(1000);
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('input[type="password"]', 'Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);

    // Go to staff homepage
    await page.goto('http://127.0.0.1:5500/staff.html');
    await page.waitForTimeout(2000);

    // Get initial avatar
    const initialAvatar = await page.locator('#ring-avatar').getAttribute('src').catch(() => null);
    const initialSeed = initialAvatar ? initialAvatar.match(/seed=([^&]+)/)?.[1] : null;
    console.log('   Initial avatar seed:', initialSeed || 'No avatar');

    // Take before screenshot
    await page.screenshot({ path: 'verify_avatar_before.png' });

    // 2. Go to welcome page and change avatar
    console.log('\n2. Changing avatar...');
    await page.goto('http://127.0.0.1:5500/staff-welcome.html');
    await page.waitForTimeout(2000);

    // Navigate to avatar step (skip if already there)
    const step3Visible = await page.locator('#welcome-step3').isVisible().catch(() => false);
    if (!step3Visible) {
      const step1Visible = await page.locator('#welcome-step1').isVisible().catch(() => false);
      if (step1Visible) {
        const getStartedBtn = await page.locator('button:has-text("Get started")');
        if (await getStartedBtn.isVisible()) {
          await getStartedBtn.click();
          await page.waitForTimeout(2000);
        }
      }

      const toAvatarBtn = await page.locator('#to-avatar-btn');
      if (await toAvatarBtn.isVisible()) {
        await toAvatarBtn.click();
        await page.waitForTimeout(2000);
      }
    }

    // Randomize and save
    const randomizeBtn = await page.locator('#avatar-randomize');
    if (await randomizeBtn.isVisible()) {
      await randomizeBtn.click();
      await page.waitForTimeout(1000);

      // Get new avatar seed
      const newAvatarUrl = await page.locator('#avatarPreview').getAttribute('src').catch(() => null);
      const newSeed = newAvatarUrl ? newAvatarUrl.match(/seed=([^&]+)/)?.[1] : null;
      console.log('   New avatar seed:', newSeed || 'Failed to get');

      // Save avatar
      const saveBtn = await page.locator('#avatar-save-manual');
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.waitForTimeout(3000);

        const saveMsg = await page.locator('#avatar-save-msg').textContent().catch(() => '');
        console.log('   Save result:', saveMsg);
      }
    }

    // 3. Return to homepage and verify change
    console.log('\n3. Verifying avatar change on homepage...');
    await page.goto('http://127.0.0.1:5500/staff.html');
    await page.waitForTimeout(3000);

    // Get updated avatar
    const updatedAvatar = await page.locator('#ring-avatar').getAttribute('src').catch(() => null);
    const updatedSeed = updatedAvatar ? updatedAvatar.match(/seed=([^&]+)/)?.[1] : null;
    console.log('   Updated avatar seed:', updatedSeed || 'No avatar');

    // Take after screenshot
    await page.screenshot({ path: 'verify_avatar_after.png' });

    // 4. Compare results
    console.log('\n4. Results:');
    if (initialSeed && updatedSeed && initialSeed !== updatedSeed) {
      console.log('   ✅ SUCCESS: Avatar changed from', initialSeed, 'to', updatedSeed);
    } else if (initialSeed === updatedSeed) {
      console.log('   ❌ FAILED: Avatar unchanged (still', initialSeed, ')');
    } else {
      console.log('   ⚠️ Could not verify avatar change');
    }

    console.log('\n=== TEST COMPLETE ===');
    console.log('Screenshots saved:');
    console.log('  - verify_avatar_before.png');
    console.log('  - verify_avatar_after.png');

  } catch (error) {
    console.error('\n❌ Test error:', error);
    await page.screenshot({ path: 'verify_avatar_error.png' });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testAvatarVerification().catch(console.error);