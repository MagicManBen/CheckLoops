import { chromium } from 'playwright';

async function testCompleteFlow() {
  console.log('=== COMPLETE CHECKLOOP FLOW TEST ===\n');
  console.log('This test will guide you through:');
  console.log('1. Setting up your PIN');
  console.log('2. Authenticating with PIN');
  console.log('3. Scanning items');
  console.log('4. Submitting checklist\n');

  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('===') || text.includes('PIN') || text.includes('Staff') || text.includes('submission')) {
      console.log('[PAGE]:', text);
    }
  });

  try {
    // Step 1: Navigate and login
    console.log('STEP 1: Navigating to application...');
    await page.goto('http://127.0.0.1:54907/indexIpad.html');
    await page.waitForTimeout(2000);

    // Check if we need to login
    const loginEmail = page.locator('#loginEmail');
    if (await loginEmail.isVisible()) {
      console.log('STEP 2: Logging in as benhowardmagic@hotmail.com...');
      await loginEmail.fill('benhowardmagic@hotmail.com');
      await page.locator('#loginPass').fill('Hello1!');
      await page.click('#doLogin');
      await page.waitForTimeout(3000);
    }

    // Step 2: Set up PIN
    const pinScreen = page.locator('#screen-pin');
    if (await pinScreen.isVisible()) {
      console.log('\nSTEP 3: Setting up PIN...');
      console.log('Opening PIN setup screen (clicking + button)...');

      await page.click('#btnPinSetup');
      await page.waitForTimeout(2000);

      // Select user from dropdown
      const userSelect = page.locator('#pinSetupUser');
      if (await userSelect.isVisible()) {
        const options = await userSelect.locator('option').all();
        console.log(`Found ${options.length - 1} users available for PIN setup`);

        // Find and select the current user
        let userFound = false;
        for (let i = 1; i < options.length; i++) {
          const text = await options[i].textContent();
          if (text.includes('Ben Howard') || text.includes('benhowardmagic')) {
            await userSelect.selectOption({ index: i });
            console.log(`Selected user: ${text}`);
            userFound = true;
            break;
          }
        }

        if (!userFound) {
          console.log('User not found in dropdown. Selecting first available user...');
          if (options.length > 1) {
            await userSelect.selectOption({ index: 1 });
            const selectedText = await options[1].textContent();
            console.log(`Selected: ${selectedText}`);
          }
        }

        // Set PIN to 5678
        console.log('Setting PIN to 5678...');
        await page.locator('#pinSetupNew').fill('5678');
        await page.locator('#pinSetupConfirm').fill('5678');

        // Save PIN
        await page.click('#btnPinSetupSave');
        await page.waitForTimeout(3000);

        const setupMsg = await page.locator('#pinSetupMsg').textContent();
        console.log('PIN setup result:', setupMsg || 'Success');

        // Go back to PIN screen
        if (setupMsg && setupMsg.includes('success')) {
          await page.click('#btnPinSetupCancel');
          await page.waitForTimeout(1000);
        }
      }
    }

    // Step 3: Authenticate with PIN
    if (await pinScreen.isVisible()) {
      console.log('\nSTEP 4: Authenticating with PIN 5678...');

      // Clear any previous attempt
      const clearBtn = page.locator('#btnClearPin');
      if (await clearBtn.isVisible()) {
        await clearBtn.click();
        await page.waitForTimeout(500);
      }

      // Enter PIN 5678
      await page.click('.key:has-text("5")');
      await page.waitForTimeout(200);
      await page.click('.key:has-text("6")');
      await page.waitForTimeout(200);
      await page.click('.key:has-text("7")');
      await page.waitForTimeout(200);
      await page.click('.key:has-text("8")');

      // Wait for authentication
      await page.waitForTimeout(3000);

      const pinMsg = await page.locator('#pinMsg').textContent();
      if (pinMsg && pinMsg.includes('Invalid')) {
        console.log('PIN authentication failed:', pinMsg);
        console.log('Please manually set your PIN using the + button and try again');
        await page.screenshot({ path: 'pin_setup_needed.png' });
        return;
      }
    }

    // Step 4: Start scanning
    const beginScreen = page.locator('#screen-begin');
    if (await beginScreen.isVisible()) {
      console.log('\nSTEP 5: Starting checklist...');
      await page.click('#btnBegin');
      await page.waitForTimeout(2000);
    }

    // Step 5: Add items via upload screen
    const uploadScreen = page.locator('#screen-upload');
    if (await uploadScreen.isVisible()) {
      console.log('\nSTEP 6: Adding test items...');

      const uploadInput = page.locator('#uploadInput');
      if (await uploadInput.isVisible()) {
        // Add three test items
        console.log('Adding item: 1234567890');
        await uploadInput.fill('1234567890');
        await uploadInput.press('Enter');
        await page.waitForTimeout(1000);

        console.log('Adding item: 0987654321');
        await uploadInput.fill('0987654321');
        await uploadInput.press('Enter');
        await page.waitForTimeout(1000);

        console.log('Adding item: 1111111111');
        await uploadInput.fill('1111111111');
        await uploadInput.press('Enter');
        await page.waitForTimeout(3000);
      }
    }

    // Step 6: Review and submit
    const reviewScreen = page.locator('#screen-review');
    if (await reviewScreen.isVisible()) {
      console.log('\nSTEP 7: On review screen...');

      // Take screenshot of debug panel
      await page.screenshot({ path: 'review_with_debug.png', fullPage: true });
      console.log('Screenshot saved: review_with_debug.png');

      // Click refresh debug info
      const refreshBtn = page.locator('button:has-text("Refresh Debug Info")');
      if (await refreshBtn.isVisible()) {
        await refreshBtn.click();
        await page.waitForTimeout(1000);
      }

      // Get debug panel content
      const debugPanel = page.locator('#debugPanel');
      if (await debugPanel.isVisible()) {
        const debugContent = await debugPanel.textContent();
        console.log('\n=== DEBUG INFO ===');
        console.log(debugContent);
        console.log('==================\n');
      }

      // Try to submit
      console.log('STEP 8: Attempting submission...');
      const submitBtn = page.locator('#btnSubmit');
      if (await submitBtn.isVisible() && !await submitBtn.isDisabled()) {
        await submitBtn.click();
        await page.waitForTimeout(3000);

        // Check submission result
        const submitMsg = await page.locator('#submitMsg').textContent();
        console.log('Submission result:', submitMsg);

        // Get final debug panel content
        const finalDebug = await debugPanel.textContent();
        if (finalDebug.includes('SUCCESS')) {
          console.log('\n✅ SUBMISSION SUCCESSFUL!');
        } else if (finalDebug.includes('ERROR')) {
          console.log('\n❌ SUBMISSION FAILED');
          console.log('Debug output:', finalDebug);
        }

        // Take final screenshot
        await page.screenshot({ path: 'submission_result.png', fullPage: true });
        console.log('Final screenshot saved: submission_result.png');
      } else {
        console.log('Submit button not available or disabled');
      }
    }

  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'error_screenshot.png', fullPage: true });
  } finally {
    console.log('\n=== TEST SUMMARY ===');
    console.log('1. Check review_with_debug.png to see the state before submission');
    console.log('2. Check submission_result.png to see the final result');
    console.log('3. If PIN authentication failed, use the + button to set your PIN to 5678');
    console.log('4. The debug panel shows all critical information for troubleshooting');
    console.log('====================\n');

    await page.waitForTimeout(10000);
    await browser.close();
    console.log('Test completed');
  }
}

testCompleteFlow().catch(console.error);
