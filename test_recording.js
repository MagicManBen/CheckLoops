import { chromium } from 'playwright';

async function testRecordingFix() {
  console.log('Starting recording fix test...');
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // Navigate and login
    console.log('Navigating to application...');
    await page.goto('http://127.0.0.1:58156/index.html');
    await page.waitForTimeout(2000);

    // Check if we're on the login page or already logged in
    const emailField = page.locator('#email');
    const isLoginPage = await emailField.count() > 0;

    if (isLoginPage) {
      console.log('Logging in...');
      await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
      await page.locator('input[type="password"]').fill('Hello1!');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);
    } else {
      console.log('Already logged in or on different page');
    }

    // Navigate directly to staff meetings page (will redirect to login if needed)
    console.log('Navigating to Meetings page...');
    await page.goto('http://127.0.0.1:58156/staff-meetings.html');

    // Check if we're redirected to login
    const needsLogin = await page.locator('#email').count() > 0;
    if (needsLogin) {
      console.log('Redirected to login, logging in...');
      await page.locator('#email').fill('ben.howard@stoke.nhs.uk');
      await page.locator('input[type="password"]').fill('Hello1!');
      await page.click('button:has-text("Sign In")');
      await page.waitForTimeout(3000);
      // Navigate back to meetings page after login
      await page.goto('http://127.0.0.1:58156/staff-meetings.html');
    }

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'meetings_page.png', fullPage: true });

    // Check if tabs are available
    const tabsExist = await page.locator('button[data-tab="notes"]').count() > 0;

    if (tabsExist) {
      // Go to Notes tab
      console.log('Switching to Notes tab...');
      await page.click('button[data-tab="notes"]');
      await page.waitForTimeout(2000);
    } else {
      console.log('Meeting tabs not found on page');
      // Try to wait for Supabase initialization
      await page.waitForTimeout(5000);
    }

    // Select a meeting if available
    const meetingSelect = page.locator('#notes-meeting-select');
    const options = await meetingSelect.locator('option').count();

    if (options > 1) {
      console.log('Selecting first available meeting...');
      await meetingSelect.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
    } else {
      console.log('No meetings available to select');
    }

    // Take screenshot before recording
    console.log('Taking before screenshot...');
    await page.screenshot({ path: 'before_recording.png', fullPage: true });

    // Start recording
    console.log('Starting recording...');
    await page.click('button:has-text("Start Recording")');

    // Grant microphone permission if prompt appears
    await page.context().grantPermissions(['microphone']);
    await page.waitForTimeout(3000);

    // Stop recording
    console.log('Stopping recording...');
    await page.click('button:has-text("Stop")');
    await page.waitForTimeout(2000);

    // Click Save & Transcribe
    console.log('Clicking Save & Transcribe...');
    await page.click('button:has-text("Save & Transcribe")');
    await page.waitForTimeout(5000);

    // Take screenshot after processing
    console.log('Taking after screenshot...');
    await page.screenshot({ path: 'after_recording.png', fullPage: true });

    // Check for error messages
    const statusDiv = page.locator('#pdf-status');
    const statusText = await statusDiv.textContent();

    if (statusText.includes('Error')) {
      console.log('❌ Error found:', statusText);
    } else {
      console.log('✅ Recording processed successfully!');
    }

    // Check if transcript was added to notes
    const notesContent = await page.locator('#meeting-notes-textarea').inputValue();
    if (notesContent && notesContent.includes('Meeting Transcript')) {
      console.log('✅ Transcript added to notes');
    } else {
      console.log('⚠️ Transcript may not have been added');
    }

  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'error_screenshot.png', fullPage: true });
  } finally {
    console.log('Test complete. Browser will close in 5 seconds...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

testRecordingFix().catch(console.error);