import { chromium } from 'playwright';

async function testNicknameDebug() {
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

  // Capture errors
  page.on('pageerror', error => {
    console.error('[PageError]', error.message);
  });

  try {
    console.log('=== NICKNAME SAVE DEBUG ===\n');

    // 1. Start fresh - go to home page
    console.log('1. Starting fresh session...');
    await page.goto('http://127.0.0.1:5500/Home.html');
    await page.waitForTimeout(2000);

    // 2. Fresh login
    console.log('\n2. Signing in...');
    await page.fill('#email', 'benhowardmagic@hotmail.com');
    await page.fill('input[type="password"]', 'Hello1!');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);

    // 3. Navigate to staff portal
    console.log('\n3. Navigating to staff portal...');
    await page.goto('http://127.0.0.1:5500/staff.html');
    await page.waitForTimeout(2000);

    // 4. Open Welcome page
    console.log('\n4. Opening Welcome page...');
    const welcomeBtn = await page.locator('button[data-section="welcome"]');
    if (await welcomeBtn.count() > 0) {
      await welcomeBtn.click();
      await page.waitForTimeout(3000);
    }

    // 5. Check initial state
    console.log('\n5. Checking initial state...');
    const step1Visible = await page.isVisible('#welcome-step1');
    console.log('   Step 1 visible:', step1Visible);

    const nicknameField = await page.locator('#nickname');
    if (await nicknameField.isVisible()) {
      const existingValue = await nicknameField.inputValue();
      console.log('   Existing nickname value:', existingValue || '(empty)');
    }

    // 6. Try to save nickname
    console.log('\n6. Setting nickname and clicking Get Started...');
    await nicknameField.clear();
    const testNickname = 'Debug_' + Date.now();
    await nicknameField.fill(testNickname);
    console.log('   Nickname set to:', testNickname);

    // Wait a moment before clicking
    await page.waitForTimeout(500);

    // Click Get Started
    const getStartedBtn = await page.locator('button:has-text("Get started")');
    if (await getStartedBtn.isVisible()) {
      console.log('   Get Started button found, clicking...');
      await getStartedBtn.click();

      // Wait longer for processing
      console.log('   Waiting for processing...');
      await page.waitForTimeout(5000);
    } else {
      console.log('   ❌ Get Started button not found!');
    }

    // 7. Check save message
    const saveMsg = await page.locator('#save-msg');
    if (await saveMsg.count() > 0) {
      const msgText = await saveMsg.textContent();
      console.log('   Save message:', msgText || '(empty)');
    }

    // 8. Check if we progressed
    console.log('\n7. Checking progression...');
    const step1StillVisible = await page.isVisible('#welcome-step1');
    const step2Visible = await page.isVisible('#welcome-step2');
    const roleGridVisible = await page.isVisible('#role-grid');

    console.log('   Step 1 still visible:', step1StillVisible);
    console.log('   Step 2 visible:', step2Visible);
    console.log('   Role grid visible:', roleGridVisible);

    if (!step2Visible && !roleGridVisible) {
      console.log('\n   ❌ Still stuck on Step 1');

      // Take screenshot for debugging
      await page.screenshot({ path: 'test_nickname_stuck.png' });

      // Check console for errors
      console.log('\n   Checking for JavaScript errors...');
      const logs = await page.evaluate(() => {
        return window.consoleErrors || [];
      });
      if (logs.length > 0) {
        console.log('   JavaScript errors found:', logs);
      }
    } else {
      console.log('\n   ✅ Successfully progressed to Step 2!');
      await page.screenshot({ path: 'test_nickname_success.png' });
    }

    console.log('\n=== DEBUG COMPLETE ===');

  } catch (error) {
    console.error('\n❌ Test error:', error);
    await page.screenshot({ path: 'test_nickname_error.png' });
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

testNicknameDebug().catch(console.error);