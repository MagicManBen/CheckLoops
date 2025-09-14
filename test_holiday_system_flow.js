import { chromium } from 'playwright';

async function testHolidaySystem() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Testing Holiday Management System...');

    // 1. First, create the admin_settings table via the admin dashboard
    console.log('Step 1: Opening admin dashboard...');
    await page.goto('http://127.0.0.1:58156/admin-dashboard.html');
    await page.waitForTimeout(2000);

    // Login as admin
    const loginForm = await page.$('#loginForm');
    if (loginForm) {
      console.log('Logging in as admin...');
      await page.fill('#email', 'ben.howard@stoke.nhs.uk');
      await page.fill('#password', 'Hello1!');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000);
    }

    // Navigate to holidays section
    console.log('Step 2: Navigating to holidays section...');
    await page.click('button[data-section="holidays"]');
    await page.waitForTimeout(2000);

    // Check if multiplier is loaded
    const multiplierInput = await page.$('#default-multiplier');
    if (multiplierInput) {
      const currentValue = await multiplierInput.inputValue();
      console.log(`Current default multiplier: ${currentValue}`);

      // Set a new multiplier value
      console.log('Step 3: Setting new multiplier to 11...');
      await page.fill('#default-multiplier', '11');
      await page.click('#save-multiplier');
      await page.waitForTimeout(1500);

      // Check if saved message appears
      const savedMsg = await page.$('#multiplier-saved-msg');
      if (savedMsg) {
        const isVisible = await savedMsg.isVisible();
        console.log(`Multiplier saved message visible: ${isVisible}`);
      }
    }

    // Take screenshot of holiday management
    await page.screenshot({ path: 'test_holiday_admin_view.png', fullPage: true });
    console.log('Screenshot saved: test_holiday_admin_view.png');

    // Step 4: Now test staff welcome flow
    console.log('\nStep 4: Testing staff welcome flow...');

    // Open new incognito context for staff user
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    await page2.goto('http://127.0.0.1:58156/staff-welcome.html');
    await page2.waitForTimeout(2000);

    // Check if redirected to login
    const currentUrl = page2.url();
    if (currentUrl.includes('home.html') || currentUrl.includes('index.html')) {
      console.log('Redirected to login, logging in...');
      await page2.goto('http://127.0.0.1:58156/index.html');
      await page2.fill('#email', 'ben.howard@stoke.nhs.uk');
      await page2.fill('input[type="password"]', 'Hello1!');
      await page2.click('button:has-text("Sign In")');
      await page2.waitForTimeout(3000);

      // Navigate back to staff welcome
      await page2.goto('http://127.0.0.1:58156/staff-welcome.html');
      await page2.waitForTimeout(2000);
    }

    // Take screenshot of staff welcome state
    await page2.screenshot({ path: 'test_staff_welcome_state.png', fullPage: true });
    console.log('Screenshot saved: test_staff_welcome_state.png');

    // Step 5: Check database for entitlements
    console.log('\nStep 5: Checking database for entitlements...');

    // Go back to admin dashboard to check entitlements
    await page.reload();
    await page.waitForTimeout(2000);

    // Check if entitlements are displayed
    const entitlementsList = await page.$('#entitlements-list');
    if (entitlementsList) {
      const content = await entitlementsList.textContent();
      console.log('Entitlements list found:', content.substring(0, 100) + '...');

      // Take final screenshot
      await page.screenshot({ path: 'test_holiday_entitlements.png', fullPage: true });
      console.log('Screenshot saved: test_holiday_entitlements.png');
    }

    console.log('\n✅ Holiday management system test completed!');
    console.log('\nKey points to verify:');
    console.log('1. Default holiday multiplier can be saved in admin dashboard');
    console.log('2. Staff entitlements are calculated as: weekly hours/sessions × multiplier');
    console.log('3. Hours are displayed in HH:MM format for non-GP staff');
    console.log('4. Sessions are displayed as numbers for GP roles');
    console.log('5. Manual override option allows custom entitlements');

    await context2.close();

  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test_holiday_error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testHolidaySystem().catch(console.error);