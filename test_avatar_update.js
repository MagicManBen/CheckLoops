import { chromium } from 'playwright';

async function testAvatarUpdate() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const page = await browser.newPage();

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Avatar from')) {
      console.log('[Browser]', text);
    }
  });

  try {
    console.log('=== AVATAR UPDATE TEST ===\n');

    // 1. Login
    console.log('1. Logging in...');
    await page.goto('http://127.0.0.1:5500/Home.html');
    await page.waitForTimeout(1000);
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('input[type="password"]', 'Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);

    // 2. Navigate to staff portal homepage
    console.log('\n2. Checking current avatar on homepage...');
    const currentUrl = page.url();
    if (!currentUrl.includes('staff.html')) {
      await page.goto('http://127.0.0.1:5500/staff.html');
      await page.waitForTimeout(2000);
    }

    // Get current avatar URL
    const initialAvatar = await page.locator('#ring-avatar').getAttribute('src').catch(() => null);
    console.log('   Initial avatar URL:', initialAvatar ? initialAvatar.substring(0, 80) + '...' : 'No avatar');

    // Take screenshot of initial state
    await page.screenshot({ path: 'test_avatar_before.png' });

    // 3. Navigate to welcome page to change avatar
    console.log('\n3. Navigating to Welcome page to change avatar...');
    const welcomeBtn = await page.locator('button[data-section="welcome"]');
    if (await welcomeBtn.count() > 0) {
      await welcomeBtn.click();
      await page.waitForTimeout(2000);
    }

    // Check if we're on step 3 (avatar) or need to navigate there
    const step3Visible = await page.locator('#welcome-step3').isVisible().catch(() => false);
    if (!step3Visible) {
      console.log('   Navigating to avatar step...');

      // Check if we're on step 1
      const step1Visible = await page.locator('#welcome-step1').isVisible().catch(() => false);
      if (step1Visible) {
        // Click through step 1
        const getStartedBtn = await page.locator('button:has-text("Get started")');
        if (await getStartedBtn.isVisible()) {
          await getStartedBtn.click();
          await page.waitForTimeout(2000);
        }
      }

      // Check if we're on step 2
      const step2Visible = await page.locator('#welcome-step2').isVisible().catch(() => false);
      if (step2Visible) {
        // Click to avatar
        const toAvatarBtn = await page.locator('#to-avatar-btn');
        if (await toAvatarBtn.isVisible()) {
          await toAvatarBtn.click();
          await page.waitForTimeout(2000);
        }
      }
    }

    // 4. Randomize avatar
    console.log('\n4. Randomizing avatar...');
    const randomizeBtn = await page.locator('#avatar-randomize');
    if (await randomizeBtn.isVisible()) {
      await randomizeBtn.click();
      console.log('   Clicked randomize button');
      await page.waitForTimeout(2000);

      // Get new avatar URL from preview
      const newAvatarPreview = await page.locator('#avatarPreview').getAttribute('src').catch(() => null);
      console.log('   New avatar preview:', newAvatarPreview ? newAvatarPreview.substring(0, 80) + '...' : 'No preview');

      // Save avatar
      const saveBtn = await page.locator('#avatar-save');
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        console.log('   Clicked save button');
        await page.waitForTimeout(3000);
      } else {
        console.log('   Save button not visible, avatar may auto-save');
      }
    } else {
      console.log('   ❌ Randomize button not found');
    }

    // 5. Navigate back to homepage
    console.log('\n5. Returning to homepage to check updated avatar...');
    await page.goto('http://127.0.0.1:5500/staff.html');
    await page.waitForTimeout(3000);

    // Get updated avatar URL
    const updatedAvatar = await page.locator('#ring-avatar').getAttribute('src').catch(() => null);
    console.log('   Updated avatar URL:', updatedAvatar ? updatedAvatar.substring(0, 80) + '...' : 'No avatar');

    // Take screenshot of updated state
    await page.screenshot({ path: 'test_avatar_after.png' });

    // 6. Compare avatars
    console.log('\n6. Comparing avatars...');
    if (initialAvatar && updatedAvatar) {
      // Remove cache-busting parameters for comparison
      const cleanInitial = initialAvatar.split('?')[0].split('&v=')[0];
      const cleanUpdated = updatedAvatar.split('?')[0].split('&v=')[0];

      if (cleanInitial !== cleanUpdated) {
        console.log('   ✅ Avatar successfully updated!');
        console.log('   Initial:', cleanInitial.substring(cleanInitial.length - 30));
        console.log('   Updated:', cleanUpdated.substring(cleanUpdated.length - 30));
      } else {
        console.log('   ⚠️ Avatar appears unchanged');
        console.log('   Both are:', cleanInitial.substring(cleanInitial.length - 30));
      }
    } else {
      if (!initialAvatar && updatedAvatar) {
        console.log('   ✅ Avatar added (was empty before)');
      } else if (initialAvatar && !updatedAvatar) {
        console.log('   ❌ Avatar removed (was present before)');
      } else {
        console.log('   ❌ No avatar found before or after');
      }
    }

    console.log('\n=== TEST COMPLETE ===');
    console.log('Screenshots saved:');
    console.log('  - test_avatar_before.png');
    console.log('  - test_avatar_after.png');

  } catch (error) {
    console.error('\n❌ Test error:', error);
    await page.screenshot({ path: 'test_avatar_error.png' });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testAvatarUpdate().catch(console.error);