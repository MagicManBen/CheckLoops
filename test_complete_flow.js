import { chromium } from 'playwright';

async function testCompleteFlow() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  const page = await browser.newPage();

  // Capture console messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Saved') || text.includes('saved') || text.includes('SUCCESS')) {
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

    // Navigate to staff portal if on admin dashboard
    const currentUrl = page.url();
    if (currentUrl.includes('admin-dashboard.html')) {
      console.log('   On admin dashboard, navigating to staff portal...');
      await page.goto('http://127.0.0.1:5500/staff.html');
      await page.waitForTimeout(1500);
    }

    // 2. Click Welcome in menu
    console.log('\n2. Clicking Welcome in menu...');
    await page.click('button[data-section="welcome"]');
    await page.waitForTimeout(1500);

    // Verify navigation is visible
    const navVisible = await page.isVisible('.nav.seg-nav');
    console.log('   Navigation visible:', navVisible ? '✓' : '✗');

    // Take screenshot
    await page.screenshot({ path: 'test_1_welcome_with_nav.png' });

    // 3. Update nickname and start
    console.log('\n3. Setting nickname and starting...');
    const nicknameField = await page.locator('#nickname');
    await nicknameField.clear();
    await nicknameField.fill('BenjaminTest');
    console.log('   Nickname set to: BenjaminTest');

    await page.click('button:has-text("Get started")');
    await page.waitForTimeout(2000);

    // 4. Check if on step 2 (role/team)
    const step2Visible = await page.isVisible('#welcome-step2');
    console.log('\n4. Step 2 (Role/Team) visible:', step2Visible ? '✓' : '✗');

    if (step2Visible) {
      // Select role
      const roleField = await page.locator('#role');
      if (await roleField.count() > 0) {
        await roleField.selectOption('manager');
        console.log('   Role set to: Manager');
      }

      // Set team
      const teamField = await page.locator('#team');
      if (await teamField.count() > 0) {
        await teamField.fill('Test Team');
        console.log('   Team set to: Test Team');
      }

      // Click continue
      await page.click('#to-avatar-btn');
      await page.waitForTimeout(2000);
    }

    // 5. Check if on step 3 (avatar)
    const step3Visible = await page.isVisible('#welcome-step3');
    console.log('\n5. Step 3 (Avatar) visible:', step3Visible ? '✓' : '✗');

    if (step3Visible) {
      // Click randomize to generate an avatar
      const randomizeBtn = await page.locator('#avatar-randomize');
      if (await randomizeBtn.count() > 0) {
        await randomizeBtn.click();
        console.log('   Clicked Randomize to generate avatar');
        await page.waitForTimeout(1000);
      }

      // Take screenshot
      await page.screenshot({ path: 'test_avatar_changed.png' });

      // Wait for buttons to fully load (takes up to 2 seconds)
      console.log('   Waiting for buttons to load...');
      await page.waitForTimeout(2000);

      // Scroll to the very bottom of the page where the button is
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(500);

      // Look for the Continue to Working Hours button at bottom right
      const continueBtn = await page.locator('button:has-text("Continue to Working Hours")');
      const btnVisible = await continueBtn.isVisible();
      console.log('   Continue button visible:', btnVisible);

      if (btnVisible) {
        await continueBtn.click();
        console.log('   ✓ Clicked Continue to Working Hours');
        await page.waitForTimeout(2000);
      } else {
        // Try with ID selector as fallback
        const altBtn = await page.locator('#finish-avatar-btn');
        if (await altBtn.isVisible()) {
          await altBtn.click();
          console.log('   ✓ Clicked Continue button (by ID)');
          await page.waitForTimeout(2000);
        } else {
          console.log('   ⚠️ Continue button not found');
        }
      }
    }

    // 6. Check if on step 4 (working hours)
    const step4Visible = await page.isVisible('#step4');
    console.log('\n6. Step 4 (Working Hours) visible:', step4Visible ? '✓' : '✗');

    if (step4Visible) {
      // Set working hours
      const mondayCheck = await page.locator('input[data-day="monday"]');
      if (await mondayCheck.count() > 0) {
        await mondayCheck.check();
        console.log('   Monday checked');
      }

      const fridayCheck = await page.locator('input[data-day="friday"]');
      if (await fridayCheck.count() > 0) {
        await fridayCheck.check();
        console.log('   Friday checked');
      }

      // Take screenshot
      await page.screenshot({ path: 'test_working_hours_set.png' });

      // Click Finish Setup
      console.log('\n7. Clicking Finish Setup...');
      const finishBtn = await page.locator('#complete-setup');
      if (await finishBtn.count() > 0) {
        await finishBtn.click();
        console.log('   Clicked Finish Setup');

        // Wait for completion
        await page.waitForTimeout(2000);

        // Check if completion screen shows
        const step5Visible = await page.isVisible('#step5');
        console.log('\n8. Completion screen visible:', step5Visible ? '✓' : '✗');

        if (step5Visible) {
          console.log('   🎉 SUCCESS! All Set screen is showing!');

          // Check for celebration elements
          const confettiCount = await page.locator('.bit').count();
          const balloonCount = await page.locator('.balloon').count();
          console.log('   Confetti pieces:', confettiCount);
          console.log('   Balloons:', balloonCount);

          // Take screenshot
          await page.screenshot({ path: 'test_complete_celebration.png' });

          // Wait for auto-navigation (2 seconds)
          console.log('\n9. Waiting for auto-navigation to staff.html...');
          await page.waitForTimeout(2500);

          const finalUrl = page.url();
          if (finalUrl.includes('staff.html')) {
            console.log('   ✅ Successfully navigated to staff dashboard!');
            await page.screenshot({ path: 'test_complete_dashboard.png' });
          } else {
            console.log('   Current URL:', finalUrl);
          }
        }
      }
    }

  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: 'test_complete_error.png' });
  } finally {
    console.log('\n=== TEST COMPLETE ===');
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testCompleteFlow().catch(console.error);
